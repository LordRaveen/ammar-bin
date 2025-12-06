"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface EditAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: any
  onAnnouncementUpdated: (announcement: any) => void
}

export function EditAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
  onAnnouncementUpdated,
}: EditAnnouncementDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      id: announcement.id,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as string,
      priority: formData.get("priority") as string,
      target_audience: formData.get("target_audience") as string,
      expires_at: (formData.get("expires_at") as string) || null,
    }

    try {
      const response = await fetch("/api/announcements/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update announcement")

      const result = await response.json()
      onAnnouncementUpdated(result.announcement)
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>Update the announcement details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" defaultValue={announcement.title} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea id="content" name="content" defaultValue={announcement.content} rows={6} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select name="category" defaultValue={announcement.category} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Exam">Exam</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="PTA">PTA Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select name="priority" defaultValue={announcement.priority} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Important">Important</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience *</Label>
              <Select name="target_audience" defaultValue={announcement.target_audience} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Everyone</SelectItem>
                  <SelectItem value="Parents">Parents Only</SelectItem>
                  <SelectItem value="Teachers">Teachers Only</SelectItem>
                  <SelectItem value="Students">Students Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires On (Optional)</Label>
              <Input
                id="expires_at"
                name="expires_at"
                type="date"
                defaultValue={
                  announcement.expires_at ? new Date(announcement.expires_at).toISOString().split("T")[0] : ""
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
