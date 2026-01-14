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
import {
  createGradingScheme,
  updateGradingScheme,
  deleteGradingScheme,
} from "@/app/(dashboard)/settings/grading/actions"
import { useFormStatus } from "react-dom"

function SubmitButton({ isEdit }: { isEdit?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Grade" : "Add Grade"}
    </Button>
  )
}

export function GradingSystemTab({ gradingSchemes }: { gradingSchemes: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingScheme, setEditingScheme] = useState<any>(null)
  const { toast } = useToast()

  const handleSave = async (formData: FormData) => {
    try {
      const grade = formData.get("grade") as string
      const minScore = Number.parseInt(formData.get("min_score") as string)
      const maxScore = Number.parseInt(formData.get("max_score") as string)
      const remark = formData.get("remark") as string

      if (minScore >= maxScore) {
        toast({
          title: "Error",
          description: "Minimum score must be less than maximum score",
          variant: "destructive",
        })
        return
      }

      if (editingScheme) {
        await updateGradingScheme(editingScheme.id, {
          grade,
          min_score: minScore,
          max_score: maxScore,
          remark,
        })
        toast({ title: "Success", description: "Grade updated successfully" })
      } else {
        await createGradingScheme({
          grade,
          min_score: minScore,
          max_score: maxScore,
          remark,
        })
        toast({ title: "Success", description: "Grade added successfully" })
      }

      setIsOpen(false)
      setEditingScheme(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save grade",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteGradingScheme(id)
      toast({ title: "Success", description: "Grade deleted successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete grade",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Grading Scheme</CardTitle>
            <CardDescription>Define grade ranges and their corresponding letter grades</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingScheme(null)}>
                <IconPlus className="h-4 w-4 mr-1" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingScheme ? "Edit Grade" : "Add New Grade"}</DialogTitle>
                <DialogDescription>
                  {editingScheme ? "Update the grade details" : "Create a new grade scale entry"}
                </DialogDescription>
              </DialogHeader>
              <form action={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade Letter</Label>
                    <Input
                      id="grade"
                      name="grade"
                      placeholder="A"
                      defaultValue={editingScheme?.grade || ""}
                      maxLength={1}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remark">Remark</Label>
                    <Input
                      id="remark"
                      name="remark"
                      placeholder="Excellent"
                      defaultValue={editingScheme?.remark || ""}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_score">Min Score (%)</Label>
                    <Input
                      id="min_score"
                      name="min_score"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="80"
                      defaultValue={editingScheme?.min_score || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_score">Max Score (%)</Label>
                    <Input
                      id="max_score"
                      name="max_score"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="100"
                      defaultValue={editingScheme?.max_score || ""}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton isEdit={!!editingScheme} />
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {gradingSchemes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No grading scheme defined. Add grades to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grade</TableHead>
                <TableHead>Score Range</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradingSchemes.map((scheme) => (
                <TableRow key={scheme.id}>
                  <TableCell>
                    <Badge className="text-lg">{scheme.grade}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {scheme.min_score} - {scheme.max_score}%
                  </TableCell>
                  <TableCell className="text-muted-foreground">{scheme.remark}</TableCell>
                  <TableCell>
                    {scheme.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setEditingScheme(scheme)}>
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Grade</DialogTitle>
                            <DialogDescription>Update the grade details</DialogDescription>
                          </DialogHeader>
                          <form action={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="grade">Grade Letter</Label>
                                <Input
                                  id="grade"
                                  name="grade"
                                  placeholder="A"
                                  defaultValue={scheme.grade}
                                  maxLength={1}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="remark">Remark</Label>
                                <Input
                                  id="remark"
                                  name="remark"
                                  placeholder="Excellent"
                                  defaultValue={scheme.remark}
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="min_score">Min Score (%)</Label>
                                <Input
                                  id="min_score"
                                  name="min_score"
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="80"
                                  defaultValue={scheme.min_score}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="max_score">Max Score (%)</Label>
                                <Input
                                  id="max_score"
                                  name="max_score"
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="100"
                                  defaultValue={scheme.max_score}
                                  required
                                />
                              </div>
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
                            <AlertDialogTitle>Delete Grade?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the grade {scheme.grade}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(scheme.id)}
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
