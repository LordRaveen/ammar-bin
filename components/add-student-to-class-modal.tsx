"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addStudentToClass } from "@/app/(dashboard)/classes/[id]/actions"
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  student_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  gender: string
}

interface AddStudentToClassModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  sessionId: string
  termId: string
  unenrolledStudents: Student[]
}

export function AddStudentToClassModal({
  open,
  onOpenChange,
  classId,
  sessionId,
  termId,
  unenrolledStudents,
}: AddStudentToClassModalProps) {
  const router = useRouter()
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudentId) return

    setLoading(true)
    try {
      await addStudentToClass(selectedStudentId, classId, sessionId, termId)
      onOpenChange(false)
      setSelectedStudentId("")
      router.refresh()
    } catch (error) {
      console.error("Failed to add student:", error)
      alert("Failed to add student to class")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student to Class</DialogTitle>
          <DialogDescription>
            Select a student to enroll in this class
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {unenrolledStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.first_name} {student.middle_name} {student.last_name} ({student.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStudentId}>
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
