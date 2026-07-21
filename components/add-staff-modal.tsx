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
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, UserPlus, User, Briefcase, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react"
import { addStaff } from "@/app/(dashboard)/users/actions"
import { toast } from "sonner"

export function AddStaffModal() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const res = await addStaff(formData)
      if (res.success) {
        toast.success("Staff Member Added!", { description: "New staff record has been registered." })
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Failed to add staff", { description: res.error })
      }
    } catch (error: any) {
      toast.error("Error creating staff record", { description: error?.message || "Something went wrong" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-3.5 w-3.5" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Add Staff Member</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Register a new teacher, administrator, or finance staff account.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

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

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input id="email" name="email" type="email" required className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input id="phone" name="phone" type="tel" required placeholder="08012345678" className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-xs font-semibold">
                    Gender <span className="text-destructive">*</span>
                  </Label>
                  <Select name="gender" defaultValue="Male">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="date_of_birth" className="text-xs font-semibold">Date of Birth</Label>
                  <Input id="date_of_birth" name="date_of_birth" type="date" className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold">Residential Address</Label>
                  <Input id="address" name="address" className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                </div>
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
                  <Input id="qualification" name="qualification" placeholder="e.g. B.Ed, M.A." className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="specialization" className="text-xs font-semibold">Specialization</Label>
                  <Input id="specialization" name="specialization" placeholder="e.g. Qur'an, Mathematics" className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="employment_date" className="text-xs font-semibold">Employment Date</Label>
                  <Input
                    id="employment_date"
                    name="employment_date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="employment_type" className="text-xs font-semibold">Employment Type</Label>
                  <Select name="employment_type" defaultValue="Full-time">
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
              </div>
            </div>

            {/* Role & Account Creation */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Role & Access
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 items-center">
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-semibold">
                    Staff Role <span className="text-destructive">*</span>
                  </Label>
                  <Select name="role" defaultValue="teacher">
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

                <div className="pt-5 flex items-center space-x-2">
                  <Checkbox id="create_account" name="create_account" defaultChecked className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                  <Label htmlFor="create_account" className="text-xs font-medium cursor-pointer select-none">
                    Create portal user account
                  </Label>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Initial password will use the staff phone number if provided (6+ digits), or fallback to staff ID syntax.
              </p>
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
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Add Staff Member</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
