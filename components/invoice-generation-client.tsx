"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Trash2, Users, FileText, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface InvoiceGenerationClientProps {
  activeSession: any
  activeTerm: any
  classes: any[]
  sessions: any[]
}

export function InvoiceGenerationClient({
  activeSession,
  activeTerm,
  classes,
  sessions,
}: InvoiceGenerationClientProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<"class" | "individual">("class")
  const [selectedSession, setSelectedSession] = useState(activeSession?.id || "")
  const [selectedTerm, setSelectedTerm] = useState(activeTerm?.id || "")
  const [selectedClass, setSelectedClass] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [feeItems, setFeeItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Get terms for selected session
  const selectedSessionData = sessions.find((s) => s.id === selectedSession)
  const terms = selectedSessionData?.terms || []

  // Load students when class is selected
  useEffect(() => {
    if (mode === "class" && selectedClass && selectedSession && selectedTerm) {
      loadStudentsForClass()
    }
  }, [selectedClass, selectedSession, selectedTerm, mode])

  // Load fee structures when session/term/class changes
  useEffect(() => {
    if (selectedSession && selectedTerm) {
      if (mode === "class" && selectedClass) {
        loadFeeStructures()
      } else if (mode === "individual" && selectedStudents.length > 0) {
        loadFeeStructures()
      }
    }
  }, [selectedSession, selectedTerm, selectedClass, selectedStudents, mode])

  const loadStudentsForClass = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/classes/${selectedClass}/students?sessionId=${selectedSession}&termId=${selectedTerm}`,
      )
      const data = await response.json()
      setStudents(data.students || [])
      setSelectedStudents(data.students?.map((s: any) => s.id) || [])
    } catch (error) {
      console.error("Error loading students:", error)
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFeeStructures = async () => {
    try {
      const classId = mode === "class" ? selectedClass : students[0]?.class_id
      if (!classId) return

      const response = await fetch(
        `/api/fee-structures?sessionId=${selectedSession}&termId=${selectedTerm}&classId=${classId}`,
      )
      const data = await response.json()
      setFeeItems(data.feeStructures || [])
    } catch (error) {
      console.error("Error loading fee structures:", error)
    }
  }

  const searchStudents = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.students || [])
    } catch (error) {
      console.error("Error searching students:", error)
    }
  }

  const addStudent = (student: any) => {
    if (!students.find((s) => s.id === student.id)) {
      setStudents([...students, student])
      setSelectedStudents([...selectedStudents, student.id])
    }
    setStudentSearch("")
    setSearchResults([])
  }

  const removeStudent = (studentId: string) => {
    setStudents(students.filter((s) => s.id !== studentId))
    setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
  }

  const handlePreview = () => {
    const totalAmount = feeItems.reduce((sum, item) => sum + Number.parseFloat(item.amount || 0), 0)

    setPreviewData({
      mode,
      sessionName: selectedSessionData?.name,
      termName: terms.find((t: any) => t.id === selectedTerm)?.name,
      className: classes.find((c) => c.id === selectedClass)?.name,
      studentsCount: selectedStudents.length,
      feeItems,
      totalAmount,
    })
    setShowPreview(true)
  }

  const handleGenerate = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      })
      return
    }

    if (feeItems.length === 0) {
      toast({
        title: "Error",
        description: "No fee items found for this class/term",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudents,
          sessionId: selectedSession,
          termId: selectedTerm,
          feeItems,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success!",
          description: `Generated ${data.count} invoice(s) successfully`,
        })
        // Reset form
        setSelectedClass("")
        setStudents([])
        setSelectedStudents([])
        setFeeItems([])
        setShowPreview(false)
      } else {
        throw new Error(data.error || "Failed to generate invoices")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoices",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Invoices</h1>
          <p className="text-muted-foreground">Create fee invoices for students</p>
        </div>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Mode</CardTitle>
          <CardDescription>Choose how to generate invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={mode === "class" ? "default" : "outline"}
              className="h-24 flex flex-col gap-2"
              onClick={() => setMode("class")}
            >
              <Users className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Bulk (By Class)</div>
                <div className="text-xs text-muted-foreground">Generate for entire class</div>
              </div>
            </Button>
            <Button
              variant={mode === "individual" ? "default" : "outline"}
              className="h-24 flex flex-col gap-2"
              onClick={() => setMode("individual")}
            >
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Individual</div>
                <div className="text-xs text-muted-foreground">Select specific students</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session & Term Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Period</CardTitle>
          <CardDescription>Select session and term for invoice generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                      {session.is_active && (
                        <Badge variant="default" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term: any) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                      {term.is_active && (
                        <Badge variant="default" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class/Student Selection */}
      {mode === "class" ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose class to generate invoices for all students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.section?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading && <p className="text-sm text-muted-foreground">Loading students...</p>}

            {students.length > 0 && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Students ({students.length})</h4>
                  <Badge>{selectedStudents.length} selected</Badge>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id])
                          } else {
                            setSelectedStudents(selectedStudents.filter((id) => id !== student.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span>
                        {student.first_name} {student.last_name} ({student.student_id})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select Students</CardTitle>
            <CardDescription>Search and add individual students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Student</Label>
              <Input
                placeholder="Search by name or ID..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value)
                  searchStudents(e.target.value)
                }}
              />
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => addStudent(student)}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                    >
                      {student.first_name} {student.last_name} ({student.student_id})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {students.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Students ({students.length})</Label>
                <div className="space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 border rounded-md">
                      <span className="text-sm">
                        {student.first_name} {student.last_name} ({student.student_id})
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => removeStudent(student.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fee Items Preview */}
      {feeItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Items</CardTitle>
            <CardDescription>Fees that will be included in the invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {feeItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">{item.fee_category_name}</span>
                  <span className="text-lg">₦{Number.parseFloat(item.amount).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg font-bold text-lg">
                <span>Total Amount</span>
                <span>
                  ₦{feeItems.reduce((sum, item) => sum + Number.parseFloat(item.amount || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Invoice Generation Preview
            </CardTitle>
            <CardDescription>Review before generating invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Session</p>
                <p className="font-medium">{previewData.sessionName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Term</p>
                <p className="font-medium">{previewData.termName}</p>
              </div>
              {previewData.className && (
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{previewData.className}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="font-medium">{previewData.studentsCount}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Fee Items</p>
              {previewData.feeItems.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm py-1">
                  <span>{item.fee_category_name}</span>
                  <span>₦{Number.parseFloat(item.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <span className="font-bold">Total per Student</span>
              <span className="text-xl font-bold">₦{previewData.totalAmount.toLocaleString()}</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                {generating ? "Generating..." : "Confirm & Generate"}
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {selectedStudents.length > 0 && feeItems.length > 0 && !showPreview && (
        <div className="flex justify-end gap-2">
          <Button onClick={handlePreview} size="lg">
            Preview Invoice
          </Button>
        </div>
      )}
    </div>
  )
}
