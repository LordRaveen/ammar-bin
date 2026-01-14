"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createSubject, updateSubject, deleteSubject } from "@/app/(dashboard)/settings/subjects/actions"
import { useFormStatus } from "react-dom"

function SubmitButton({ isEdit }: { isEdit?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Subject" : "Add Subject"}
    </Button>
  )
}

export function SubjectManagementTab({ subjects }: { subjects: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const { toast } = useToast()

  const handleSave = async (formData: FormData) => {
    try {
      const name = formData.get("name") as string
      const code = formData.get("code") as string
      const description = formData.get("description") as string

      if (!name || !code) {
        toast({
          title: "Error",
          description: "Subject name and code are required",
          variant: "destructive",
        })
        return
      }

      if (editingSubject) {
        await updateSubject(editingSubject.id, { name, code, description })
        toast({ title: "Success", description: "Subject updated successfully" })
      } else {
        await createSubject({ name, code, description })
        toast({ title: "Success", description: "Subject added successfully" })
      }

      setIsOpen(false)
      setEditingSubject(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save subject",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSubject(id)
      toast({ title: "Success", description: "Subject deleted successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subject",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subject Catalog</CardTitle>
            <CardDescription>Create and manage subjects available in your school</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingSubject(null)}>
                <IconPlus className="h-4 w-4 mr-1" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
                <DialogDescription>
                  {editingSubject ? "Update the subject details" : "Create a new subject"}
                </DialogDescription>
              </DialogHeader>
              <form action={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Mathematics"
                    defaultValue={editingSubject?.name || ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g., MTH"
                    defaultValue={editingSubject?.code || ""}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Brief description of the subject"
                    defaultValue={editingSubject?.description || ""}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton isEdit={!!editingSubject} />
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No subjects defined. Add subjects to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{subject.code}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{subject.description || "-"}</TableCell>
                  <TableCell>
                    {subject.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setEditingSubject(subject)}>
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Subject</DialogTitle>
                            <DialogDescription>Update the subject details</DialogDescription>
                          </DialogHeader>
                          <form action={handleSave} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Subject Name</Label>
                              <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Mathematics"
                                defaultValue={subject.name}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="code">Subject Code</Label>
                              <Input
                                id="code"
                                name="code"
                                placeholder="e.g., MTH"
                                defaultValue={subject.code}
                                maxLength={10}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Input
                                id="description"
                                name="description"
                                placeholder="Brief description"
                                defaultValue={subject.description || ""}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" type="button">
                                Cancel
                              </Button>
                              <SubmitButton isEdit={true} />
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{subject.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(subject.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
