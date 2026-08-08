"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Loader2, 
  CheckCircle2, 
  School, 
  Users, 
  BookOpen,
  Lock
} from "lucide-react"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profileDetails, setProfileDetails] = useState<any>(null)
  
  // Profile Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    occupation: "",
    relationship: "",
    gender: "",
  })

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  })

  // Role info states
  const [assignedClasses, setAssignedClasses] = useState<any[]>([])
  const [linkedStudents, setLinkedStudents] = useState<any[]>([])

  const supabase = createClient()

  async function loadUserProfile() {
    setLoading(true)
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        toast.error("Not authenticated")
        return
      }

      setUser(authUser)

      // Query user role & status from user_profiles or default role
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, status")
        .eq("user_id", authUser.id)
        .maybeSingle()

      const userRole = profile?.role || authUser.user_metadata?.role || "admin"

      if (["teacher", "admin", "super_admin", "accountant", "cashier", "principal"].includes(userRole)) {
        // Fetch profile details from canonical user_profiles
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", authUser.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (profile) {
          setProfileDetails({ ...profile, role: userRole })
          setFormData({
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            phone: profile.phone || "",
            occupation: "",
            relationship: "",
            gender: profile.gender || "",
          })

          // If role is teacher, also query teachers table for class assignments
          if (userRole === "teacher") {
            const { data: teacher } = await supabase
              .from("teachers")
              .select(`
                id,
                teacher_class_assignments(
                  class:classes(
                    id,
                    name,
                    section:sections(name)
                  )
                )
              `)
              .eq("email", profile.email)
              .maybeSingle()

            if (teacher && teacher.teacher_class_assignments) {
              const classes = teacher.teacher_class_assignments.map((tca: any) => tca.class).filter(Boolean)
              setAssignedClasses(classes)
            }
          }
        }
      } else if (userRole === "parent") {
        // Fetch guardian / parent details
        const { data: guardian } = await supabase
          .from("guardians")
          .select(`
            *,
            student_guardians(
              relationship,
              is_primary,
              student:students(
                id,
                student_id,
                first_name,
                last_name,
                student_enrollments(
                  class:classes(name)
                )
              )
            )
          `)
          .eq("user_id", authUser.id)
          .maybeSingle()

        if (guardian) {
          setProfileDetails({ ...guardian, role: "parent" })
          setFormData({
            firstName: guardian.first_name || "",
            lastName: guardian.last_name || "",
            phone: guardian.phone || "",
            occupation: guardian.occupation || "",
            relationship: guardian.relationship || "",
            gender: guardian.gender || "",
          })

          // Extract children
          if (guardian.student_guardians) {
            const children = guardian.student_guardians.map((sg: any) => ({
              ...sg.student,
              relationship: sg.relationship,
              isPrimary: sg.is_primary,
            })).filter(Boolean)
            setLinkedStudents(children)
          }
        }
      }
    } catch (err) {
      console.error("Error loading user profile:", err)
      toast.error("Failed to load profile details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profileDetails) return

    setUpdating(true)
    try {
      const roleLower = profileDetails.role?.toLowerCase()
      const isStaff = ["teacher", "admin", "super_admin", "accountant", "cashier", "principal"].includes(roleLower)

      const updatePayload: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      }

      if (isStaff) {
        // Update user_profiles
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update(updatePayload)
          .eq("user_id", user.id)

        if (profileError) throw profileError

        // Also update teachers if they are a teacher
        if (roleLower === "teacher") {
          const { error: teacherError } = await supabase
            .from("teachers")
            .update(updatePayload)
            .eq("user_id", user.id)

          if (teacherError) {
            // Fallback by email if user_id link is not yet established
            await supabase
              .from("teachers")
              .update(updatePayload)
              .eq("email", profileDetails.email)
          }
        }
      } else {
        // Guardian update
        updatePayload.occupation = formData.occupation
        updatePayload.relationship = formData.relationship
        
        const { error } = await supabase
          .from("guardians")
          .update(updatePayload)
          .eq("user_id", user.id)

        if (error) throw error
      }

      toast.success("Profile updated successfully")
      loadUserProfile()
    } catch (err: any) {
      console.error("Error updating profile:", err)
      toast.error(err.message || "Failed to update profile details")
    } finally {
      setUpdating(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.password,
      })

      if (error) throw error

      toast.success("Password updated successfully")
      setPasswordForm({ password: "", confirmPassword: "" })
    } catch (err: any) {
      console.error("Error updating password:", err)
      toast.error(err.message || "Failed to update password")
    } finally {
      setUpdatingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Loading account details...</p>
        </div>
      </div>
    )
  }

  const initials = `${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`.toUpperCase() || "U"

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Profile Overview Header Card */}
      <Card className="border border-zinc-200/85 dark:border-zinc-800/85 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-none">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <Avatar className="h-20 w-20 border-2 border-zinc-100 dark:border-zinc-800">
            <AvatarFallback className="text-xl font-black bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
                  {formData.firstName} {formData.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">{user?.email}</span>
                </div>
              </div>
              <div>
                <Badge className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950">
                  {profileDetails?.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Tabs Container */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-zinc-100/60 dark:bg-zinc-900/60 p-1 rounded-xl w-full sm:w-auto">
          <TabsTrigger value="details" className="text-xs font-bold rounded-lg px-4 py-2">
            Profile Details
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs font-bold rounded-lg px-4 py-2">
            Security Settings
          </TabsTrigger>
          {profileDetails?.role === "teacher" && (
            <TabsTrigger value="classes" className="text-xs font-bold rounded-lg px-4 py-2">
              Assigned Classes
            </TabsTrigger>
          )}
          {profileDetails?.role === "parent" && (
            <TabsTrigger value="children" className="text-xs font-bold rounded-lg px-4 py-2">
              Children Details
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Profile Details Form */}
        <TabsContent value="details">
          <Card className="border border-zinc-200/85 dark:border-zinc-800/85 bg-white dark:bg-zinc-950 rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-wider">Account Details</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Update your contact details and basic information below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={updating}
                      className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/80 h-10 text-xs font-medium rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={updating}
                      className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/80 h-10 text-xs font-medium rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        required
                        placeholder="+234..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={updating}
                        className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/80 h-10 text-xs font-medium rounded-xl"
                      />
                    </div>
                  </div>

                  {profileDetails?.role === "parent" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="occupation" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Occupation
                        </Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          disabled={updating}
                          className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/80 h-10 text-xs font-medium rounded-xl"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={updating}
                    className="h-10 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile Details"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security & Password reset */}
        <TabsContent value="security">
          <Card className="border border-zinc-200/85 dark:border-zinc-800/85 bg-white dark:bg-zinc-950 rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-wider">Change Password</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Update your account password. Choose a strong combination of keys.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pass" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      New Password
                    </Label>
                    <Input
                      id="pass"
                      type="password"
                      required
                      placeholder="Min. 8 characters"
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                      disabled={updatingPassword}
                      className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/80 h-10 text-xs font-medium rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPass" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPass"
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      disabled={updatingPassword}
                      className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/80 h-10 text-xs font-medium rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={updatingPassword}
                    className="h-10 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Assigned Classes (For Teachers) */}
        <TabsContent value="classes">
          <Card className="border border-zinc-200/85 dark:border-zinc-800/85 bg-white dark:bg-zinc-950 rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-wider">Your Assigned Classes</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Classes currently assigned to you for this academic session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedClasses.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {assignedClasses.map((cls: any) => (
                    <div 
                      key={cls.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-900/10"
                    >
                      <div className="h-9 w-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-50 dark:text-zinc-950 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-foreground">{cls.name}</p>
                        <p className="text-[10px] text-muted-foreground">{cls.section?.name || "No section"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-6">No classes currently assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Children Details (For Parents) */}
        <TabsContent value="children">
          <Card className="border border-zinc-200/85 dark:border-zinc-800/85 bg-white dark:bg-zinc-950 rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-wider">Linked Children</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Children/Students linked to your guardian account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedStudents.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {linkedStudents.map((child: any) => (
                    <div 
                      key={child.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-900/10"
                    >
                      <div className="h-9 w-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-50 dark:text-zinc-950 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-foreground">
                          {child.first_name} {child.last_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          ID: {child.student_id} | Relationship: {child.relationship || "Guardian"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-6">No children accounts linked yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
