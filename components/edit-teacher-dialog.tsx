"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Briefcase, ShieldCheck, UserCheck } from "lucide-react"

interface EditTeacherDialogProps {
  teacherId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (updatedTeacher: any) => void
}

export function EditTeacherDialog({ teacherId, open, onOpenChange, onSuccess }: EditTeacherDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingTeacher, setFetchingTeacher] = useState(true)
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    qualification: "",
    specialization: "",
    employment_date: "",
    employment_type: "",
    role: "",
    status: "",
  })

  useEffect(() => {
    if (open && teacherId) {
      fetchTeacher()
    }
  }, [open, teacherId])

  const fetchTeacher = async () => {
    setFetchingTeacher(true)
    try {
      const response = await fetch(`/api/teachers/${teacherId}`)
      if (!response.ok) throw new Error("Failed to fetch teacher")
      const teacher = await response.json()
      setFormData({
        first_name: teacher.first_name || "",
        middle_name: teacher.middle_name || "",
        last_name: teacher.last_name || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        date_of_birth: teacher.date_of_birth || "",
        gender: teacher.gender || "",
        address: teacher.address || "",
        qualification: teacher.qualification || "",
        specialization: teacher.specialization || "",
        employment_date: teacher.employment_date || "",
        employment_type: teacher.employment_type || "",
        role: teacher.role?.toLowerCase() || "",
        status: teacher.status || "Active",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load teacher data",
        variant: "destructive",
      })
    } finally {
      setFetchingTeacher(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/teachers/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, ...formData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update teacher")
      }

      const updatedTeacher = await response.json()

      toast({
        title: "Success",
        description: "Teacher updated successfully",
      })

      onSuccess(updatedTeacher)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Edit Staff Member</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update staff profile details and access permissions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {fetchingTeacher ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              
              {/* Personal Information */}
              <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Personal Details
                </h3>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-xs font-semibold">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="middle_name" className="text-xs font-semibold">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={formData.middle_name}
                      onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-xs font-semibold">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth" className="text-xs font-semibold">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs font-semibold">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
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
                  <Label htmlFor="address" className="text-xs font-semibold">Residential Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Professional Info
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="qualification" className="text-xs font-semibold">Qualification</Label>
                    <Input
                      id="qualification"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="specialization" className="text-xs font-semibold">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="employment_date" className="text-xs font-semibold">Employment Date</Label>
                    <Input
                      id="employment_date"
                      type="date"
                      value={formData.employment_date}
                      onChange={(e) => setFormData({ ...formData, employment_date: e.target.value })}
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="employment_type" className="text-xs font-semibold">Employment Type</Label>
                    <Select
                      value={formData.employment_type}
                      onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time" className="text-xs">Full-time</SelectItem>
                        <SelectItem value="Part-time" className="text-xs">Part-time</SelectItem>
                        <SelectItem value="Contract" className="text-xs">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active" className="text-xs">Active</SelectItem>
                        <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
                        <SelectItem value="On Leave" className="text-xs">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Role & Access */}
              <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Role & Access
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-semibold">Staff Role *</Label>
                  <Select
                    value={formData.role?.toLowerCase()}
                    onValueChange={(value) => setFormData({ ...formData, role: value.toLowerCase() })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher" className="text-xs">Teacher</SelectItem>
                      <SelectItem value="admin" className="text-xs">Administrator</SelectItem>
                      <SelectItem value="accountant" className="text-xs">Accountant</SelectItem>
                      <SelectItem value="cashier" className="text-xs">Cashier</SelectItem>
                      <SelectItem value="principal" className="text-xs">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Update Staff Member
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
