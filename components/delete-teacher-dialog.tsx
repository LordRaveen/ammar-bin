"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"

interface DeleteTeacherDialogProps {
  teacherId: string
  teacher: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (teacherId: string) => void
}

export function DeleteTeacherDialog({ teacherId, teacher, open, onOpenChange, onSuccess }: DeleteTeacherDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/teachers/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete teacher")
      }

      const name = [teacher?.first_name, teacher?.last_name].filter(Boolean).join(" ") || "Staff member"
      toast.success("Deleted Successfully", {
        description: `${name} has been removed.`,
      })

      onSuccess(teacherId)
      onOpenChange(false)
    } catch (error: any) {
      toast.error("Delete Failed", {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {teacher?.first_name} {teacher?.last_name}
              </span>
              ?
            </p>
            <p className="text-red-600 font-medium">This action cannot be undone.</p>
            <p className="text-sm">
              This will permanently delete the teacher record and associated user account (if any). Any classes assigned
              to this teacher will need to be reassigned.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Teacher
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
