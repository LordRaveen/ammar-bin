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
import { assignSubjectTeacher, removeSubjectTeacher } from "@/app/(dashboard)/classes/[id]/actions"

interface Teacher {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
}

interface ReassignTeacherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  sessionId: string
  subjectId: string
  subjectName: string
  currentTeacher?: {
    first_name: string
    last_name: string
  }
  teachers: Teacher[]
}

export function ReassignTeacherModal({
  open,
  onOpenChange,
  classId,
  sessionId,
  subjectId,
  subjectName,
  currentTeacher,
  teachers,
}: ReassignTeacherModalProps) {
  const [teacherId, setTeacherId] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleReassign() {
    if (!teacherId) return

    setLoading(true)
    try {
      await assignSubjectTeacher(classId, teacherId, subjectId, sessionId)
      onOpenChange(false)
      setTeacherId("")
    } catch (error) {
      console.error("Failed to reassign teacher:", error)
      alert("Failed to reassign teacher")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    if (!confirm("Are you sure you want to remove this subject teacher? The class teacher will teach this subject.")) {
      return
    }

    setLoading(true)
    try {
      await removeSubjectTeacher(classId, subjectId, sessionId)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to remove teacher:", error)
      alert("Failed to remove teacher")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign Teacher for {subjectName}</DialogTitle>
          <DialogDescription>
            {currentTeacher ? (
              <>
                Currently taught by {currentTeacher.first_name} {currentTeacher.last_name}.
                Select a new teacher or remove to have the class teacher teach this subject.
              </>
            ) : (
              <>
                Currently taught by the class teacher. Assign a special subject teacher if needed.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacher">New Teacher</Label>
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

          <div className="flex justify-between gap-2">
            <div>
              {currentTeacher && (
                <Button type="button" variant="destructive" onClick={handleRemove} disabled={loading}>
                  Remove Assignment
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleReassign} disabled={loading || !teacherId}>
                {loading ? "Reassigning..." : "Reassign Teacher"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
