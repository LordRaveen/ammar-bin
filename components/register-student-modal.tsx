"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, UserPlus, User, GraduationCap, Users, HeartPulse, CheckCircle2 } from "lucide-react"
import { registerStudent } from "@/app/(dashboard)/students/register/actions"
import { AddGuardianFromStudentModal } from "@/components/add-guardian-from-student-modal"
import { SelectGuardianModal } from "@/components/select-guardian-modal"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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
  const [showSelectGuardianModal, setShowSelectGuardianModal] = useState(false)
  const [guardians, setGuardians] = useState(initialGuardians)
  const [selectedGuardian, setSelectedGuardian] = useState<any | null>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [enrollmentType, setEnrollmentType] = useState<"islamiyya" | "tahfeez" | "combined">("islamiyya")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedTahfeezClass, setSelectedTahfeezClass] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function loadClasses() {
      const supabase = createClient()
      const { data } = await supabase
        .from("classes")
        .select("id, name, section_id, section:sections(name)")
        .eq("is_active", true)
        .order("name")
      if (data) {
        setClasses(data)
      }
    }
    if (open) {
      loadClasses()
    }
  }, [open])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      // Append class inputs if selected
      if (enrollmentType === "combined") {
        if (selectedClass) formData.set("class_id", selectedClass)
        if (selectedTahfeezClass) formData.set("tahfeez_class_id", selectedTahfeezClass)
      } else if (enrollmentType === "islamiyya") {
        if (selectedClass) formData.set("class_id", selectedClass)
      } else {
        if (selectedTahfeezClass) formData.set("class_id", selectedTahfeezClass)
      }
      formData.set("enrollment_type", enrollmentType)

      // Set guardian info if selected
      if (selectedGuardian) {
        formData.set("guardian_id", selectedGuardian.guardianId)
        formData.set("relationship", selectedGuardian.relationship)
        formData.set("is_primary", selectedGuardian.isPrimary ? "true" : "false")
      }

      await registerStudent(formData)
      setOpen(false)
      setSelectedClass("")
      setSelectedTahfeezClass("")
      setSelectedGuardian(null)
      setEnrollmentType("islamiyya")
      router.refresh()
    } catch (error) {
      console.error("Error registering student:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleGuardianCreated(newGuardian: { id: string; first_name: string; last_name: string; phone: string }) {
    setGuardians([...guardians, newGuardian])
    setSelectedGuardian({
      guardianId: newGuardian.id,
      first_name: newGuardian.first_name,
      last_name: newGuardian.last_name,
      phone: newGuardian.phone,
      relationship: "Father",
      isPrimary: true,
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="h-8 text-xs font-semibold gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-3.5 w-3.5" />
            Register Student
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Register Student</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Add a new student profile and set up their class enrollment shift.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              
              {/* Personal Details */}
              <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Personal Details
                </h3>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-xs font-semibold">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="first_name" name="first_name" required className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="middle_name" className="text-xs font-semibold">Middle Name</Label>
                    <Input id="middle_name" name="middle_name" className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-xs font-semibold">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="last_name" name="last_name" required className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth" className="text-xs font-semibold">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input id="date_of_birth" name="date_of_birth" type="date" required className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs font-semibold">
                      Gender <span className="text-destructive">*</span>
                    </Label>
                    <Select name="gender" defaultValue="Male" required>
                      <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male" className="text-xs">Male</SelectItem>
                        <SelectItem value="Female" className="text-xs">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Residential Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea id="address" name="address" required rows={2} className="text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="state_of_origin" className="text-xs font-semibold">State of Origin</Label>
                    <Input id="state_of_origin" name="state_of_origin" className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nationality" className="text-xs font-semibold">Nationality</Label>
                    <Input id="nationality" name="nationality" defaultValue="Nigerian" className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                  </div>
                </div>
              </div>

              {/* Enrollment Info */}
              <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Enrollment Details
                </h3>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Enrollment Shift / Type *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "islamiyya", label: "Islamiyya" },
                      { value: "tahfeez", label: "Tahfeez" },
                      { value: "combined", label: "Combined (Dual)" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setEnrollmentType(type.value as any)
                          setSelectedClass("")
                          setSelectedTahfeezClass("")
                        }}
                        className={cn(
                          "py-2 px-3 text-[11px] font-semibold rounded-lg border transition-all duration-200 shadow-sm",
                          enrollmentType === type.value
                            ? "bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500 font-bold"
                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(enrollmentType === "islamiyya" || enrollmentType === "combined") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="class_id" className="text-xs font-semibold">Islamiyya Class <span className="text-destructive">*</span></Label>
                      <Select name="class_id" value={selectedClass} onValueChange={setSelectedClass} required>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                          <SelectValue placeholder="Choose Islamiyya Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes
                            .filter((c) => c.section?.name?.toLowerCase() === "islamiyya")
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                {c.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(enrollmentType === "tahfeez" || enrollmentType === "combined") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="tahfeez_class_id" className="text-xs font-semibold">Tahfeez Class <span className="text-destructive">*</span></Label>
                      <Select name="tahfeez_class_id" value={selectedTahfeezClass} onValueChange={setSelectedTahfeezClass} required>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                          <SelectValue placeholder="Choose Tahfeez Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes
                            .filter((c) => c.section?.name?.toLowerCase() === "tahfeez")
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                {c.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Guardian Info */}
              <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Guardian Connection
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddGuardianModal(true)}
                    className="h-7 text-[10px] font-semibold border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 px-2"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    New Guardian
                  </Button>
                </div>

                {selectedGuardian ? (
                  <div className="p-3 rounded-lg border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-950 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                        {selectedGuardian.relationship?.[0] || "P"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold">
                            {selectedGuardian.first_name} {selectedGuardian.last_name}
                          </p>
                          {selectedGuardian.isPrimary && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">
                          {selectedGuardian.relationship} {selectedGuardian.phone && `• ${selectedGuardian.phone}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedGuardian(null)}
                      className="h-7 text-[10px] font-semibold text-red-600 hover:bg-red-500/10 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 bg-white dark:bg-zinc-950 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-850 gap-2">
                    <p className="text-xs text-muted-foreground">No guardian linked yet.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSelectGuardianModal(true)}
                      className="h-7 text-xs font-semibold"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Select Existing Guardian
                    </Button>
                  </div>
                )}
              </div>

              {/* Additional & Medical details */}
              <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <HeartPulse className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Additional Info
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="admission_date" className="text-xs font-semibold">Admission Date</Label>
                    <Input
                      id="admission_date"
                      name="admission_date"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="medical_info" className="text-xs font-semibold">Medical Conditions / Allergies</Label>
                    <Input
                      id="medical_info"
                      name="medical_info"
                      placeholder="e.g. Asthma, Peanut Allergy (or None)"
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>
              </div>

            </div>

            <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Register Student</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddGuardianFromStudentModal
        open={showAddGuardianModal}
        onOpenChange={setShowAddGuardianModal}
        onGuardianCreated={handleGuardianCreated}
      />

      <SelectGuardianModal
        open={showSelectGuardianModal}
        onOpenChange={setShowSelectGuardianModal}
        mode="select_with_relationship"
        onSelect={(data) => setSelectedGuardian(data)}
      />
    </>
  )
}
