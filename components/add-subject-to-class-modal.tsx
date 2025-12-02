"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addSubjectToClass } from "@/app/(dashboard)/classes/[id]/actions"
import { useRouter } from 'next/navigation'

interface Subject {
  id: string
  name: string
  code: string
}

interface AddSubjectToClassModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  availableSubjects: Subject[]
}

export function AddSubjectToClassModal({
  open,
  onOpenChange,
  classId,
  availableSubjects,
}: AddSubjectToClassModalProps) {
  const router = useRouter()
  const [subjectId, setSubjectId] = useState("")
  const [maxScore, setMaxScore] = useState("100")
  const [passMark, setPassMark] = useState("40")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId) return

    setLoading(true)
    try {
      await addSubjectToClass(classId, subjectId, parseInt(maxScore), parseInt(passMark))
      onOpenChange(false)
      setSubjectId("")
      setMaxScore("100")
      setPassMark("40")
      router.refresh()
    } catch (error) {
      console.error("Failed to add subject:", error)
      alert("Failed to add subject to class")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Subject to Class</DialogTitle>
          <DialogDescription>
            Configure subject scoring for this class
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxScore">Max Score</Label>
              <Input
                id="maxScore"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passMark">Pass Mark</Label>
              <Input
                id="passMark"
                type="number"
                value={passMark}
                onChange={(e) => setPassMark(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !subjectId}>
              {loading ? "Adding..." : "Add Subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
