"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, UserPlus } from "lucide-react"
import { registerStudent } from "@/app/(dashboard)/students/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddGuardianFromStudentModal } from "@/components/add-guardian-from-student-modal"

interface RegisterStudentModalProps {
  guardians: Array<{
    id: string
    first_name: string
    last_name: string
    phone: string
  }>
}

export function RegisterStudentModal({ guardians: initialGuardians }: RegisterStudentModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAddGuardianModal, setShowAddGuardianModal] = useState(false)
  const [guardians, setGuardians] = useState(initialGuardians)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      await registerStudent(formData)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error registering student:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleGuardianCreated(newGuardian: { id: string; first_name: string; last_name: string; phone: string }) {
    setGuardians([...guardians, newGuardian])
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Register Student
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Student</DialogTitle>
            <DialogDescription>Add a new student to the school system</DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic student details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id">
                    Student ID <span className="text-destructive">*</span>
                  </Label>
                  <Input id="student_id" name="student_id" placeholder="e.g., STU001, ISM/2024/001" required />
                  <p className="text-sm text-muted-foreground">Enter a unique student ID for this student</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="first_name" name="first_name" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input id="middle_name" name="middle_name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="last_name" name="last_name" required />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input id="date_of_birth" name="date_of_birth" type="date" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Gender <span className="text-destructive">*</span>
                    </Label>
                    <Select name="gender" required>
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
                  <Textarea id="address" name="address" required rows={2} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="state_of_origin">State of Origin</Label>
                    <Input id="state_of_origin" name="state_of_origin" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" name="nationality" defaultValue="Nigerian" />
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
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admission_date">Admission Date</Label>
                  <Input
                    id="admission_date"
                    name="admission_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guardian Information</CardTitle>
                <CardDescription>Link student to parent/guardian</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground flex-1">
                    Create a new guardian before linking to student
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddGuardianModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Guardian
                  </Button>
                </div>

                {guardians && guardians.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="guardian_id">Select Guardian</Label>
                      <Select name="guardian_id">
                        <SelectTrigger>
                          <SelectValue placeholder="Choose guardian" />
                        </SelectTrigger>
                        <SelectContent>
                          {guardians.map((guardian) => (
                            <SelectItem key={guardian.id} value={guardian.id}>
                              {guardian.first_name} {guardian.last_name} - {guardian.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relationship">Relationship</Label>
                      <Select name="relationship">
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Guardian">Guardian</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No guardians available. Click "Add Guardian" above to create one.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Student"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AddGuardianFromStudentModal
        open={showAddGuardianModal}
        onOpenChange={setShowAddGuardianModal}
        onGuardianCreated={handleGuardianCreated}
      />
    </>
  )
}
