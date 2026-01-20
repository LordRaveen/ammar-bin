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

interface BulkGenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkGenerateModal({ open, onOpenChange }: BulkGenerateModalProps) {
  const [session, setSession] = useState("")
  const [term, setTerm] = useState("")
  const [classId, setClassId] = useState("")
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
    if (!session || !term || !classId) {
      alert("Please select session, term, and class")
      return
    }

    if (studentMode === "selected" && selectedStudents.size === 0) {
      alert("Please select at least one student")
      return
    }

    setGenerating(true)
    try {
      // TODO: Call API to generate invoices
      console.log("[v0] Generating invoices for:", {
        session,
        term,
        classId,
        studentMode,
        students: studentMode === "all" ? "all" : Array.from(selectedStudents),
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      onOpenChange(false)
      alert("Invoices generated successfully!")
    } catch (error) {
      console.error("[v0] Error generating invoices:", error)
      alert("Error generating invoices")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoices</DialogTitle>
        </DialogHeader>

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
            <label className="text-sm font-medium mb-2 block">1st Term</label>
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

          {/* Class */}
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

          {/* Students Mode */}
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

          {/* Student List */}
          {studentMode === "selected" && students.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-2 pb-2 border-b">
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

              {/* Student List */}
              <ScrollArea className="h-48">
                <div className="space-y-2 pr-4">
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

          {studentMode === "selected" && students.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No students enrolled in this class for the selected term
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateInvoices}
            disabled={generating || !session || !term || !classId}
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
