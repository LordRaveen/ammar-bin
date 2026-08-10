"use client"

import { useState, useEffect, useMemo } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Loader2, Mail, Phone, MapPin, Briefcase, Calendar, Users, Search, Trash2, GraduationCap, CheckCircle2, UserCheck, AlertCircle, Lock, Shield, UserX, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { assignClassTeacher, unassignClassTeacher } from "@/app/(dashboard)/classes/[id]/actions"
import { cn } from "@/lib/utils"
import { EditTeacherDialog } from "@/components/edit-teacher-dialog"
import { DeleteTeacherDialog } from "@/components/delete-teacher-dialog"

interface TeacherDetailsSheetProps {
  teacherId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EnrichedClass {
  id: string
  name: string
  section_id?: string
  class_teacher_id?: string | null
  section?: { name: string } | null
  teacher_name?: string | null
  student_count: number
}

export function TeacherDetailsSheet({ teacherId, open, onOpenChange }: TeacherDetailsSheetProps) {
  const [teacher, setTeacher] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [assignClassModalOpen, setAssignClassModalOpen] = useState(false)
  const [allClasses, setAllClasses] = useState<EnrichedClass[]>([])
  const [currentSession, setCurrentSession] = useState<string>("")
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "unassigned" | "assigned">("all")
  const [assigning, setAssigning] = useState(false)
  const [unassigningId, setUnassigningId] = useState<string | null>(null)
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleSendPasswordReset = async () => {
    if (!teacher?.email) return
    setActionLoading("reset")
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(teacher.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      toast.success("Password reset email sent successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async () => {
    if (!teacher) return
    const newStatus = teacher.status === "Active" ? "Inactive" : "Active"
    setActionLoading("status")
    try {
      const response = await fetch("/api/teachers/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          teacherId: teacher.id,
          first_name: teacher.first_name,
          middle_name: teacher.middle_name || "",
          last_name: teacher.last_name,
          email: teacher.email,
          phone: teacher.phone,
          date_of_birth: teacher.date_of_birth || "",
          gender: teacher.gender || "",
          address: teacher.address || "",
          qualification: teacher.qualification || "",
          specialization: teacher.specialization || "",
          employment_date: teacher.employment_date || "",
          employment_type: teacher.employment_type || "",
          role: teacher.role,
          status: newStatus 
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update status")
      }

      toast.success(`Staff member marked as ${newStatus}`)
      fetchTeacherAndClasses()
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeletedSuccess = () => {
    onOpenChange(false)
    window.location.reload()
  }

  const fetchTeacherAndClasses = async () => {
    if (!teacherId || !open) {
      setTeacher(null)
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const [
        { data: sessionData },
        { data: initialProfileData, error: profileError },
        { data: classesData, error: classesError },
        { data: teachersData },
        { data: enrollmentsData },
      ] = await Promise.all([
        supabase.from("sessions").select("id").eq("is_active", true).maybeSingle(),
        supabase
          .from("user_profiles")
          .select("*")
          .eq("id", teacherId)
          .maybeSingle(), // Use maybeSingle to prevent PGRST116 error if teacherId is a teachers.id
        supabase
          .from("classes")
          .select("id, name, class_teacher_id, section_id, section:sections(name)")
          .eq("is_active", true)
          .order("name"),
        supabase.from("teachers").select("id, user_id, first_name, last_name, email"),
        supabase.from("student_enrollments").select("class_id").eq("is_active", true),
      ])

      if (classesError) {
        console.error("Classes query error:", classesError)
      }

      if (sessionData) {
        setCurrentSession(sessionData.id)
      }

      // Map teacher names by id and user_id as fallback
      const teacherMap = new Map<string, string>()
      teachersData?.forEach((t) => {
        const fullName = `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Teacher"
        if (t.id) teacherMap.set(t.id, fullName)
        if (t.user_id) teacherMap.set(t.user_id, fullName)
      })

      const studentCountMap = new Map<string, number>()
      enrollmentsData?.forEach((e) => {
        if (e.class_id) {
          studentCountMap.set(e.class_id, (studentCountMap.get(e.class_id) || 0) + 1)
        }
      })

      const enriched: EnrichedClass[] =
        classesData?.map((c: any) => {
          let tName: string | null = null
          if (c.class_teacher_id) {
            tName = teacherMap.get(c.class_teacher_id) || "Assigned Teacher"
          }

          return {
            id: c.id,
            name: c.name,
            section_id: c.section_id,
            class_teacher_id: c.class_teacher_id,
            section: c.section,
            teacher_name: tName,
            student_count: studentCountMap.get(c.id) || 0,
          }
        }) || []

      setAllClasses(enriched)

      let profileData = initialProfileData
      let teacherAssignments: any[] = []
      let actualTeacherId = teacherId

      if (!profileData) {
        // If not found in user_profiles by ID, it means teacherId is a teachers.id (clicked from Teachers Directory)
        const { data: tData } = await supabase
          .from("teachers")
          .select(`
            *,
            teacher_class_assignments(
              class:classes(
                id,
                name,
                section:sections(name)
              )
            )
          `)
          .eq("id", teacherId)
          .maybeSingle()

        if (!tData) {
          throw new Error("Staff/Teacher record not found")
        }

        const { data: uProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("email", tData.email)
          .maybeSingle()

        profileData = uProfile || {
          ...tData,
          role: "teacher" // Fallback role if user profile is missing
        }
        actualTeacherId = tData.id
        teacherAssignments = tData.teacher_class_assignments || []
      } else {
        // teacherId is a user_profiles.id (clicked from Staff Directory)
        actualTeacherId = profileData.id
        
        if (profileData.role?.toLowerCase() === "teacher") {
          const { data: tData } = await supabase
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
            .eq("email", profileData.email)
            .maybeSingle()

          if (tData) {
            actualTeacherId = tData.id
            teacherAssignments = tData.teacher_class_assignments || []
          }
        }
      }

      setTeacher({
        ...profileData,
        id: actualTeacherId,
        teacher_class_assignments: teacherAssignments,
        // Map date_of_joining to employment_date or fallback to created_at
        date_of_joining: profileData.employment_date || profileData.created_at,
      })
    } catch (err) {
      console.error("Error fetching teacher details:", err)
      toast.error("Failed to load teacher information")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeacherAndClasses()
  }, [teacherId, open])

  // Extract unique sections
  const sectionsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    allClasses.forEach((c) => {
      if (c.section?.name) {
        map.set(c.section.name.toLowerCase(), {
          id: c.section.name.toLowerCase(),
          name: c.section.name,
        })
      }
    })
    return Array.from(map.values())
  }, [allClasses])

  // Counts for status filter
  const statusCounts = useMemo(() => {
    const unassigned = allClasses.filter((c) => !c.class_teacher_id).length
    const assigned = allClasses.filter((c) => !!c.class_teacher_id).length
    return { all: allClasses.length, unassigned, assigned }
  }, [allClasses])

  // Filter classes by active section tab, status filter & search query
  const filteredClasses = useMemo(() => {
    return allClasses.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.section?.name && c.section.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.teacher_name && c.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTab =
        activeTab === "all" || (c.section?.name && c.section.name.toLowerCase() === activeTab.toLowerCase())

      let matchesStatus = true
      if (statusFilter === "unassigned") {
        matchesStatus = !c.class_teacher_id
      } else if (statusFilter === "assigned") {
        matchesStatus = !!c.class_teacher_id
      }

      return matchesSearch && matchesTab && matchesStatus
    })
  }, [allClasses, searchQuery, activeTab, statusFilter])

  const handleUnassign = async (classId: string, className: string) => {
    if (!teacherId) return
    setUnassigningId(classId)
    try {
      await unassignClassTeacher(classId, teacherId)
      toast.success(`Removed from ${className}`)
      // Update local teacher assignments state
      setTeacher((prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          teacher_class_assignments: prev.teacher_class_assignments.filter((a: any) => a.class?.id !== classId),
        }
      })
      // Update local classes state
      setAllClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, class_teacher_id: null, teacher_name: null } : c))
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to unassign class")
    } finally {
      setUnassigningId(null)
    }
  }

  const handleAssign = async () => {
    if (!selectedClassId || !teacherId) return
    setAssigning(true)
    try {
      await assignClassTeacher(selectedClassId, teacherId, currentSession)
      const assignedClass = allClasses.find((c) => c.id === selectedClassId)
      toast.success(`Assigned ${assignedClass?.name || "class"} to ${teacher.first_name}`)

      setAssignClassModalOpen(false)
      setSelectedClassId(null)
      // Refetch teacher details to update view
      await fetchTeacherAndClasses()
    } catch (err: any) {
      toast.error(err.message || "Failed to assign class")
    } finally {
      setAssigning(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Teacher Profile & Assignments
            </SheetTitle>
            <SheetDescription>View profile details and manage assigned classes</SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium">Loading teacher profile...</p>
            </div>
          ) : teacher ? (
            <div className="px-6 py-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-emerald-500/20 shadow-sm">
                  <AvatarFallback className="text-lg font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {getInitials(teacher.first_name, teacher.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-xl font-bold tracking-tight">
                      {teacher.first_name} {teacher.last_name}
                    </h2>
                    <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                      {teacher.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mb-2">{teacher.staff_id}</p>
                  <Badge variant="outline" className="font-medium">
                    {teacher.role}
                  </Badge>
                </div>
              </div>

              {/* Account Actions Section */}
              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Account Actions
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendPasswordReset}
                    disabled={!!actionLoading}
                    className="h-9 text-xs font-semibold gap-1.5 border-zinc-200 dark:border-zinc-800"
                  >
                    {actionLoading === "reset" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    Reset Pass
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={!!actionLoading}
                    className="h-9 text-xs font-semibold gap-1.5 border-zinc-200 dark:border-zinc-800"
                  >
                    {actionLoading === "status" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : teacher.status === "Active" ? (
                      <UserX className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {teacher.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    disabled={!!actionLoading}
                    className="h-9 text-xs font-semibold gap-1.5 border-zinc-200 dark:border-zinc-800"
                  >
                    <Pencil className="h-3.5 w-3.5 text-emerald-500" />
                    Edit Profile
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={!!actionLoading}
                    className="h-9 text-xs font-semibold gap-1.5 border-zinc-200 dark:border-zinc-800 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    Delete Staff
                  </Button>
                </div>
              </div>

              <Separator className="bg-zinc-100 dark:bg-zinc-900" />

              {/* Contact Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                    <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Email</p>
                      <p className="text-xs font-medium truncate">{teacher.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                    <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Phone</p>
                      <p className="text-xs font-medium truncate">{teacher.phone || "N/A"}</p>
                    </div>
                  </div>
                  {teacher.address && (
                    <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                      <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Address</p>
                        <p className="text-xs font-medium truncate">{teacher.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-zinc-100 dark:bg-zinc-900" />

              {/* Professional Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Professional Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {teacher.qualification && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                      <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Qualification</p>
                        <p className="text-xs font-medium">{teacher.qualification}</p>
                      </div>
                    </div>
                  )}
                  {teacher.date_of_joining && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                      <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Date of Joining</p>
                        <p className="text-xs font-medium">
                          {new Date(teacher.date_of_joining).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Classes */}
              {teacher.role?.toLowerCase() === "teacher" && (
                <>
                  <Separator className="bg-zinc-100 dark:bg-zinc-900" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Assigned Classes ({teacher.teacher_class_assignments?.length || 0})
                      </h3>
                      <Button
                        onClick={() => {
                          setSelectedClassId(null)
                          setSearchQuery("")
                          setActiveTab("all")
                          setStatusFilter("all")
                          setAssignClassModalOpen(true)
                        }}
                        size="sm"
                        className="h-8 gap-1.5 text-xs font-semibold"
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        Assign Class
                      </Button>
                    </div>

                    {teacher.teacher_class_assignments && teacher.teacher_class_assignments.length > 0 ? (
                      <div className="space-y-2">
                        {teacher.teacher_class_assignments.map((assignment: any) => {
                          const cls = assignment.class
                          if (!cls) return null
                          const isDeleting = unassigningId === cls.id

                          return (
                            <div
                              key={cls.id}
                              className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                                  {cls.name?.[0] || "C"}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">
                                    {cls.name}
                                    {cls.section?.name && (
                                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                                        ({cls.section.name})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isDeleting}
                                onClick={() => handleUnassign(cls.id, cls.name)}
                                className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 transition-colors"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                <span>Unassign</span>
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4 border border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium text-muted-foreground">No classes assigned to this teacher yet.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Modern Sleek Assign Class Modal */}
      {teacher && (
        <Dialog open={assignClassModalOpen} onOpenChange={setAssignClassModalOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl rounded-2xl">
            <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">Assign Class to Teacher</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Select an unassigned class to assign to{" "}
                    <span className="font-semibold text-foreground">
                      {teacher.first_name} {teacher.last_name}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-5 space-y-3.5">
              {/* Search & Status Filter Row */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search class name, section, or teacher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs h-9 bg-zinc-50/50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                {/* Compact Status Filter Dropdown */}
                <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                  <SelectTrigger className="h-9 w-[150px] text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all" className="text-xs">All ({statusCounts.all})</SelectItem>
                    <SelectItem value="unassigned" className="text-xs">Unassigned ({statusCounts.unassigned})</SelectItem>
                    <SelectItem value="assigned" className="text-xs">Assigned ({statusCounts.assigned})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Section Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full flex h-9 overflow-x-auto bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl justify-start gap-1 scrollbar-none">
                  <TabsTrigger
                    value="all"
                    className="text-xs px-3 py-1 rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm"
                  >
                    All Sections ({allClasses.length})
                  </TabsTrigger>
                  {sectionsList.map((sec) => {
                    const count = allClasses.filter(
                      (c) => c.section?.name && c.section.name.toLowerCase() === sec.id
                    ).length

                    return (
                      <TabsTrigger
                        key={sec.id}
                        value={sec.id}
                        className="text-xs px-3 py-1 rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm"
                      >
                        {sec.name} ({count})
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>

              {/* Classes List with Custom Sleek Scrollbar */}
              <div className="max-h-[320px] overflow-y-auto space-y-2.5 pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => {
                    const isSelected = selectedClassId === cls.id
                    const isAssignedToThisTeacher = cls.class_teacher_id === teacher.id
                    const isAlreadyAssigned = !!cls.class_teacher_id

                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          if (isAlreadyAssigned) return
                          setSelectedClassId(cls.id)
                        }}
                        className={cn(
                          "p-3 rounded-xl border transition-all flex items-center justify-between gap-3",
                          isAlreadyAssigned
                            ? "opacity-60 cursor-not-allowed bg-zinc-100/40 dark:bg-zinc-900/20 border-zinc-200/50 dark:border-zinc-800/50"
                            : isSelected
                            ? "cursor-pointer border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-500/50 shadow-sm"
                            : "cursor-pointer border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Selection indicator or lock */}
                          {isAlreadyAssigned ? (
                            <div className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 bg-zinc-200/50 dark:bg-zinc-800/50">
                              <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-zinc-300 dark:border-zinc-700"
                              )}
                            >
                              {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("font-semibold text-xs tracking-tight", isAlreadyAssigned && "text-muted-foreground")}>
                                {cls.name}
                              </span>
                              {cls.section?.name && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] py-0 px-1.5 font-normal bg-zinc-200/60 dark:bg-zinc-800"
                                >
                                  {cls.section.name}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                {cls.student_count} student{cls.student_count !== 1 ? "s" : ""}
                              </span>

                              <span className="text-zinc-300 dark:text-zinc-700">•</span>

                              {isAssignedToThisTeacher ? (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  Currently assigned to this teacher
                                </span>
                              ) : cls.teacher_name ? (
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  Teacher: <strong className="font-semibold text-foreground">{cls.teacher_name}</strong>
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-2 py-0.5">
                            Selected
                          </Badge>
                        ) : isAlreadyAssigned ? (
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground border-zinc-300 dark:border-zinc-800">
                            Unavailable
                          </Badge>
                        ) : null}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-10 px-4 border border-dashed rounded-xl border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-medium text-muted-foreground">No classes found matching filter criteria</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignClassModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAssign}
                disabled={!selectedClassId || assigning}
                className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Assign Class</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {teacher && (
        <>
          <EditTeacherDialog
            teacherId={teacher.id}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            onSuccess={() => {
              fetchTeacherAndClasses()
              window.location.reload()
            }}
          />

          <DeleteTeacherDialog
            teacherId={teacher.id}
            teacher={teacher}
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onSuccess={handleDeletedSuccess}
          />
        </>
      )}
    </>
  )
}
