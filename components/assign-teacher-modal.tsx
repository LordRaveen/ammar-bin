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
import { assignClassTeacher, assignSubjectTeacher } from "@/app/(dashboard)/classes/[id]/actions"
import { useRouter } from 'next/navigation'

interface Teacher {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
}

interface AssignTeacherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  sessionId: string
  teachers: Teacher[]
  type: "class" | "subject"
  subjectId?: string
  subjects?: Array<{ id: string; name: string }>
}

export function AssignTeacherModal({
  open,
  onOpenChange,
  classId,
  sessionId,
  teachers,
  type,
  subjectId,
  subjects,
}: AssignTeacherModalProps) {
  const router = useRouter()
  const [teacherId, setTeacherId] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjectId || "")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!teacherId) return
    if (type === "subject" && !selectedSubjectId) return

    setLoading(true)
    try {
      if (type === "class") {
        await assignClassTeacher(classId, teacherId, sessionId)
      } else {
        await assignSubjectTeacher(classId, teacherId, selectedSubjectId, sessionId)
      }
      onOpenChange(false)
      setTeacherId("")
      setSelectedSubjectId("")
      router.refresh()
    } catch (error) {
      console.error("Failed to assign teacher:", error)
      alert("Failed to assign teacher")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "class" ? "Assign Class Teacher" : "Assign Subject Teacher"}
          </DialogTitle>
          <DialogDescription>
            {type === "class"
              ? "Select a teacher to be the class teacher"
              : "Select a teacher for a specific subject"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "subject" && subjects && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.middle_name} {teacher.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !teacherId || (type === "subject" && !selectedSubjectId)}>
              {loading ? "Assigning..." : "Assign Teacher"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
