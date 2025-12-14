"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { updateStudent } from "@/app/(dashboard)/students/actions" // Fixed import path to correct location

interface EditStudentModalProps {
  student: any
  guardians: Array<{
    id: string
    first_name: string
    last_name: string
    phone: string
  }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditStudentModal({ student, guardians, open, onOpenChange }: EditStudentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      formData.append("student_id", student.id)
      const result = await updateStudent(formData)

      if (result.success) {
        toast({
          title: "Student Updated",
          description: "Student information has been updated successfully.",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update student",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student information</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic student details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student_id_display">Student ID</Label>
                <Input id="student_id_display" value={student.student_id} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Student ID cannot be changed after creation</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="first_name" name="first_name" defaultValue={student.first_name} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input id="middle_name" name="middle_name" defaultValue={student.middle_name || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="last_name" name="last_name" defaultValue={student.last_name} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    defaultValue={student.date_of_birth}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select name="gender" defaultValue={student.gender} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Textarea id="address" name="address" defaultValue={student.address} required rows={2} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state_of_origin">State of Origin</Label>
                  <Input id="state_of_origin" name="state_of_origin" defaultValue={student.state_of_origin || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" name="nationality" defaultValue={student.nationality || "Nigerian"} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Medical and admission details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medical_info">Medical Information</Label>
                <Textarea
                  id="medical_info"
                  name="medical_info"
                  placeholder="Allergies, medical conditions, special needs..."
                  defaultValue={student.medical_info || ""}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admission_date">Admission Date</Label>
                <Input id="admission_date" name="admission_date" type="date" defaultValue={student.admission_date} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={student.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Graduated">Graduated</SelectItem>
                    <SelectItem value="Transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
