"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createBrowserClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface BulkGenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkGenerateModal({ open, onOpenChange }: BulkGenerateModalProps) {
  const [session, setSession] = useState("")
  const [term, setTerm] = useState("")
  const [scope, setScope] = useState<"single" | "multiple" | "school">("single")
  const [classId, setClassId] = useState("")
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set())
  const [studentMode, setStudentMode] = useState<"all" | "selected">("all")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [sessions, setSessions] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  const supabase = createBrowserClient()

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await supabase
          .from("sessions")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: false })
        setSessions(data || [])
      } catch (error) {
        console.error("[v0] Error fetching sessions:", error)
      }
    }
    fetchSessions()
  }, [supabase])

  // Fetch terms when session changes
  useEffect(() => {
    if (!session) return
    const fetchTerms = async () => {
      try {
        const { data } = await supabase
          .from("terms")
          .select("*")
          .eq("session_id", session)
          .eq("is_active", true)
          .order("term_number", { ascending: true })
        setTerms(data || [])
      } catch (error) {
        console.error("[v0] Error fetching terms:", error)
      }
    }
    fetchTerms()
  }, [session, supabase])

  // Fetch classes when session changes
  useEffect(() => {
    if (!session) return
    const fetchClasses = async () => {
      try {
        const { data } = await supabase
          .from("classes")
          .select("*, sections(name)")
          .eq("is_active", true)
          .order("name", { ascending: true })
        setClasses(data || [])
      } catch (error) {
        console.error("[v0] Error fetching classes:", error)
      }
    }
    fetchClasses()
  }, [session, supabase])

  // Fetch students when class changes
  useEffect(() => {
    if (!classId || !term) {
      setStudents([])
      return
    }

    const fetchStudents = async () => {
      try {
        const { data: enrollments } = await supabase
          .from("student_enrollments")
          .select("students(id, first_name, last_name, student_id)")
          .eq("class_id", classId)
          .eq("term_id", term)

        const studentList = enrollments?.map((e: any) => e.students).filter(Boolean) || []
        setStudents(studentList)
        setSelectedStudents(new Set())
        setSelectAll(false)
      } catch (error) {
        console.error("[v0] Error fetching students:", error)
      }
    }

    fetchStudents()
  }, [classId, term, supabase])

  const handleSelectClass = (classIdValue: string, checked: boolean) => {
    const newSelected = new Set(selectedClasses)
    if (checked) {
      newSelected.add(classIdValue)
    } else {
      newSelected.delete(classIdValue)
    }
    setSelectedClasses(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedStudents(new Set(students.map((s) => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
    setSelectAll(newSelected.size === students.length && students.length > 0)
  }

  const handleGenerateInvoices = async () => {
    if (!session || !term) {
      toast.error("Please select session and term")
      return
    }

    if (scope === "single" && !classId) {
      toast.error("Please select a class")
      return
    }

    if (scope === "multiple" && selectedClasses.size === 0) {
      toast.error("Please select at least one class")
      return
    }

    if (scope === "single" && studentMode === "selected" && selectedStudents.size === 0) {
      toast.error("Please select at least one student")
      return
    }

    setGenerating(true)
    const loadingToastId = toast.loading("Generating invoices...")
    
    try {
      // Determine which classes to process
      const classesToProcess: string[] = 
        scope === "single" 
          ? [classId]
          : scope === "multiple"
            ? Array.from(selectedClasses)
            : classes.map(c => c.id) // entire school

      let totalInvoicesCreated = 0

      // Process each class
      for (const currentClassId of classesToProcess) {
        // For single class with selected students, use those; otherwise use all students in class
        let studentsToProcess: string[] = []

        if (scope === "single" && studentMode === "selected") {
          studentsToProcess = Array.from(selectedStudents)
        } else {
          const { data: enrollments } = await supabase
            .from("student_enrollments")
            .select("student_id")
            .eq("class_id", currentClassId)
            .eq("term_id", term)

          studentsToProcess = enrollments?.map((e) => e.student_id) || []
        }

        if (studentsToProcess.length === 0) continue

        // Fetch fee structures for this class
        const { data: feeStructures } = await supabase
          .from("fee_structures")
          .select("*")
          .eq("session_id", session)
          .eq("term_id", term)
          .eq("class_id", currentClassId)
          .eq("active", true)

        if (!feeStructures || feeStructures.length === 0) continue

        // Create invoices for each student
        for (const studentId of studentsToProcess) {
          try {
            // Check if invoice already exists
            const { data: existingInvoice } = await supabase
              .from("invoices")
              .select("id")
              .eq("student_id", studentId)
              .eq("session_id", session)
              .eq("term_id", term)
              .single()

            if (existingInvoice) continue

            const { data: student } = await supabase
              .from("students")
              .select("id, first_name, last_name, student_id")
              .eq("id", studentId)
              .single()

            if (!student) continue

            const { data: guardianLink } = await supabase
              .from("student_guardians")
              .select("guardian_id")
              .eq("student_id", studentId)
              .eq("is_primary", true)
              .single()

            const totalAmount = feeStructures.reduce((sum, fs) => sum + Number(fs.amount), 0)
            const dueDate = feeStructures[0]?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

            const { data: invoice, error: invoiceError } = await supabase
              .from("invoices")
              .insert({
                student_id: studentId,
                parent_id: guardianLink?.guardian_id || null,
                session_id: session,
                term_id: term,
                total_amount: totalAmount,
                amount_paid: 0,
                balance: totalAmount,
                due_date: dueDate,
                status: "Pending",
                invoice_number: `INV-${Math.floor(Math.random() * 900000000) + 100000000}`,
                generated_at: new Date().toISOString(),
              })
              .select()
              .single()

            if (invoiceError) continue

            const invoiceItems = feeStructures.map((fs) => ({
              invoice_id: invoice.id,
              fee_category_id: fs.fee_category_id,
              description: fs.name,
              amount: fs.amount,
            }))

            const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)
            if (!itemsError) {
              totalInvoicesCreated++
            }
          } catch (error) {
            console.error("[v0] Error processing student:", error)
          }
        }
      }

      toast.dismiss(loadingToastId)
      
      if (totalInvoicesCreated > 0) {
        toast.success(`Successfully generated ${totalInvoicesCreated} invoice(s)`)
      } else {
        toast.warning("No new invoices were created (may already exist)")
      }

      onOpenChange(false)
      
      // Reset form
      setSession("")
      setTerm("")
      setScope("single")
      setClassId("")
      setSelectedClasses(new Set())
      setStudentMode("all")
      setSelectedStudents(new Set())
      setSelectAll(false)
    } catch (error) {
      console.error("[v0] Error generating invoices:", error)
      toast.dismiss(loadingToastId)
      toast.error("Error generating invoices. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate Invoices</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8 min-h-96 overflow-y-auto pr-4">
          {/* Left Column - Filters */}
          <div className="space-y-4">
            {/* Session */}
            <div>
              <label className="text-sm font-medium mb-2 block">Session</label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Term */}
            <div>
              <label className="text-sm font-medium mb-2 block">Term</label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scope */}
            <div>
              <label className="text-sm font-medium mb-2 block">Scope</label>
              <Select value={scope} onValueChange={(val: any) => setScope(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Class</SelectItem>
                  <SelectItem value="multiple">Multiple Classes</SelectItem>
                  <SelectItem value="school">Entire School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class (for single class scope) */}
            {scope === "single" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Class</label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.sections?.name ? `- ${c.sections.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Students Mode (only for single class) */}
            {scope === "single" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Students</label>
                <Select value={studentMode} onValueChange={(val: any) => setStudentMode(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="selected">Select Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Right Column - Class/Student Selection */}
          <div className="border-l pl-4">
            {/* Multiple Classes Selection */}
            {scope === "multiple" && (
              <div>
                <label className="text-sm font-medium mb-3 block">Select Classes</label>
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-4">
                    {classes.map((c: any) => (
                      <div key={c.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${c.id}`}
                          checked={selectedClasses.has(c.id)}
                          onCheckedChange={(checked) => handleSelectClass(c.id, Boolean(checked))}
                        />
                        <label htmlFor={`class-${c.id}`} className="text-sm cursor-pointer flex-1">
                          {c.name} {c.sections?.name ? `- ${c.sections.name}` : ""}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Entire School Message */}
            {scope === "school" && (
              <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
                <p className="text-sm">Invoices will be generated for all classes in {term ? "the selected term" : "this session"}</p>
              </div>
            )}

            {/* Student Selection (single class only) */}
            {scope === "single" && studentMode === "selected" && students.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-3 block">Select Students</label>
                <ScrollArea className="h-64 border rounded-lg p-3">
                  <div className="space-y-2 pr-4">
                    <div className="flex items-center space-x-2 pb-2 border-b sticky top-0 bg-background">
                      <Checkbox
                        id="select-all"
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium cursor-pointer flex-1">
                        Select All
                      </label>
                      <span className="text-xs text-muted-foreground">{selectedStudents.size}</span>
                    </div>
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={student.id}
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, Boolean(checked))}
                        />
                        <label htmlFor={student.id} className="text-sm cursor-pointer flex-1 flex items-center gap-2">
                          <span>{student.first_name} {student.last_name}</span>
                          <span className="text-xs text-muted-foreground">{student.student_id}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {scope === "single" && studentMode === "selected" && students.length === 0 && (
              <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
                <p className="text-sm">No students enrolled in this class for the selected term</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateInvoices}
            disabled={generating || !session || !term || (scope === "single" && !classId) || (scope === "multiple" && selectedClasses.size === 0)}
            className="gap-2"
          >
            {generating && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate Invoices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
