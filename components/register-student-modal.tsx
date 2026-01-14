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
import { Plus, Loader2 } from "lucide-react"
import { registerStudent } from "@/app/(dashboard)/students/actions"
import { createGuardian } from "@/app/(dashboard)/guardians/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
  const [showAddGuardian, setShowAddGuardian] = useState(false)
  const [guardianLoading, setGuardianLoading] = useState(false)
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

  async function handleAddGuardian(formData: FormData) {
    setGuardianLoading(true)
    try {
      const newGuardian = await createGuardian(formData)
      // Add the newly created guardian to the list
      setGuardians([
        ...guardians,
        {
          id: newGuardian.id,
          first_name: newGuardian.first_name,
          last_name: newGuardian.last_name,
          phone: newGuardian.phone,
        },
      ])
      setShowAddGuardian(false)
    } catch (error) {
      console.error("Error creating guardian:", error)
    } finally {
      setGuardianLoading(false)
    }
  }

  return (
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
              <CardDescription>Link to parent/guardian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                            {guardian.first_name} {guardian.last_name}
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

                  <Button type="button" variant="outline" onClick={() => setShowAddGuardian(true)} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Guardian
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground mb-4">
                  No guardians registered yet. Add one using the button below.
                </div>
              )}

              {showAddGuardian && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-4">Add New Guardian</h4>
                  <form action={handleAddGuardian} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="g_first_name">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input id="g_first_name" name="first_name" placeholder="Ahmad" required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="g_middle_name">Middle Name</Label>
                        <Input id="g_middle_name" name="middle_name" placeholder="Muhammad" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="g_last_name">
                          Last Name <span className="text-destructive">*</span>
                        </Label>
                        <Input id="g_last_name" name="last_name" placeholder="Ibrahim" required />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="g_email">Email</Label>
                        <Input id="g_email" name="email" type="email" placeholder="ahmad@example.com" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="g_phone">
                          Phone Number <span className="text-destructive">*</span>
                        </Label>
                        <Input id="g_phone" name="phone" type="tel" placeholder="08012345678" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="g_address">
                        Address <span className="text-destructive">*</span>
                      </Label>
                      <Input id="g_address" name="address" placeholder="No 1, Gwamna Awan Road, Kaduna" required />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="g_occupation">Occupation</Label>
                        <Input id="g_occupation" name="occupation" placeholder="Business Owner" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="g_relationship_type">
                          Relationship Type <span className="text-destructive">*</span>
                        </Label>
                        <Select name="relationship_type" required>
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
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={guardianLoading} className="flex-1">
                        {guardianLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Guardian"
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddGuardian(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
