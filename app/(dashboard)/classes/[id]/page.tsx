"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconUsers,
  IconBook,
  IconChartBar,
  IconPlus,
  IconTrash,
  IconEdit,
  IconUserPlus,
  IconMail,
  IconPhone,
  IconArrowUpRight,
  IconGenderMale,
  IconGenderFemale,
  IconCalendarStats,
  IconSchool,
  IconChevronRight,
  IconCertificate,
  IconSettings,
  IconAlertTriangle,
  IconArchive,
  IconRefresh,
  IconId,
  IconHierarchy,
  IconArrowRight,
  IconUserShield
} from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createBrowserClient } from "@/lib/supabase/client"
import { AddStudentToClassModal } from "@/components/add-student-to-class-modal"
import { AddSubjectToClassModal } from "@/components/add-subject-to-class-modal"
import { AssignTeacherModal } from "@/components/assign-teacher-modal"
import { ReassignTeacherModal } from "@/components/reassign-teacher-modal"
import { removeStudentFromClass, removeSubjectFromClass, updateClass, deleteClass } from "./actions"
import { ScoreEntryInterface } from "@/components/score-entry-interface"
import { MarkAttendanceInterface } from "@/components/mark-attendance-interface"
import { ResultFinalizationInterface } from "@/components/result-finalization-interface"
import { isAdmin } from "@/lib/auth/role-redirect"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export const dynamic = "force-dynamic"

interface ClassDetails {
  id: string
  name: string
  capacity: number
  section: {
    name: string
  }
  teacher?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    photo_url: string | null
  }
  student_count: number
  subject_count: number
  attendance_rate?: number
}

interface EnrolledStudent {
  id: string
  enrollment_id: string
  student_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  gender: string
  status: string
  photo_url: string | null
}

interface ClassSubject {
  id: string
  subject: {
    id: string
    name: string
    code: string
  }
  max_score: number
  pass_mark: number
  teacher?: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function ClassDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params?.id as string | undefined
  const supabase = createBrowserClient()

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([])
  const [unenrolledStudents, setUnenrolledStudents] = useState<any[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([])
  const [allTeachers, setAllTeachers] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [showAssignClassTeacherModal, setShowAssignClassTeacherModal] = useState(false)
  const [showAssignSubjectTeacherModal, setShowAssignSubjectTeacherModal] = useState(false)
  const [showReassignTeacherModal, setShowReassignTeacherModal] = useState(false)
  const [allSections, setAllSections] = useState<any[]>([])
  const [allClasses, setAllClasses] = useState<any[]>([])
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [settingsForm, setSettingsForm] = useState({
    name: "",
    capacity: 0,
    sectionId: "",
  })

  const [tempSubjectForReassign, setTempSubjectForReassign] = useState<{
    id: string
    name: string
    teacher?: any
  } | null>(null)

  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined" && classId) {
      fetchSessionsAndTerms()
    }
  }, [classId])

  useEffect(() => {
    if (selectedSession && selectedTerm && classId) {
      fetchAllData()
    }
  }, [classId, selectedSession, selectedTerm])

  async function fetchSessionsAndTerms() {
    const { data: sessionsData } = await supabase.from("sessions").select("*").order("start_date", { ascending: false })

    if (sessionsData && sessionsData.length > 0) {
      setSessions(sessionsData)
      const activeSession = sessionsData.find((s) => s.is_active) || sessionsData[0]
      setSelectedSession(activeSession.id)

      const { data: termsData } = await supabase
        .from("terms")
        .select("*")
        .eq("session_id", activeSession.id)
        .order("term_number")

      if (termsData && termsData.length > 0) {
        setTerms(termsData)
        const activeTerm = termsData.find((t) => t.is_active) || termsData[0]
        setSelectedTerm(activeTerm.id)
      }
    }
  }

  async function fetchAllData() {
    try {
      setLoading(true)

      const { data: classData } = await supabase
        .from("classes")
        .select("*, section:sections(name)")
        .eq("id", classId)
        .single()

      if (classData) {
        let teacherData = null
        if (classData.class_teacher_id) {
          const { data: teacher } = await supabase
            .from("teachers")
            .select("id, first_name, last_name, email, phone, photo_url")
            .eq("id", classData.class_teacher_id)
            .single()

          teacherData = teacher
        }

        const { count: studentCount } = await supabase
          .from("student_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("class_id", classId)
          .eq("session_id", selectedSession)
          .eq("term_id", selectedTerm)
          .eq("is_active", true)

        const { count: subjectCount } = await supabase
          .from("class_subjects")
          .select("*", { count: "exact", head: true })
          .eq("class_id", classId)

        setClassDetails({
          ...classData,
          teacher: teacherData || undefined,
          student_count: studentCount || 0,
          subject_count: subjectCount || 0,
        })

        setSettingsForm({
          name: classData.name,
          capacity: classData.capacity,
          sectionId: classData.section_id,
        })
      }

      const { data: sectionsData } = await supabase
        .from("sections")
        .select("*")
        .eq("is_active", true)

      setAllSections(sectionsData || [])

      const { data: classesData } = await supabase
        .from("classes")
        .select("id, name, section:sections(name)")
        .order("name")

      setAllClasses(classesData || [])

      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("id, students(*)")
        .eq("class_id", classId)
        .eq("session_id", selectedSession)
        .eq("term_id", selectedTerm)
        .eq("is_active", true)

      if (enrollments) {
        const students = enrollments.map((e) => ({
          enrollment_id: e.id,
          ...(e.students as any),
        }))
        setEnrolledStudents(students)
      }

      const { data: allStudents } = await supabase.from("students").select("*").eq("status", "Active")

      const enrolledIds = new Set(enrolledStudents.map((s) => s.id))
      const unenrolled = (allStudents || []).filter((s) => !enrolledIds.has(s.id))
      setUnenrolledStudents(unenrolled)

      const { data: subjects } = await supabase
        .from("class_subjects")
        .select("*, subject:subjects(*)")
        .eq("class_id", classId)

      if (subjects) {
        const subjectIds = subjects.map((s) => s.subject_id)
        const { data: assignments } = await supabase
          .from("teacher_subject_assignments")
          .select("subject_id, teacher:teachers(first_name, last_name, email)")
          .eq("class_id", classId)
          .eq("session_id", selectedSession)
          .in("subject_id", subjectIds)

        const teacherMap = new Map((assignments || []).map((a) => [a.subject_id, a.teacher]))

        const enrichedSubjects = subjects.map((s) => ({
          ...s,
          teacher: teacherMap.get(s.subject_id),
        }))

        setClassSubjects(enrichedSubjects)
      }

      const { data: allSubjects } = await supabase.from("subjects").select("*").eq("is_active", true)

      const assignedSubjectIds = new Set((subjects || []).map((s) => s.subject_id))
      const available = (allSubjects || []).filter((s) => !assignedSubjectIds.has(s.id))
      setAvailableSubjects(available)

      const { data: teachers } = await supabase.from("teachers").select("*").eq("status", "Active")

      setAllTeachers(teachers || [])
    } catch (error) {
      console.error("[v0] Error fetching class data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedSession) {
      supabase
        .from("terms")
        .select("*")
        .eq("session_id", selectedSession)
        .order("term_number")
        .then(({ data }) => {
          if (data) {
            setTerms(data)
            setSelectedTerm(data[0]?.id || "")
          }
        })
    }
  }, [selectedSession])

  useEffect(() => {
    if (!classId || !selectedSession || !selectedTerm) return

    // Subscribe to student enrollments changes
    const enrollmentsChannel = supabase
      .channel(`enrollments-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_enrollments",
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          fetchAllData()
        },
      )
      .subscribe()

    // Subscribe to class subjects changes
    const subjectsChannel = supabase
      .channel(`subjects-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "class_subjects",
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          fetchAllData()
        },
      )
      .subscribe()

    // Subscribe to teacher assignments changes
    const teachersChannel = supabase
      .channel(`teachers-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teacher_subject_assignments",
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          fetchAllData()
        },
      )
      .subscribe()

    // Subscribe to classes table for teacher updates
    const classChannel = supabase
      .channel(`class-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "classes",
          filter: `id=eq.${classId}`,
        },
        (payload) => {
          fetchAllData()
        },
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(enrollmentsChannel)
      supabase.removeChannel(subjectsChannel)
      supabase.removeChannel(teachersChannel)
      supabase.removeChannel(classChannel)
    }
  }, [classId, selectedSession, selectedTerm])

  async function handleRemoveStudent(enrollmentId: string) {
    if (confirm("Are you sure you want to remove this student from the class?")) {
      try {
        await removeStudentFromClass(enrollmentId, classId)
      } catch (error) {
        alert("Failed to remove student")
      }
    }
  }

  async function handleRemoveSubject(classSubjectId: string) {
    if (confirm("Are you sure you want to remove this subject from the class?")) {
      try {
        await removeSubjectFromClass(classSubjectId, classId)
      } catch (error) {
        alert("Failed to remove subject")
      }
    }
  }

  function handleReassignTeacher(subject: any) {
    setTempSubjectForReassign({
      id: subject.subject.id,
      name: subject.subject.name,
      teacher: subject.teacher,
    })
    setShowReassignTeacherModal(true)
  }

  useEffect(() => {
    async function fetchUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()

        if (data) {
          setUserRole(data.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  const hasAdminAccess = isAdmin(userRole)

  if (!classId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invalid class ID</p>
        <Button onClick={() => router.push("/classes")} className="mt-4">
          Back to Classes
        </Button>
      </div>
    )
  }

  if (loading || !classDetails) {
    return <div className="text-muted-foreground text-center py-12">Loading class details...</div>
  }

  const teacherInitials = classDetails.teacher
    ? `${classDetails.teacher.first_name[0]}${classDetails.teacher.last_name[0]}`
    : "??"

  // Calculate strategic metrics
  const totalStudents = enrolledStudents.length
  const maleCount = enrolledStudents.filter(s => s.gender?.toLowerCase() === 'male').length
  const femaleCount = enrolledStudents.filter(s => s.gender?.toLowerCase() === 'female').length
  const malePercentage = totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0
  const occupancy = classDetails.capacity > 0 ? Math.round((totalStudents / classDetails.capacity) * 100) : 0

  return (
    <div className="space-y-8 pt-4">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/classes")}
          className="h-12 w-12 rounded-xl border-slate-200 dark:border-slate-800 hidden md:flex"
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <IconSchool className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{classDetails.name}</h1>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-900 border-none">
                  {classDetails.section.name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                Current Academic Period: <span className="font-bold text-foreground">{sessions.find(s => s.id === selectedSession)?.name}</span>
                <IconChevronRight size={12} className="text-slate-300" />
                <span className="font-bold text-foreground">{terms.find(t => t.id === selectedTerm)?.name}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 gap-1.5">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[140px] h-9 text-[11px] font-bold border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id} className="text-xs font-medium">
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[120px] h-9 text-[11px] font-bold border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id} className="text-xs font-medium">
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex justify-start">
          <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1 h-auto gap-0.5 border border-slate-200/50 dark:border-slate-800">
            {["overview", "students", "subjects", "scores", "attendance", "finalize", "settings"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="px-5 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8 outline-none animate-in fade-in-50 duration-500">
          {/* Metric Cockpit */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border shadow-none bg-white dark:bg-slate-950 overflow-hidden relative">
              <CardContent className="px-5 py-0">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Occupancy</p>
                  <IconUsers className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-2xl font-black">{totalStudents}</span>
                  <span className="text-[11px] text-muted-foreground font-bold mb-1">/ {classDetails.capacity} Seats</span>
                </div>
                <Progress value={occupancy} className="h-1.5" />
                <p className="text-[10px] font-bold text-blue-600 mt-2 flex justify-between">
                  <span>{occupancy}% Capacity</span>
                  <span>{classDetails.capacity - totalStudents} Remaining</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-none bg-white dark:bg-slate-950 overflow-hidden">
              <CardContent className="px-5 py-0">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gender Mix</p>
                  <div className="flex gap-1.5">
                    <IconGenderMale className="h-3.5 w-3.5 text-blue-500" />
                    <IconGenderFemale className="h-3.5 w-3.5 text-pink-500" />
                  </div>
                </div>
                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <span className="text-xl font-black block leading-none">{maleCount}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Boys</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xl font-black block leading-none text-right">{femaleCount}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block text-right">Girls</span>
                  </div>
                </div>
                <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-pink-100 dark:bg-pink-900/20">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${malePercentage}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 flex justify-between uppercase">
                  <span className="text-blue-600">{malePercentage}%</span>
                  <span className="text-pink-600">{100 - malePercentage}%</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-none bg-white dark:bg-slate-950 overflow-hidden">
              <CardContent className="px-5 py-0">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Curriculum</p>
                  <IconBook className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-2xl font-black">{classDetails.subject_count}</span>
                  <span className="text-[11px] text-muted-foreground font-bold mb-1">Subjects Registered</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full", i <= classDetails.subject_count ? "bg-emerald-500" : "bg-slate-100 dark:bg-slate-800")} />
                  ))}
                </div>
                <p className="text-[10px] font-bold text-emerald-600 mt-2">Core learning tracks</p>
              </CardContent>
            </Card>

            <Card className="border shadow-none bg-white dark:bg-slate-950 overflow-hidden">
              <CardContent className="px-5 py-0">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attendance</p>
                  <IconCalendarStats className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-2xl font-black">{classDetails.attendance_rate || 95}%</span>
                  <span className="text-[11px] text-muted-foreground font-bold mb-1">This Term</span>
                </div>
                <div className="flex gap-1">
                  {[1, 1, 1, 1, 1, 1, 1, 1, 1, 0].map((v, i) => (
                    <div key={i} className={cn("h-4 flex-1 rounded-sm", v ? "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800" : "bg-slate-50 dark:bg-slate-900")} />
                  ))}
                </div>
                <p className="text-[10px] font-bold text-orange-600 mt-1 flex items-center gap-1">
                  <IconArrowUpRight size={10} /> Stable engagement
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* VIP Class Teacher Profile */}
            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-all duration-700">
                <IconUserPlus size={120} />
              </div>
              <CardHeader className="relative z-10 pb-0 flex flex-row items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Class Lead</span>
                  <CardTitle className="text-xl font-black mt-1 uppercase italic">Director of Studies</CardTitle>
                </div>
                {!classDetails.teacher && hasAdminAccess && (
                  <Button
                    onClick={() => setShowAssignClassTeacherModal(true)}
                    size="sm"
                    className="bg-white text-black hover:bg-slate-200 h-8 text-[10px] font-black uppercase"
                  >
                    Assign Lead
                  </Button>
                )}
              </CardHeader>
              <CardContent className="relative z-10 mt-6">
                {classDetails.teacher ? (
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-4 border-slate-800 shadow-2xl">
                        {classDetails.teacher.photo_url && (
                          <AvatarImage src={classDetails.teacher.photo_url} />
                        )}
                        <AvatarFallback className="bg-blue-600 text-white text-2xl font-black">
                          {teacherInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-black leading-none">{classDetails.teacher.first_name} {classDetails.teacher.last_name}</h3>
                        <p className="text-slate-400 text-xs font-bold mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                          <IconCertificate size={12} className="text-blue-400" />
                          Head Instructor
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border-none">
                          <IconMail size={14} />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border-none">
                          <IconPhone size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl">
                    <p className="text-slate-500 text-xs font-bold uppercase italic tracking-widest">No primary lead assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specialist Teachers Grid */}
            <Card className="lg:col-span-2 border shadow-none bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1 bg-blue-600 rounded-full" />
                    <CardTitle className="text-xs font-black uppercase tracking-widest leading-none">Specialist Subject Tracks</CardTitle>
                  </div>
                  {hasAdminAccess && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignSubjectTeacherModal(true)}
                      className="h-7 text-[10px] font-black uppercase border-slate-200 dark:border-slate-800"
                    >
                      <IconPlus size={12} className="mr-1.5" />
                      Add Specialist
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800">
                  {classSubjects.filter(cs => cs.teacher).map((cs) => (
                    <div key={cs.id} className="bg-white dark:bg-slate-950 p-4 flex items-center gap-4 group">
                      <Avatar className="h-10 w-10 border dark:border-slate-800 group-hover:scale-110 transition-transform">
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                          {cs.teacher!.first_name[0]}{cs.teacher!.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-tight leading-none text-blue-600 dark:text-blue-400">{cs.subject.name}</p>
                        <p className="text-sm font-bold mt-1">{cs.teacher!.first_name} {cs.teacher!.last_name}</p>
                      </div>
                      {hasAdminAccess && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleReassignTeacher(cs)}
                        >
                          <IconEdit size={14} className="text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {classSubjects.filter(cs => cs.teacher).length === 0 && (
                  <div className="p-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <IconUsers size={20} className="text-slate-300" />
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase italic tracking-widest">
                      All curricula managed by primary lead
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>{enrolledStudents.length} student(s) enrolled</CardDescription>
              </div>
              {hasAdminAccess && (
                <Button onClick={() => setShowAddStudentModal(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Status</TableHead>
                    {hasAdminAccess && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.length > 0 ? (
                    enrolledStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Avatar>
                            {student.photo_url && <AvatarImage src={student.photo_url || "/placeholder.svg"} />}
                            <AvatarFallback>
                              {student.first_name[0]}
                              {student.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>
                          {student.first_name} {student.middle_name} {student.last_name}
                        </TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        {hasAdminAccess && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveStudent(student.enrollment_id)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={hasAdminAccess ? 6 : 5} className="text-center text-muted-foreground py-8">
                        No students enrolled in this class yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Class Subjects</CardTitle>
                <CardDescription>{classSubjects.length} subject(s) configured</CardDescription>
              </div>
              {hasAdminAccess && (
                <Button onClick={() => setShowAddSubjectModal(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Max Score</TableHead>
                    <TableHead>Pass Mark</TableHead>
                    <TableHead>Teacher</TableHead>
                    {hasAdminAccess && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSubjects.length > 0 ? (
                    classSubjects.map((cs) => (
                      <TableRow key={cs.id}>
                        <TableCell className="font-medium">{cs.subject.name}</TableCell>
                        <TableCell>{cs.subject.code}</TableCell>
                        <TableCell>{cs.max_score}</TableCell>
                        <TableCell>{cs.pass_mark}</TableCell>
                        <TableCell>
                          {cs.teacher ? (
                            <span>
                              {cs.teacher.first_name} {cs.teacher.last_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Class teacher</span>
                          )}
                        </TableCell>
                        {hasAdminAccess && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReassignTeacher(cs)}
                                title="Reassign teacher"
                              >
                                <IconUserPlus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <IconEdit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(cs.id)}>
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={hasAdminAccess ? 6 : 5} className="text-center text-muted-foreground py-8">
                        No subjects added to this class yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores">
          <ScoreEntryInterface
            classId={classId}
            sessionId={selectedSession}
            termId={selectedTerm}
            students={enrolledStudents}
            subjects={classSubjects.map((cs) => ({
              id: cs.subject.id,
              name: cs.subject.name,
              code: cs.subject.code,
              max_score: cs.max_score,
              pass_mark: cs.pass_mark,
            }))}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <MarkAttendanceInterface
            classId={classId}
            sessionId={selectedSession}
            termId={selectedTerm}
            students={enrolledStudents}
          />
        </TabsContent>

        <TabsContent value="finalize" className="outline-none animate-in fade-in-50 duration-500">
          <Card className="border shadow-none bg-white dark:bg-slate-950">
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-900/60">
              <CardTitle className="text-base font-bold">Finalize Results & Evaluate Skills</CardTitle>
              <CardDescription>Assess student affective/psychomotor skills and submit tutor comments.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {classId && selectedSession && selectedTerm && enrolledStudents.length > 0 ? (
                <ResultFinalizationInterface
                  sessions={sessions}
                  terms={terms}
                  classData={classDetails}
                  classes={allClasses}
                  students={enrolledStudents.map((s) => ({
                    id: s.id,
                    student_id: s.student_id,
                    first_name: s.first_name,
                    middle_name: s.middle_name,
                    last_name: s.last_name,
                    photo_url: s.photo_url,
                    date_of_birth: s.date_of_birth,
                    gender: s.gender
                  }))}
                  initialSessionId={selectedSession}
                  initialTermId={selectedTerm}
                  initialClassId={classId}
                  showSelectors={false}
                  showTitle={false}
                />
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No enrolled students or active academic term selection found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-8 outline-none animate-in fade-in-50 duration-500">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Identity Zone */}
            <Card className={cn(
              "border shadow-none overflow-hidden",
              !hasAdminAccess && "opacity-60 pointer-events-none"
            )}>
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <IconId size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Identity Zone</CardTitle>
                    <CardDescription className="text-[10px] font-bold">Manage class naming and placement</CardDescription>
                  </div>
                  {!hasAdminAccess && (
                    <Badge className="ml-auto bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-black">ADMIN ONLY</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class Label</Label>
                    <Input
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-900 border-none font-bold placeholder:italic"
                      placeholder="e.g. Grade 1 Gold"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strategic Section</Label>
                    <Select
                      value={settingsForm.sectionId}
                      onValueChange={(val) => setSettingsForm({ ...settingsForm, sectionId: val })}
                    >
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-none font-bold">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {allSections.map((sec) => (
                          <SelectItem key={sec.id} value={sec.id} className="font-bold">{sec.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Capacity</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={settingsForm.capacity}
                        onChange={(e) => setSettingsForm({ ...settingsForm, capacity: parseInt(e.target.value) })}
                        className="bg-slate-50 dark:bg-slate-900 border-none font-bold pl-10"
                      />
                      <IconUsers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-[9px] text-muted-foreground font-medium italic">Current enrollment will be checked during peak load.</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-slate-900 dark:bg-white dark:text-black font-black uppercase tracking-widest h-11 text-xs rounded-xl hover:scale-[1.02] transition-transform"
                  onClick={async () => {
                    setIsUpdatingSettings(true)
                    try {
                      await updateClass(classId, {
                        name: settingsForm.name,
                        capacity: settingsForm.capacity,
                        section_id: settingsForm.sectionId
                      })
                      toast.success("Identity updated successfully")
                    } catch (err) {
                      toast.error("Failed to update class")
                    } finally {
                      setIsUpdatingSettings(false)
                    }
                  }}
                  disabled={isUpdatingSettings}
                >
                  {isUpdatingSettings ? <IconRefresh className="animate-spin mr-2" /> : <IconArrowRight className="mr-2" />}
                  Save Identity Changes
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Academic Guardrails */}
              <Card className="border shadow-none overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                      <IconCertificate size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-widest">Academic Guardrails</CardTitle>
                      <CardDescription className="text-[10px] font-bold">Global standards for this class</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase tracking-tight leading-none">Global Pass Mark</p>
                      <p className="text-[9px] text-muted-foreground font-medium italic">Apply default pass score to all subjects</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black">40%</span>
                      <IconChevronRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase tracking-tight leading-none">Attendance Alert</p>
                      <p className="text-[9px] text-muted-foreground font-medium italic">Flag students below 85% attendance</p>
                    </div>
                    <Switch disabled />
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className={cn(
                "border border-red-100 dark:border-red-900/30 shadow-none overflow-hidden",
                !hasAdminAccess && "opacity-60 pointer-events-none"
              )}>
                <CardHeader className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/10">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                      <IconAlertTriangle size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-red-600">Danger Zone</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-red-400">Destructive administrative actions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => {
                    toast.promise(updateClass(classId, { is_active: !classDetails.is_active }), {
                      loading: 'Processing...',
                      success: 'Class state toggled',
                      error: 'Failed to archive'
                    })
                  }}>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight leading-none">Archive Class</p>
                      <p className="text-[9px] text-muted-foreground font-medium italic mt-1">Temporarily disable access for this period</p>
                    </div>
                    <IconArchive size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800" />
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowDeleteDialog(true)}>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight leading-none text-red-600">Permanently Delete</p>
                      <p className="text-[9px] text-muted-foreground font-medium italic mt-1">Erase class and all associated records forever</p>
                    </div>
                    <IconTrash size={18} className="text-red-400 group-hover:text-red-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="border-none dark:bg-slate-950 rounded-3xl p-8">
              <AlertDialogHeader>
                <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <IconAlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-2xl font-black italic uppercase">Critical Action</AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium">
                  This will PERMANENTLY erase <span className="text-red-600 font-bold">{classDetails.name}</span>. This action is irreversible and all student results linked to this class will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 gap-3">
                <AlertDialogCancel className="h-12 border-none bg-slate-100 dark:bg-slate-900 text-xs font-black uppercase rounded-2xl">Abort Mission</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      await deleteClass(classId)
                      toast.success("Class terminated")
                      router.push("/classes")
                    } catch (err) {
                      toast.error("An error occurred during termination")
                    }
                  }}
                  className="h-12 bg-red-600 text-white text-xs font-black uppercase rounded-2xl px-8 hover:bg-red-700"
                >
                  Confirm Termination
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>

      {hasAdminAccess && (
        <>
          <AddStudentToClassModal
            open={showAddStudentModal}
            onOpenChange={setShowAddStudentModal}
            classId={classId}
            sessionId={selectedSession}
            termId={selectedTerm}
            unenrolledStudents={unenrolledStudents}
          />

          <AddSubjectToClassModal
            open={showAddSubjectModal}
            onOpenChange={setShowAddSubjectModal}
            classId={classId}
            availableSubjects={availableSubjects}
          />

          <AssignTeacherModal
            open={showAssignClassTeacherModal}
            onOpenChange={setShowAssignClassTeacherModal}
            classId={classId}
            sessionId={selectedSession}
            teachers={allTeachers}
            type="class"
          />

          <AssignTeacherModal
            open={showAssignSubjectTeacherModal}
            onOpenChange={setShowAssignSubjectTeacherModal}
            classId={classId}
            sessionId={selectedSession}
            teachers={allTeachers}
            type="subject"
            subjects={classSubjects.map((cs) => ({ id: cs.subject.id, name: cs.subject.name }))}
          />

          {tempSubjectForReassign && (
            <ReassignTeacherModal
              open={showReassignTeacherModal}
              onOpenChange={setShowReassignTeacherModal}
              classId={classId!}
              sessionId={selectedSession}
              subjectId={tempSubjectForReassign.id}
              subjectName={tempSubjectForReassign.name}
              currentTeacher={tempSubjectForReassign.teacher}
              teachers={allTeachers}
            />
          )}
        </>
      )}
    </div>
  )
}
