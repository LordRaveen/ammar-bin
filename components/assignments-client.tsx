"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Calendar, BookOpen, Users } from "lucide-react"
import { toast } from "sonner"

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  total_marks: number
  status: string
  classes: { name: string }
  subjects: { name: string }
}

interface Props {
  userRole: string
  teacherId: string
  assignments: Assignment[]
  teacherClasses: any[]
  activeSession: any
  activeTerm: any
}

export default function AssignmentsClient({
  userRole,
  teacherId,
  assignments,
  teacherClasses,
  activeSession,
  activeTerm,
}: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class_id: "",
    subject_id: "",
    due_date: "",
    total_marks: "100",
  })

  const handleCreate = async () => {
    if (!formData.title || !formData.class_id || !formData.subject_id || !formData.due_date) {
      toast.error("Please fill all required fields")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/assignments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          teacher_id: teacherId,
          session_id: activeSession?.id,
          term_id: activeTerm?.id,
        }),
      })

      if (!response.ok) throw new Error("Failed to create assignment")

      toast.success("Assignment created successfully")
      window.location.reload()
    } catch (error) {
      toast.error("Failed to create assignment")
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === "active") return "default"
    if (status === "closed") return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">Create and manage homework assignments for your classes</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Add homework or classwork for your students</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Enter assignment title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(teacherClasses.map((tc) => tc.classes?.id))).map((classId) => {
                        const classData = teacherClasses.find((tc) => tc.classes?.id === classId)?.classes
                        return (
                          <SelectItem key={classId} value={classId}>
                            {classData?.name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                    disabled={!formData.class_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherClasses
                        .filter((tc) => tc.class_id === formData.class_id)
                        .map((tc) => (
                          <SelectItem key={tc.subject_id} value={tc.subject_id}>
                            {tc.subjects?.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter assignment instructions and details..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No assignments created yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <Badge variant={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                </div>
                <CardDescription>{assignment.subjects.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{assignment.classes.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
                <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                  <a href={`/assignments/${assignment.id}`}>View Details</a>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
