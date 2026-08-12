"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronLeft, Save, SlidersHorizontal, ArrowLeft, Loader2, RotateCcw, Pencil, Printer, ChevronDown, Download, FileText, Image as ImageIcon, ChevronsUpDown, Check, Filter, ExternalLink, BookOpen, User, Users, Book, Award, TrendingUp, BarChart3, Trash2, Layers, Plus, Settings, AlertTriangle, Archive, UserPlus, Phone, Mail, ArrowUpRight, ChevronRight, Shield } from "lucide-react"
import { PrintableReportCard } from "@/components/printable-report-card"
import { SessionTermSelector } from "@/components/session-term-selector"
import { SubjectResultView } from "@/components/subject-result-view"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { exportReportCardsAsPDF, exportReportCardsAsImages } from "@/lib/export-report-card"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// New imports for Class Info consolidation
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AddStudentToClassModal } from "@/components/add-student-to-class-modal"
import { ClassSubjectsChecklistModal } from "@/components/class-subjects-checklist-modal"
import { AssignTeacherModal } from "@/components/assign-teacher-modal"
import { ReassignTeacherModal } from "@/components/reassign-teacher-modal"
import { EditStudentModal } from "@/components/edit-student-modal"
import { StudentDetailsSheet } from "@/components/student-details-sheet"
import { isAdmin } from "@/lib/auth/role-redirect"
import {
  addStudentToClass,
  removeStudentFromClass,
  addSubjectToClass,
  removeSubjectFromClass,
  assignClassTeacher,
  assignSubjectTeacher,
  removeSubjectTeacher,
  updateClass,
  deleteClass
} from "@/app/(dashboard)/classes/[id]/actions"

type Student = {
  id: string
  student_id: string
  first_name: string
  middle_name?: string
  last_name: string
  photo_url?: string
  date_of_birth?: string
  gender?: string
}

type Score = {
  subject_id?: string
  subject_name: string
  ca1: number | null
  ca2: number | null
  exam: number | null
  total: number | null
  grade: string
  subject_position: number | null
  subject_highest: number | null
  subject_lowest: number | null
  subject_average: number | null
  has_components?: boolean
  components?: any[]
}

type Skill = {
  skill_category: "Affective" | "Psychomotor"
  skill_name: string
  rating: number | null
}

const DEFAULT_AFFECTIVE_SKILLS = [
  "Attentiveness",
  "Emotional Stability",
  "Honesty",
  "Neatness",
  "Perseverance",
  "Politeness",
  "Punctuality",
  "Relationship with Peers",
  "Response to Home Work",
]

const DEFAULT_PSYCHOMOTOR_SKILLS = [
  "Ablution",
  "Handwriting",
  "Prayer (Salat)",
  "Verbal Fluency",
]

const AUTO_COMMENTS = [
  "Exceptional performance! Keep up the excellent work.",
  "Excellent result. Continue striving for excellence.",
  "Very good effort. Keep aiming higher.",
  "Good performance. With more dedication, you can do even better.",
  "A commendable effort. Stay focused and keep improving.",
  "Satisfactory performance. Greater effort will lead to better results.",
  "Fair performance. You have potential—work harder and stay consistent.",
  "You passed, but there is room for improvement. Study more diligently.",
  "You need to put in more effort. Regular study and practice are essential.",
  "Unsatisfactory performance. Please work harder and seek extra support to improve."
]

const AUTO_PRINCIPAL_COMMENTS = [
  "Outstanding! A brilliant display of academic excellence.",
  "Excellent performance. Keep maintaining this high standard.",
  "Very good result. Keep up the high level of dedication.",
  "Good work. Keep up the effort to reach your full potential.",
  "A nice effort. With more consistency, you can achieve higher results.",
  "Satisfactory work. Strive to show more improvement in the next term.",
  "Fair outcome. Focus more on your studies to realize your potential.",
  "Pass mark. Regular revision and effort will bring better grades.",
  "Below average. You must focus and work harder next term.",
  "Unsatisfactory result. Seek academic support and work harder."
]

const getTeacherCommentForAverage = (avg: number): string => {
  if (avg >= 95) return "Exceptional performance! Keep up the excellent work."
  if (avg >= 90) return "Excellent result. Continue striving for excellence."
  if (avg >= 85) return "Very good effort. Keep aiming higher."
  if (avg >= 80) return "Good performance. With more dedication, you can do even better."
  if (avg >= 75) return "A commendable effort. Stay focused and keep improving."
  if (avg >= 70) return "Satisfactory performance. Greater effort will lead to better results."
  if (avg >= 65) return "Fair performance. You have potential—work harder and stay consistent."
  if (avg >= 60) return "You passed, but there is room for improvement. Study more diligently."
  if (avg >= 50) return "You need to put in more effort. Regular study and practice are essential."
  return "Unsatisfactory performance. Please work harder and seek extra support to improve."
}

const getPrincipalCommentForAverage = (avg: number): string => {
  if (avg >= 95) return "Outstanding! A brilliant display of academic excellence."
  if (avg >= 90) return "Excellent performance. Keep maintaining this high standard."
  if (avg >= 85) return "Very good result. Keep up the high level of dedication."
  if (avg >= 80) return "Good work. Keep up the effort to reach your full potential."
  if (avg >= 75) return "A nice effort. With more consistency, you can achieve higher results."
  if (avg >= 70) return "Satisfactory work. Strive to show more improvement in the next term."
  if (avg >= 65) return "Fair outcome. Focus more on your studies to realize your potential."
  if (avg >= 60) return "Pass mark. Regular revision and effort will bring better grades."
  if (avg >= 50) return "Below average. You must focus and work harder next term."
  return "Unsatisfactory result. Seek academic support and work harder."
}

interface Props {
  sessions: any[]
  terms: any[]
  classData: any
  classes?: any[]
  school?: any
  schoolSettings?: any
  subjects?: any[]
  students: Student[]
  initialSessionId: string
  initialTermId: string
  initialClassId: string
  showSelectors?: boolean
  showTitle?: boolean
  showBackButton?: boolean
  showClassScoresButton?: boolean
}

export function ResultFinalizationInterface({
  sessions,
  terms,
  classData,
  classes = [],
  school: schoolProp,
  schoolSettings,
  subjects,
  students: initialStudents,
  initialSessionId,
  initialTermId,
  initialClassId,
  showSelectors = true,
  showTitle = true,
  showBackButton = false,
  showClassScoresButton = false,
}: Props) {
  const school = schoolProp || schoolSettings
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createBrowserClient()

  const [sessionId, setSessionId] = useState(initialSessionId)
  const [termId, setTermId] = useState(initialTermId)
  const [students, setStudents] = useState(initialStudents)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    initialStudents[0] || null
  )
  const [classDropdownOpen, setClassDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"student" | "subject" | "class_info">("student")
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [mobileDetailType, setMobileDetailType] = useState<"student" | "subject" | null>(null)
  const [classSubjectsList, setClassSubjectsList] = useState<any[]>(subjects || [])
  const [refreshKey, setRefreshKey] = useState(0)

  // Class Info States
  const [classDetails, setClassDetails] = useState<any>(classData || null)
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [unenrolledStudents, setUnenrolledStudents] = useState<any[]>([])
  const [classSubjects, setClassSubjects] = useState<any[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
  const [allTeachers, setAllTeachers] = useState<any[]>([])
  const [allSections, setAllSections] = useState<any[]>([])
  const [userRole, setUserRole] = useState<string>("")
  const [activeInfoTab, setActiveInfoTab] = useState<"students" | "subjects" | "teachers" | "settings">("students")

  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [showAssignClassTeacherModal, setShowAssignClassTeacherModal] = useState(false)
  const [showAssignSubjectTeacherModal, setShowAssignSubjectTeacherModal] = useState(false)
  const [showReassignTeacherModal, setShowReassignTeacherModal] = useState(false)
  const [tempSubjectForReassign, setTempSubjectForReassign] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    name: classData?.name || "",
    capacity: classData?.capacity || 0,
    sectionId: classData?.section_id || "",
  })

  // Student Details Sheet and Edit Modal States
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [detailSheetStudentId, setDetailSheetStudentId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editModalStudent, setEditModalStudent] = useState<any | null>(null)

  const hasAdminAccess = useMemo(() => isAdmin(userRole), [userRole])

  // Synchronize classDetails name with window.__breadcrumbLabels for AppHeader
  useEffect(() => {
    if (typeof window !== "undefined" && classDetails?.id && classDetails?.name) {
      const gLabels = (window as any).__breadcrumbLabels || {};
      gLabels[classDetails.id] = classDetails.name;
      (window as any).__breadcrumbLabels = gLabels;
      window.dispatchEvent(new Event("breadcrumb-update"));
    }
  }, [classDetails]);

  // Fetch all database records related to Class Info
  useEffect(() => {
    async function fetchAllClassData() {
      const currentClassId = initialClassId || classData?.id
      if (!currentClassId) return

      try {
        // 1. Fetch Class details
        const { data: cDetails } = await supabase
          .from("classes")
          .select("*, section:sections(name)")
          .eq("id", currentClassId)
          .single()

        if (cDetails) {
          let teacherData = null
          if (cDetails.class_teacher_id) {
            const { data: teacher } = await supabase
              .from("teachers")
              .select("id, first_name, last_name, email, phone, photo_url")
              .eq("id", cDetails.class_teacher_id)
              .single()
            teacherData = teacher
          }

          const { count: studentCount } = await supabase
            .from("student_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", currentClassId)
            .eq("session_id", sessionId)
            .eq("term_id", termId)
            .eq("is_active", true)

          const { count: subjectCount } = await supabase
            .from("class_subjects")
            .select("*", { count: "exact", head: true })
            .eq("class_id", currentClassId)

          setClassDetails({
            ...cDetails,
            teacher: teacherData || undefined,
            student_count: studentCount || 0,
            subject_count: subjectCount || 0,
          })

          setSettingsForm({
            name: cDetails.name,
            capacity: cDetails.capacity,
            sectionId: cDetails.section_id,
          })
        }

        // 2. Fetch sections
        const { data: sectionsData } = await supabase
          .from("sections")
          .select("*")
          .eq("is_active", true)
        setAllSections(sectionsData || [])

        // 3. Fetch enrolled students
        const { data: enrollments } = await supabase
          .from("student_enrollments")
          .select("id, students(*)")
          .eq("class_id", currentClassId)
          .eq("session_id", sessionId)
          .eq("term_id", termId)
          .eq("is_active", true)

        let enrolled: any[] = []
        if (enrollments) {
          enrolled = enrollments.map((e) => ({
            enrollment_id: e.id,
            ...(e.students as any),
          }))
          setEnrolledStudents(enrolled)
        }

        // 4. Fetch unenrolled students
        const { data: allStudents } = await supabase.from("students").select("*").eq("status", "Active")
        const enrolledIds = new Set(enrolled.map((s) => s.id))
        const unenrolled = (allStudents || []).filter((s) => !enrolledIds.has(s.id))
        setUnenrolledStudents(unenrolled)

        // 5. Fetch subjects & assignments
        const { data: subjectsData } = await supabase
          .from("class_subjects")
          .select("*, subject:subjects(*)")
          .eq("class_id", currentClassId)

        if (subjectsData) {
          const subjectIds = subjectsData.map((s) => s.subject_id)

          // Fetch teacher assignments and subject components in parallel
          const [
            { data: assignments },
            { data: classComps }
          ] = await Promise.all([
            supabase
              .from("teacher_subject_assignments")
              .select("subject_id, teacher:teachers(first_name, last_name, email, photo_url)")
              .eq("class_id", currentClassId)
              .eq("session_id", sessionId)
              .in("subject_id", subjectIds),
            supabase
              .from("class_subject_components")
              .select("*, subject_component:subject_components(id, name)")
              .eq("class_id", currentClassId)
          ])

          // Map components by subject_id
          const componentsMap = new Map<string, any[]>()
          classComps?.forEach((cc) => {
            if (cc.subject_component) {
              if (!componentsMap.has(cc.subject_id)) {
                componentsMap.set(cc.subject_id, [])
              }
              componentsMap.get(cc.subject_id)!.push({
                id: cc.subject_component.id,
                name: cc.subject_component.name,
                max_ca: cc.max_ca || 0,
                max_exam: cc.max_exam || 0,
              })
            }
          })

          const teacherMap = new Map((assignments || []).map((a) => [a.subject_id, a.teacher]))
          const enrichedSubjects = subjectsData.map((s) => ({
            ...s,
            teacher: teacherMap.get(s.subject_id),
            components: componentsMap.get(s.subject_id) || [],
          }))
          setClassSubjects(enrichedSubjects)
        }

        // 6. Fetch available subjects
        const { data: allSubjects } = await supabase.from("subjects").select("*").eq("is_active", true)
        const assignedSubjectIds = new Set((subjectsData || []).map((s) => s.subject_id))
        const available = (allSubjects || []).filter((s) => !assignedSubjectIds.has(s.id))
        setAvailableSubjects(available)

        // 7. Fetch all active teachers
        const { data: teachers } = await supabase.from("teachers").select("*").eq("status", "Active")
        setAllTeachers(teachers || [])

      } catch (err) {
        console.error("Error fetching class info details:", err)
      }
    }

    fetchAllClassData()
  }, [initialClassId, classData?.id, sessionId, termId, supabase, refreshKey])

  // Realtime subscription for real-time reactive sync
  useEffect(() => {
    const classId = initialClassId || classData?.id
    if (!classId) return

    const enrollmentsChannel = supabase
      .channel(`enrollments-interface-${classId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_enrollments", filter: `class_id=eq.${classId}` },
        () => setRefreshKey((prev) => prev + 1)
      )
      .subscribe()

    const subjectsChannel = supabase
      .channel(`subjects-interface-${classId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_subjects", filter: `class_id=eq.${classId}` },
        () => setRefreshKey((prev) => prev + 1)
      )
      .subscribe()

    const teachersChannel = supabase
      .channel(`teachers-interface-${classId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teacher_subject_assignments", filter: `class_id=eq.${classId}` },
        () => setRefreshKey((prev) => prev + 1)
      )
      .subscribe()

    const classChannel = supabase
      .channel(`class-interface-${classId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "classes", filter: `id=eq.${classId}` },
        () => setRefreshKey((prev) => prev + 1)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(enrollmentsChannel)
      supabase.removeChannel(subjectsChannel)
      supabase.removeChannel(teachersChannel)
      supabase.removeChannel(classChannel)
    }
  }, [initialClassId, classData?.id, supabase])

  // Fetch User Role for access controls
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
  }, [supabase])

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (confirm("Are you sure you want to remove this student from the class?")) {
      try {
        const classId = initialClassId || classData?.id
        await removeStudentFromClass(enrollmentId, classId)
        toast.success("Student removed successfully")
        setRefreshKey((prev) => prev + 1)
      } catch (error) {
        toast.error("Failed to remove student")
      }
    }
  }

  const handleRemoveSubject = async (classSubjectId: string) => {
    if (confirm("Are you sure you want to remove this subject from the class?")) {
      try {
        const classId = initialClassId || classData?.id
        await removeSubjectFromClass(classSubjectId, classId)
        toast.success("Subject removed successfully")
        setRefreshKey((prev) => prev + 1)
      } catch (error) {
        toast.error("Failed to remove subject")
      }
    }
  }

  useEffect(() => {
    if (subjects && subjects.length > 0) {
      setClassSubjectsList(subjects)
      return
    }
    async function fetchClassSubjs() {
      const currentClassId = initialClassId || classData?.id
      if (!currentClassId) return
      try {
        const { data: cSubjs } = await supabase
          .from("class_subjects")
          .select("subject:subjects(id, name, code)")
          .eq("class_id", currentClassId)

        const subjs = cSubjs?.map((cs: any) => cs.subject).filter(Boolean) || []
        setClassSubjectsList(subjs)
      } catch (err) {
        console.error("Error fetching class subjects:", err)
      }
    }
    fetchClassSubjs()
  }, [initialClassId, classData?.id, supabase, subjects])

  // React to prop updates
  useEffect(() => {
    setSessionId(initialSessionId)
  }, [initialSessionId])

  useEffect(() => {
    setTermId(initialTermId)
  }, [initialTermId])

  useEffect(() => {
    setStudents(initialStudents)
    if (initialStudents.length > 0) {
      setSelectedStudent(prev => {
        const stillExists = initialStudents.find(s => s.id === prev?.id)
        return stillExists || initialStudents[0]
      })
    } else {
      setSelectedStudent(null)
    }
  }, [initialStudents])

  const [scores, setScores] = useState<Score[]>([])
  const [affectiveSkills, setAffectiveSkills] = useState<Skill[]>([])
  const [psychomotorSkills, setPsychomotorSkills] = useState<Skill[]>([])
  const [teacherRemarks, setTeacherRemarks] = useState("")
  const [principalRemarks, setPrincipalRemarks] = useState("")
  const [attendancePresent, setAttendancePresent] = useState<string>("0")
  const [attendanceTotal, setAttendanceTotal] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [scoresCompletion, setScoresCompletion] = useState({ completed: 0, total: 0 })
  const [skillsCompletion, setSkillsCompletion] = useState({ completed: 0, total: 0 })
  const [attendanceCompletion, setAttendanceCompletion] = useState({ completed: 0, total: 0 })
  const [remarksCompletion, setRemarksCompletion] = useState({ completed: 0, total: 0 })

  const [completedScoresSet, setCompletedScoresSet] = useState<Set<string>>(new Set())
  const [completedSkillsSet, setCompletedSkillsSet] = useState<Set<string>>(new Set())
  const [completedAttendanceSet, setCompletedAttendanceSet] = useState<Set<string>>(new Set())
  const [completedRemarksSet, setCompletedRemarksSet] = useState<Set<string>>(new Set())

  // Filter states
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all")
  const [filterScores, setFilterScores] = useState<"all" | "completed" | "pending">("all")
  const [filterSkills, setFilterSkills] = useState<"all" | "completed" | "pending">("all")
  const [filterAttendance, setFilterAttendance] = useState<"all" | "completed" | "pending">("all")
  const [filterRemarks, setFilterRemarks] = useState<"all" | "completed" | "pending">("all")
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)

  const [printPopoverOpen, setPrintPopoverOpen] = useState(false)
  const [selectedStudentIdsForPrint, setSelectedStudentIdsForPrint] = useState<string[]>([])
  const [printCardsData, setPrintCardsData] = useState<any[]>([])
  const printContainerRef = useRef<HTMLDivElement>(null)
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)

  // Initialize all student IDs selected by default in bulk print popover
  useEffect(() => {
    if (students && students.length > 0) {
      setSelectedStudentIdsForPrint(students.map((s) => s.id))
    }
  }, [students])

  const handleToggleSelectAllPrint = () => {
    if (selectedStudentIdsForPrint.length === students.length) {
      setSelectedStudentIdsForPrint([])
    } else {
      setSelectedStudentIdsForPrint(students.map((s) => s.id))
    }
  }

  const handleToggleStudentPrint = (stId: string) => {
    setSelectedStudentIdsForPrint((prev) =>
      prev.includes(stId) ? prev.filter((id) => id !== stId) : [...prev, stId]
    )
  }

  const getResumptionDate = (term: any, session: any) => {
    if (term?.resumption_date) return term.resumption_date
    if (term?.next_term_resumption_date) return term.next_term_resumption_date

    const termNum = term?.term_number || (term?.name?.includes("1") ? 1 : term?.name?.includes("2") ? 2 : 3)
    if (termNum < 3) {
      const nextTerm = terms.find(
        (t) => (t.session_id === session?.id || t.session_id === term?.session_id) &&
          (t.term_number === termNum + 1 || t.name?.includes(String(termNum + 1)))
      )
      if (nextTerm?.start_date) return nextTerm.start_date
    } else {
      const sortedSessions = [...sessions].sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )
      const currentIndex = sortedSessions.findIndex((s) => s.id === session?.id || s.id === term?.session_id)
      if (currentIndex >= 0 && currentIndex < sortedSessions.length - 1) {
        return sortedSessions[currentIndex + 1].start_date
      }
    }
    return term?.end_date || null
  }

  const getClassSubjectStats = async (cId: string, sId: string, tId: string) => {
    try {
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id, subject:subjects(name)")
        .eq("class_id", cId)
        .eq("session_id", sId)
        .eq("term_id", tId)

      if (!assessments || assessments.length === 0) return {}

      const assSubjMap = new Map(assessments.map((a: any) => [a.id, a.subject?.name]))
      const assessmentIds = assessments.map((a: any) => a.id)

      const { data: scores } = await supabase
        .from("student_scores")
        .select("student_id, score, assessment_id")
        .in("assessment_id", assessmentIds)

      const subjectStudentTotals: Record<string, Record<string, number>> = {}

      scores?.forEach((item: any) => {
        const subjName = assSubjMap.get(item.assessment_id)
        const stId = item.student_id
        if (!subjName || !stId) return

        if (!subjectStudentTotals[subjName]) {
          subjectStudentTotals[subjName] = {}
        }
        if (!subjectStudentTotals[subjName][stId]) {
          subjectStudentTotals[subjName][stId] = 0
        }
        subjectStudentTotals[subjName][stId] += item.score || 0
      })

      const classStats: Record<string, { min: number; max: number; average: number }> = {}
      Object.entries(subjectStudentTotals).forEach(([subjName, stTotals]) => {
        const studentCount = Object.keys(stTotals).length
        if (studentCount > 0) {
          const totalScores = Object.values(stTotals)
          const totalSum = totalScores.reduce((sum, val) => sum + val, 0)
          classStats[subjName] = {
            min: Math.min(...totalScores),
            max: Math.max(...totalScores),
            average: Math.round((totalSum / studentCount) * 100) / 100
          }
        }
      })

      return classStats
    } catch (err) {
      console.error("Error computing class subject stats:", err)
      return {}
    }
  }

  const preparePrintDataForStudents = async (studentIds: string[]) => {
    if (studentIds.length === 0) return
    setIsPreparingPrint(true)

    try {
      const cards: any[] = []
      const currentSession = sessions.find((s) => s.id === sessionId)
      const rawTerm = terms.find((t) => t.id === termId)
      const computedResumption = getResumptionDate(rawTerm, currentSession)
      const currentTerm = rawTerm ? { ...rawTerm, resumption_date: computedResumption } : null
      const currentClassId = initialClassId || classData?.id
      const classStats = await getClassSubjectStats(currentClassId, sessionId, termId)

      // Fetch all class subjects and class subject components once
      const [classSubjsRes, classComponentsRes] = await Promise.all([
        supabase
          .from("class_subjects")
          .select("subject_id, subject:subjects(id, name, code)")
          .eq("class_id", currentClassId),
        supabase
          .from("class_subject_components")
          .select("subject_id, component:subject_components(name)")
          .eq("class_id", currentClassId)
      ])

      const classSubjs = classSubjsRes.data || []
      const classComponents = classComponentsRes.data || []
      const classSubjectOrder = classSubjs.map((cs: any) => cs.subject?.name).filter(Boolean) || []
      const orderMap = new Map(classSubjectOrder.map((name: string, index: number) => [name.toLowerCase(), index]))

      for (const stId of studentIds) {
        const studentObj = students.find((s) => s.id === stId) || selectedStudent
        if (!studentObj) continue

        // Fetch scores
        const { data: scoresData } = await supabase
          .from("student_scores")
          .select(`
            score,
            grade,
            remarks,
            assessment:assessments(
              class_id,
              session_id,
              term_id,
              subject:subjects(name, code),
              assessment_type:assessment_types(name),
              subject_component:subject_components(id, name)
            )
          `)
          .eq("student_id", stId)

        const subjectScoresMap: Record<string, any> = {}

        // Pre-populate all subjects and subject components in the class
        classSubjs.forEach((cs: any) => {
          const parentName = cs.subject?.name
          const parentId = cs.subject_id || cs.subject?.id
          if (!parentName) return

          const comps = classComponents.filter((c: any) => c.subject_id === parentId)
          if (comps.length > 0) {
            comps.forEach((c: any) => {
              const compKey = `${parentName}: ${c.component?.name}`
              subjectScoresMap[compKey] = {
                code: cs.subject?.code || "",
                ca1: null,
                ca2: null,
                exam: null,
                total: null,
                grade: "",
                remark: "",
                classMin: classStats[parentName]?.min ?? null,
                classMax: classStats[parentName]?.max ?? null,
                classAvg: classStats[parentName]?.average ?? null,
              }
            })
          } else {
            subjectScoresMap[parentName] = {
              code: cs.subject?.code || "",
              ca1: null,
              ca2: null,
              exam: null,
              total: null,
              grade: "",
              remark: "",
              classMin: classStats[parentName]?.min ?? null,
              classMax: classStats[parentName]?.max ?? null,
              classAvg: classStats[parentName]?.average ?? null,
            }
          }
        })

        // Fill in scores from database
        scoresData?.forEach((scoreItem: any) => {
          const ass = scoreItem.assessment
          if (ass?.class_id && ass.class_id !== currentClassId) return
          if (ass?.session_id && ass.session_id !== sessionId) return
          if (ass?.term_id && ass.term_id !== termId) return

          const subjNameRaw = ass?.subject?.name
          const subjectComponent = ass?.subject_component
          const subjName = subjectComponent
            ? `${subjNameRaw}: ${subjectComponent.name}`
            : subjNameRaw

          if (!subjName || !subjectScoresMap[subjName]) return

          const assessmentType = ass?.assessment_type?.name
          if (assessmentType?.includes("CA Test 1")) {
            subjectScoresMap[subjName].ca1 = scoreItem.score
          } else if (assessmentType?.includes("CA Test 2")) {
            subjectScoresMap[subjName].ca2 = scoreItem.score
          } else if (assessmentType?.includes("Exam")) {
            subjectScoresMap[subjName].exam = scoreItem.score
            subjectScoresMap[subjName].grade = scoreItem.grade
            subjectScoresMap[subjName].remark = scoreItem.remarks
          }
        })

        // Compute total score for each subject/component if there's any score entered
        Object.keys(subjectScoresMap).forEach((k) => {
          const s = subjectScoresMap[k]
          const hasCa1 = s.ca1 !== null
          const hasCa2 = s.ca2 !== null
          const hasExam = s.exam !== null
          if (hasCa1 || hasCa2 || hasExam) {
            s.total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0)
          }
        })

        // Sort subjectScoresMap by class subjects order
        const sortedSubjectScoresMap: Record<string, any> = {}
        Object.keys(subjectScoresMap)
          .sort((a, b) => {
            const indexA = orderMap.has(a.toLowerCase()) ? orderMap.get(a.toLowerCase())! : 999
            const indexB = orderMap.has(b.toLowerCase()) ? orderMap.get(b.toLowerCase())! : 999
            if (indexA !== indexB) return indexA - indexB
            return a.localeCompare(b)
          })
          .forEach((k) => {
            sortedSubjectScoresMap[k] = subjectScoresMap[k]
          })

        // Fetch skills
        const { data: skillsData } = await supabase
          .from("student_skills")
          .select("skill_category, skill_name, rating")
          .eq("student_id", stId)
          .eq("session_id", sessionId)
          .eq("term_id", termId)

        // Fetch result details
        const { data: resultData } = await supabase
          .from("student_results")
          .select("*")
          .eq("student_id", stId)
          .eq("session_id", sessionId)
          .eq("term_id", termId)
          .maybeSingle()

        const targetClass = activeClassObj || classData
        cards.push({
          student: {
            ...studentObj,
            classes: targetClass ? { 
              name: targetClass.name, 
              section: targetClass.section,
              class_teacher: targetClass.class_teacher || targetClass.class_teacher_name || targetClass.teacher_name || "—"
            } : null
          },
          session: currentSession,
          term: currentTerm,
          result: {
            ...resultData,
            total_students: students.length
          },
          subjectScores: sortedSubjectScoresMap,
          school,
          skills: skillsData || []
        })
      }

      setPrintCardsData(cards)

      // Allow React DOM to flush updated print cards before triggering print/export
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
      
      return true
    } catch (err) {
      console.error("[v0] Error preparing print data:", err)
      toast.error("Print Failed", { description: "Could not assemble student print data." })
      return false
    } finally {
      setIsPreparingPrint(false)
    }
  }

  // Utility to slugify strings for filenames (replace slashes, spaces, special chars)
  const slugify = (str: string) => str.replace(/[\/\\]/g, "-").replace(/[^a-zA-Z0-9\-_\.]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")

  const handlePrintAction = async (studentIds: string[], action: "print" | "pdf" | "image") => {
    const success = await preparePrintDataForStudents(studentIds)
    if (!success) return

    if (action === "print") {
      window.print()
    } else {
      // Small additional delay to ensure images inside the report cards have begun loading if possible
      await new Promise(resolve => setTimeout(resolve, 300))
      const nodes = Array.from(printContainerRef.current?.querySelectorAll('.report-card-page') || []) as HTMLElement[]
      
      if (nodes.length > 0) {
        const currentSession = sessions.find((s) => s.id === sessionId)
        const currentTerm = terms.find((t) => t.id === termId)
        const sessionSlug = slugify(currentSession?.name || "Session")
        const termSlug = slugify(currentTerm?.name || "Term")
        const className = slugify((classData as any)?.name || "Class")

        if (action === "pdf") {
          if (studentIds.length === 1) {
            const st = students.find((s) => s.id === studentIds[0]) || selectedStudent
            const admNo = slugify(st?.student_id || "Unknown")
            const studentName = slugify(`${st?.first_name || ""}_${st?.last_name || ""}`)
            const filename = `${admNo}_${studentName}_${sessionSlug}_${termSlug}_Report_Card.pdf`
            await exportReportCardsAsPDF(nodes, filename)
          } else {
            const filename = `${className}_${sessionSlug}_${termSlug}_Report_Cards.pdf`
            await exportReportCardsAsPDF(nodes, filename)
          }
        } else if (action === "image") {
          const filenames = studentIds.map(id => {
            const st = students.find((s) => s.id === id)
            const admNo = slugify(st?.student_id || "Unknown")
            const studentName = slugify(`${st?.first_name || ""}_${st?.last_name || ""}`)
            return `${admNo}_${studentName}_${sessionSlug}_${termSlug}_Report_Card.png`
          })
          await exportReportCardsAsImages(nodes, filenames)
        }
      } else {
         toast.error("Export Failed", { description: "Could not find report card elements." })
      }
    }
    // Clean up if desired, or keep them around
    // setPrintCardsData([]) // We leave it in case they want to print again immediately
  }

  const handlePrintCurrentStudent = async (action: "print" | "pdf" | "image" = "print") => {
    if (!selectedStudent) return
    await handlePrintAction([selectedStudent.id], action)
  }

  const handleExecuteBulkPrint = async (action: "print" | "pdf" | "image" = "print") => {
    if (selectedStudentIdsForPrint.length === 0) return
    setPrintPopoverOpen(false)
    await handlePrintAction(selectedStudentIdsForPrint, action)
  }

  // Filter terms based on selected session
  const filteredTerms = terms.filter((t) => t.session_id === sessionId)

  const isStudentFullyCompleted = (studentId: string) => {
    return (
      completedScoresSet.has(studentId) &&
      completedSkillsSet.has(studentId) &&
      completedAttendanceSet.has(studentId) &&
      completedRemarksSet.has(studentId)
    )
  }

  const isFilterActive =
    filterStatus !== "all" ||
    filterScores !== "all" ||
    filterSkills !== "all" ||
    filterAttendance !== "all" ||
    filterRemarks !== "all"

  const activeFilterCount =
    (filterStatus !== "all" ? 1 : 0) +
    (filterScores !== "all" ? 1 : 0) +
    (filterSkills !== "all" ? 1 : 0) +
    (filterAttendance !== "all" ? 1 : 0) +
    (filterRemarks !== "all" ? 1 : 0)

  const handleResetFilters = () => {
    setFilterStatus("all")
    setFilterScores("all")
    setFilterSkills("all")
    setFilterAttendance("all")
    setFilterRemarks("all")
  }

  // Deduplicate incoming students by ID to prevent duplicate key rendering errors
  const uniqueStudents = useMemo(() => {
    const map = new Map<string, any>()
    students?.forEach((st) => {
      if (st && st.id && !map.has(st.id)) {
        map.set(st.id, st)
      }
    })
    return Array.from(map.values())
  }, [students])

  // Filter students based on search and filters
  const filteredStudents = uniqueStudents.filter((student) => {
    const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    const hasScores = completedScoresSet.has(student.id)
    const hasSkills = completedSkillsSet.has(student.id)
    const hasAttendance = completedAttendanceSet.has(student.id)
    const hasRemarks = completedRemarksSet.has(student.id)
    const isCompleted = hasScores && hasSkills && hasAttendance && hasRemarks

    if (filterStatus === "completed" && !isCompleted) return false
    if (filterStatus === "incomplete" && isCompleted) return false

    if (filterScores === "completed" && !hasScores) return false
    if (filterScores === "pending" && hasScores) return false

    if (filterSkills === "completed" && !hasSkills) return false
    if (filterSkills === "pending" && hasSkills) return false

    if (filterAttendance === "completed" && !hasAttendance) return false
    if (filterAttendance === "pending" && hasAttendance) return false

    if (filterRemarks === "completed" && !hasRemarks) return false
    if (filterRemarks === "pending" && hasRemarks) return false

    return true
  })

  // Fetch completion stats (Parallelized)
  useEffect(() => {
    async function fetchCompletionStats() {
      if (!initialClassId || !sessionId || !termId) return

      const studentIds = students.map((s) => s.id)
      if (studentIds.length === 0) return

      const [scoresRes, skillsRes, resultsRes] = await Promise.all([
        supabase
          .from("student_scores")
          .select(`
            student_id,
            assessment:assessments!inner(class_id, session_id, term_id)
          `)
          .eq("assessment.class_id", initialClassId || classData?.id)
          .eq("assessment.session_id", sessionId)
          .eq("assessment.term_id", termId)
          .in("student_id", studentIds),
        supabase.from("student_skills").select("student_id, rating").eq("session_id", sessionId).eq("term_id", termId).in("student_id", studentIds),
        supabase.from("student_results").select("student_id, attendance_present, teacher_remark, principal_remark").eq("session_id", sessionId).eq("term_id", termId).in("student_id", studentIds),
      ])

      const studentsWithScores = new Set(scoresRes.data?.map((s) => s.student_id))
      setScoresCompletion({
        completed: studentsWithScores.size,
        total: students.length,
      })
      setCompletedScoresSet(studentsWithScores)

      const studentsWithSkills = new Set(skillsRes.data?.filter((s) => s.rating !== null).map((s) => s.student_id))
      setSkillsCompletion({
        completed: studentsWithSkills.size,
        total: students.length,
      })
      setCompletedSkillsSet(studentsWithSkills)

      const studentsWithAttendance = new Set(
        resultsRes.data
          ?.filter((r) => r.attendance_present !== null && r.attendance_present !== undefined && r.attendance_present > 0)
          .map((r) => r.student_id)
      )

      const studentsWithRemarks = new Set(
        resultsRes.data
          ?.filter((r) => (r.teacher_remark && r.teacher_remark.trim().length > 0) || (r.principal_remark && r.principal_remark.trim().length > 0))
          .map((r) => r.student_id)
      )

      setAttendanceCompletion({
        completed: studentsWithAttendance.size,
        total: students.length,
      })
      setCompletedAttendanceSet(studentsWithAttendance)

      setRemarksCompletion({
        completed: studentsWithRemarks.size,
        total: students.length,
      })
      setCompletedRemarksSet(studentsWithRemarks)
    }

    fetchCompletionStats()
  }, [initialClassId, sessionId, termId, students, supabase, refreshKey])

  // Fetch student data when selected (Parallelized)
  useEffect(() => {
    async function fetchStudentData() {
      if (!selectedStudent) return
      setLoading(true)

      try {
        const [scoresRes, skillsRes, resultRes, classSubjsRes] = await Promise.all([
          supabase
            .from("student_scores")
            .select(`
              score,
              grade,
              remarks,
              assessment:assessments!inner(
                class_id,
                session_id,
                term_id,
                subject:subjects(id, name),
                assessment_type:assessment_types(name),
                subject_component:subject_components(id, name)
              )
            `)
            .eq("student_id", selectedStudent.id)
            .eq("assessment.class_id", initialClassId || classData?.id)
            .eq("assessment.session_id", sessionId)
            .eq("assessment.term_id", termId),

          supabase
            .from("student_skills")
            .select("skill_category, skill_name, rating")
            .eq("student_id", selectedStudent.id)
            .eq("session_id", sessionId)
            .eq("term_id", termId),

          supabase
            .from("student_results")
            .select("teacher_remark, principal_remark, attendance_present, total_school_days")
            .eq("student_id", selectedStudent.id)
            .eq("session_id", sessionId)
            .eq("term_id", termId)
            .maybeSingle(),

          supabase
            .from("class_subjects")
            .select("subject_id, subject:subjects(id, name, code)")
            .eq("class_id", initialClassId || classData?.id)
        ])

        const scoresData = scoresRes.data
        const skillsData = skillsRes.data
        const resultData = resultRes.data
        const classSubjsData = classSubjsRes.data

        // Organize scores by subject, grouping components into their parent subject
        const getGrade = (scoreVal: number): string => {
          if (scoreVal >= 95) return "A+"
          if (scoreVal >= 90) return "A"
          if (scoreVal >= 85) return "B+"
          if (scoreVal >= 80) return "B"
          if (scoreVal >= 75) return "C+"
          if (scoreVal >= 70) return "C"
          if (scoreVal >= 65) return "D+"
          if (scoreVal >= 60) return "D"
          if (scoreVal >= 50) return "E"
          return "F"
        }

        const getRemark = (scoreVal: number): string => {
          if (scoreVal >= 95) return "Outstanding"
          if (scoreVal >= 90) return "Excellent"
          if (scoreVal >= 85) return "Very Good"
          if (scoreVal >= 80) return "Good"
          if (scoreVal >= 75) return "Above Average"
          if (scoreVal >= 70) return "Average"
          if (scoreVal >= 65) return "Fair"
          if (scoreVal >= 60) return "Pass"
          if (scoreVal >= 50) return "Below Average"
          return "Fail"
        }

        const scoresBySubject = new Map<string, any>()

        // Pre-fill with all subjects assigned to the class
        classSubjsData?.forEach((cs: any) => {
          const sName = cs.subject?.name
          if (sName) {
            scoresBySubject.set(sName, {
              subject_id: cs.subject_id || cs.subject?.id,
              subject_name: sName,
              subject_name_raw: sName,
              ca1: null,
              ca2: null,
              exam: null,
              total: null,
              grade: "",
              remark: "",
              has_components: false,
              components: [],
            })
          }
        })

        scoresData?.forEach((score: any) => {
          const subjectNameRaw = score.assessment?.subject?.name
          const subjectId = score.assessment?.subject?.id
          const subjectComponent = score.assessment?.subject_component
          const subjectName = subjectNameRaw

          if (!subjectName) return

          if (!scoresBySubject.has(subjectName)) {
            scoresBySubject.set(subjectName, {
              subject_id: subjectId,
              subject_name: subjectName,
              subject_name_raw: subjectNameRaw,
              ca1: null,
              ca2: null,
              exam: null,
              total: null,
              grade: "",
              remark: "",
              has_components: false,
              components: [],
            })
          }

          const subjectScore = scoresBySubject.get(subjectName)
          const val = score.score !== null && score.score !== undefined ? score.score : null

          const assessmentType = score.assessment?.assessment_type?.name
          if (assessmentType?.includes("CA Test 1")) {
            if (val !== null) {
              subjectScore.ca1 = (subjectScore.ca1 || 0) + val
            }
          } else if (assessmentType?.includes("CA Test 2")) {
            if (val !== null) {
              subjectScore.ca2 = (subjectScore.ca2 || 0) + val
            }
          } else if (assessmentType?.includes("Exam")) {
            if (val !== null) {
              subjectScore.exam = (subjectScore.exam || 0) + val
            }
            if (!subjectComponent && score.remarks) {
              subjectScore.remark = score.remarks
            }
          }

          if (subjectComponent) {
            subjectScore.has_components = true
            let compObj = subjectScore.components.find((c: any) => c.name === subjectComponent.name)
            if (!compObj) {
              compObj = {
                name: subjectComponent.name,
                ca1: null,
                ca2: null,
                exam: null,
                total: null,
              }
              subjectScore.components.push(compObj)
            }
            if (assessmentType?.includes("CA Test 1")) {
              compObj.ca1 = val
            } else if (assessmentType?.includes("CA Test 2")) {
              compObj.ca2 = val
            } else if (assessmentType?.includes("Exam")) {
              compObj.exam = val
            }
            
            const hasCompCa1 = compObj.ca1 !== null
            const hasCompCa2 = compObj.ca2 !== null
            const hasCompExam = compObj.exam !== null
            const hasCompAny = hasCompCa1 || hasCompCa2 || hasCompExam
            compObj.total = hasCompAny ? ((compObj.ca1 || 0) + (compObj.ca2 || 0) + (compObj.exam || 0)) : null
          }
        })

        const classSubjectOrder = classSubjsData?.map((cs: any) => cs.subject?.name).filter(Boolean) || []
        const orderMap = new Map(classSubjectOrder.map((name: string, index: number) => [name.toLowerCase(), index]))

        const classStats = await getClassSubjectStats(initialClassId || classData?.id, sessionId, termId)

        // Calculate totals and sort by unified class subject order
        const scoresArray = Array.from(scoresBySubject.values())
          .map((s) => {
            const hasCa1 = s.ca1 !== null
            const hasCa2 = s.ca2 !== null
            const hasExam = s.exam !== null
            const hasAny = hasCa1 || hasCa2 || hasExam
            const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0)
            
            return {
              ...s,
              total: hasAny ? total : null,
              grade: hasAny ? getGrade(total) : "",
              remark: s.remark || (hasAny ? getRemark(total) : ""),
              subject_average: classStats[s.subject_name_raw || s.subject_name]?.average ?? null,
            }
          })
          .sort((a, b) => {
            const indexA = orderMap.has(a.subject_name.toLowerCase()) ? orderMap.get(a.subject_name.toLowerCase())! : 999
            const indexB = orderMap.has(b.subject_name.toLowerCase()) ? orderMap.get(b.subject_name.toLowerCase())! : 999
            if (indexA !== indexB) return indexA - indexB
            return a.subject_name.localeCompare(b.subject_name)
          })

        setScores(scoresArray)

        // Process skills
        const dbSkillsMap = new Map<string, number | null>()
        skillsData?.forEach((s) => {
          if (s.skill_name) {
            dbSkillsMap.set(s.skill_name.toLowerCase(), s.rating)
          }
        })

        const affective: Skill[] = DEFAULT_AFFECTIVE_SKILLS.map((name) => ({
          skill_category: "Affective",
          skill_name: name,
          rating: dbSkillsMap.has(name.toLowerCase()) ? dbSkillsMap.get(name.toLowerCase())! : null,
        }))

        const psychomotor: Skill[] = DEFAULT_PSYCHOMOTOR_SKILLS.map((name) => ({
          skill_category: "Psychomotor",
          skill_name: name,
          rating: dbSkillsMap.has(name.toLowerCase()) ? dbSkillsMap.get(name.toLowerCase())! : null,
        }))

        setAffectiveSkills(affective)
        setPsychomotorSkills(psychomotor)

        // Set remarks & attendance
        setTeacherRemarks(resultData?.teacher_remark || "")
        setPrincipalRemarks(resultData?.principal_remark || "")
        setAttendancePresent(resultData?.attendance_present !== undefined && resultData?.attendance_present !== null ? String(resultData.attendance_present) : "0")

        const rawTerm = terms.find((t) => t.id === termId)
        const currentSession = sessions.find((s) => s.id === sessionId)
        const computedResumption = getResumptionDate(rawTerm, currentSession)
        const currentTerm = rawTerm ? { ...rawTerm, resumption_date: computedResumption } : null
        const defaultSchoolDays = currentTerm?.total_school_days || 100
        setAttendanceTotal(resultData?.total_school_days ? String(resultData.total_school_days) : String(defaultSchoolDays))

        // Pre-populate printCardsData so current student's card is always in DOM ready for instant printing
        const currentSubjectScoresMap: Record<string, any> = {}
        scoresArray.forEach((s) => {
          currentSubjectScoresMap[s.subject_name] = {
            code: "",
            ca1: s.ca1,
            ca2: s.ca2,
            exam: s.exam,
            total: s.total,
            grade: s.grade,
            subject_average: s.subject_average,
            remark: "",
          }
        })

        const targetClass = activeClassObj || classData
        setPrintCardsData([
          {
            student: {
              ...selectedStudent,
              classes: targetClass ? { 
                name: targetClass.name, 
                section: targetClass.section,
                class_teacher: targetClass.class_teacher || targetClass.class_teacher_name || targetClass.teacher_name || "—"
              } : null,
            },
            session: currentSession,
            term: currentTerm,
            result: {
              ...resultData,
              total_students: students.length
            },
            subjectScores: currentSubjectScoresMap,
            school,
            skills: skillsData || [],
          },
        ])
      } catch (error) {
        console.error("[v0] Error fetching student data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [selectedStudent, sessionId, termId, terms, supabase])

  const handleClassSwitch = (newClassId: string) => {
    if (pathname.includes("/classes/")) {
      router.push(`/classes/${newClassId}?session=${sessionId}&term=${termId}`)
    } else if (showSelectors) {
      router.push(`${pathname}?session=${sessionId}&term=${termId}&class=${newClassId}`)
    } else {
      router.push(`/classes/${newClassId}`)
    }
  }

  const handleSessionChange = (value: string) => {
    setSessionId(value)
    if (pathname.includes("/classes/")) {
      router.push(`/classes/${initialClassId}?session=${value}&term=${termId}`)
    } else {
      router.push(`${pathname}?session=${value}&term=${termId}&class=${initialClassId}`)
    }
  }

  const handleTermChange = (value: string) => {
    setTermId(value)
    if (pathname.includes("/classes/")) {
      router.push(`/classes/${initialClassId}?session=${sessionId}&term=${value}`)
    } else {
      router.push(`${pathname}?session=${sessionId}&term=${value}&class=${initialClassId}`)
    }
  }

  const handleSkillRatingChange = (
    category: "Affective" | "Psychomotor",
    skillName: string,
    rating: number
  ) => {
    if (category === "Affective") {
      setAffectiveSkills((prev) =>
        prev.map((s) =>
          s.skill_name === skillName
            ? { ...s, rating: s.rating === rating ? null : rating }
            : s
        )
      )
    } else {
      setPsychomotorSkills((prev) =>
        prev.map((s) =>
          s.skill_name === skillName
            ? { ...s, rating: s.rating === rating ? null : rating }
            : s
        )
      )
    }
  }

  const handleBulkSetRating = (
    category: "Affective" | "Psychomotor",
    rating: number
  ) => {
    if (category === "Affective") {
      setAffectiveSkills((prev) => prev.map((s) => ({ ...s, rating })))
    } else {
      setPsychomotorSkills((prev) => prev.map((s) => ({ ...s, rating })))
    }
  }

  const handleClearSubjectScores = async (subjectName: string, subjectId?: string) => {
    if (!selectedStudent) return

    try {
      let targetSubjectId = subjectId
      if (!targetSubjectId) {
        const { data: sub } = await supabase
          .from("subjects")
          .select("id")
          .eq("name", subjectName)
          .single()
        targetSubjectId = sub?.id
      }

      if (!targetSubjectId) {
        toast.error("Could not locate subject ID")
        return
      }

      const { data: assessments, error: assErr } = await supabase
        .from("assessments")
        .select("id")
        .eq("class_id", initialClassId || classData?.id)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("subject_id", targetSubjectId)

      if (assErr) throw assErr

      if (assessments && assessments.length > 0) {
        const assIds = assessments.map((a: any) => a.id)
        const { error: delErr } = await supabase
          .from("student_scores")
          .delete()
          .eq("student_id", selectedStudent.id)
          .in("assessment_id", assIds)

        if (delErr) throw delErr
      }

      // Optimistically update local scores state
      setScores(prev => prev.filter(s => s.subject_name !== subjectName))
      setRefreshKey(prev => prev + 1)

      toast.success(`Scores Cleared`, {
        description: `Cleared scores for ${subjectName} (${selectedStudent.first_name} ${selectedStudent.last_name}).`,
      })
    } catch (err: any) {
      console.error("Error clearing scores:", err)
      toast.error("Clear Scores Failed", { description: err.message || "Failed to clear scores" })
    }
  }

  const handleSave = async () => {
    if (!selectedStudent) return
    setLoading(true)

    try {
      // Get current user id
      const userRes = await supabase.auth.getUser()
      const userId = userRes.data.user?.id

      // Prepare bulk skills payload
      const allSkills = [...affectiveSkills, ...psychomotorSkills]
      const skillsPayload = allSkills.map((skill) => ({
        student_id: selectedStudent.id,
        session_id: sessionId,
        term_id: termId,
        class_id: initialClassId,
        skill_category: skill.skill_category,
        skill_name: skill.skill_name,
        rating: skill.rating,
        assessed_by: userId,
      }))

      // Prepare results payload
      const totalScore = scores.reduce((sum, s) => sum + (s.total || 0), 0)
      const maxScore = scores.length * 100
      const averageScore = scores.length > 0 ? (totalScore / maxScore) * 100 : 0
      const totalSubjects = scores.length
      const subjectsPassed = scores.filter((s) => (s.total || 0) >= 50).length
      const subjectsFailed = scores.filter((s) => s.total !== null && s.total < 50).length
      const presentNum = parseInt(attendancePresent, 10) || 0
      const totalNum = parseInt(attendanceTotal, 10) || 0

      const resultPayload = {
        student_id: selectedStudent.id,
        session_id: sessionId,
        term_id: termId,
        class_id: initialClassId,
        total_score: totalScore,
        average_score: averageScore,
        total_subjects: totalSubjects,
        subjects_passed: subjectsPassed,
        subjects_failed: subjectsFailed,
        teacher_remark: teacherRemarks,
        principal_remark: principalRemarks,
        attendance_present: presentNum,
        total_school_days: totalNum,
      }

      // Execute bulk skills upsert AND result upsert in PARALLEL!
      const [skillsRes, resultRes] = await Promise.all([
        supabase
          .from("student_skills")
          .upsert(skillsPayload, { onConflict: "student_id, session_id, term_id, skill_name" }),
        supabase
          .from("student_results")
          .upsert(resultPayload, { onConflict: "student_id, session_id, term_id" }),
      ])

      if (skillsRes.error) throw skillsRes.error
      if (resultRes.error) throw resultRes.error

      // Trigger instant refresh for top KPI completion cards
      setRefreshKey((prev) => prev + 1)

      toast.success("Evaluation Saved!", {
        description: `Successfully saved evaluation and attendance for ${selectedStudent.first_name} ${selectedStudent.last_name}.`,
      })
    } catch (error) {
      console.error("[v0] Error saving results:", error)
      toast.error("Save Failed", {
        description: "Failed to save finalized evaluation. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Keyboard shortcut (Ctrl + S / Cmd + S) for student view save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (viewMode === "student" && selectedStudent && !loading) {
          handleSave()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [viewMode, selectedStudent, loading, handleSave])

  const totalScore = scores.reduce((sum, s) => sum + (s.total || 0), 0)
  const maxScore = scores.length * 100 // Assuming 100 per subject
  const averageScore = scores.length > 0 ? (totalScore / maxScore) * 100 : 0
  const grade = averageScore >= 95 ? "A+" : averageScore >= 90 ? "A" : averageScore >= 85 ? "B+" : averageScore >= 80 ? "B" : averageScore >= 75 ? "C+" : averageScore >= 70 ? "C" : averageScore >= 65 ? "D+" : averageScore >= 60 ? "D" : averageScore >= 50 ? "E" : "F"

  useEffect(() => {
    const isTemplateTeacher = !teacherRemarks || AUTO_COMMENTS.includes(teacherRemarks.trim())
    if (isTemplateTeacher && scores.length > 0) {
      const computedComment = getTeacherCommentForAverage(averageScore)
      if (teacherRemarks !== computedComment) {
        setTeacherRemarks(computedComment)
      }
    }

    const isTemplatePrincipal = !principalRemarks || AUTO_PRINCIPAL_COMMENTS.includes(principalRemarks.trim())
    if (isTemplatePrincipal && scores.length > 0) {
      const computedComment = getPrincipalCommentForAverage(averageScore)
      if (principalRemarks !== computedComment) {
        setPrincipalRemarks(computedComment)
      }
    }
  }, [averageScore, scores.length, teacherRemarks, principalRemarks])


  const renderStudentsTab = () => {
    return (
      <Card className="py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Enrolled Students</h3>
              <p className="text-xs text-muted-foreground">{enrolledStudents.length} student(s) enrolled</p>
            </div>
            {hasAdminAccess && (
              <Button onClick={() => setShowAddStudentModal(true)} size="sm" className="h-8">
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            )}
          </div>
          
          <div className="border rounded-xl overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-zinc-900/30">
                  <TableHead className="w-[80px]">Photo</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  {hasAdminAccess && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents.length > 0 ? (
                  enrolledStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 cursor-pointer"
                      onClick={() => {
                        setDetailSheetStudentId(student.id)
                        setIsDetailsSheetOpen(true)
                      }}
                    >
                      <TableCell className="py-2">
                        <Avatar className="h-8 w-8">
                          {student.photo_url && <AvatarImage src={student.photo_url} />}
                          <AvatarFallback className="text-[10px] font-bold">
                            {student.first_name?.[0]}
                            {student.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-semibold text-xs py-2">{student.student_id}</TableCell>
                      <TableCell className="text-xs font-medium py-2">
                        {student.first_name} {student.middle_name} {student.last_name}
                      </TableCell>
                      <TableCell className="text-xs py-2">{student.gender}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={student.status === "Active" ? "default" : "secondary"} className="text-[9px] font-bold px-1.5 py-0.5">
                          {student.status}
                        </Badge>
                      </TableCell>
                      {hasAdminAccess && (
                        <TableCell className="text-right py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditModalStudent(student)
                                setIsEditModalOpen(true)
                              }}
                              title="Edit Student"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveStudent(student.enrollment_id)}
                              title="Remove Student"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={hasAdminAccess ? 6 : 5} className="text-center text-muted-foreground py-8 text-xs italic">
                      No students enrolled in this class yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderSubjectsTab = () => {
    return (
      <Card className="py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Class Subjects</h3>
              <p className="text-xs text-muted-foreground">{classSubjects.length} subject(s) configured</p>
            </div>
            {hasAdminAccess && (
              <Button onClick={() => setShowAddSubjectModal(true)} size="sm" className="h-8">
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            )}
          </div>

          <div className="border rounded-xl overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-zinc-900/30">
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Pass Mark</TableHead>
                  <TableHead>Teacher</TableHead>
                  {hasAdminAccess && <TableHead className="w-[100px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classSubjects.length > 0 ? (
                  classSubjects.map((cs) => (
                    <TableRow key={cs.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10">
                      <TableCell className="font-semibold text-xs py-2">
                        <div>
                          <span className="font-semibold block">{cs.subject?.name}</span>
                          {cs.components && cs.components.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {cs.components.map((comp: any) => (
                                <Badge
                                  key={comp.id}
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 bg-slate-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold"
                                >
                                  {comp.name} ({comp.max_ca + comp.max_exam})
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-2">{cs.subject?.code}</TableCell>
                      <TableCell className="text-xs py-2">{cs.max_score}</TableCell>
                      <TableCell className="text-xs py-2">{cs.pass_mark}</TableCell>
                      <TableCell className="text-xs py-2">
                        {cs.teacher ? (
                          <span className="font-medium text-foreground">
                            {cs.teacher.first_name} {cs.teacher.last_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Class teacher</span>
                        )}
                      </TableCell>
                      {hasAdminAccess && (
                        <TableCell className="text-right py-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setTempSubjectForReassign({
                                  id: cs.subject?.id,
                                  name: cs.subject?.name,
                                  teacher: cs.teacher,
                                })
                                setShowReassignTeacherModal(true)
                              }}
                              title="Assign Teacher"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveSubject(cs.id)}
                              title="Remove Subject"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={hasAdminAccess ? 6 : 5} className="text-center text-muted-foreground py-8 text-xs italic">
                      No subjects added to this class yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTeachersTab = () => {
    const classTeacherInitials = classDetails?.teacher
      ? `${classDetails.teacher.first_name?.[0] || ""}${classDetails.teacher.last_name?.[0] || ""}`
      : "??"

    return (
      <Card className="py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80 bg-transparent">
        <CardContent className="p-0 space-y-6">
          {/* Class Teacher Lead */}
          <Card className="border shadow-none overflow-hidden bg-white dark:bg-zinc-950">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Class Teacher Lead</CardTitle>
                  <CardDescription className="text-[11px]">Primary director of studies for this class</CardDescription>
                </div>
                {hasAdminAccess && (
                  <Button
                    onClick={() => setShowAssignClassTeacherModal(true)}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    {classDetails?.teacher ? "Change Lead" : "Assign Lead"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {classDetails?.teacher ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-border shadow-xs">
                    {classDetails.teacher.photo_url && <AvatarImage src={classDetails.teacher.photo_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-black">
                      {classTeacherInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-foreground">
                      {classDetails.teacher.first_name} {classDetails.teacher.last_name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {classDetails.teacher.email}</span>
                      {classDetails.teacher.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {classDetails.teacher.phone}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center border-2 border-dashed rounded-xl border-border">
                  <p className="text-xs text-muted-foreground italic">No primary lead assigned to this class</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specialist Subject Teachers */}
          <Card className="border shadow-none overflow-hidden bg-white dark:bg-zinc-950">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Specialist Subject Tracks</CardTitle>
                  <CardDescription className="text-[11px]">Teachers assigned to individual subjects</CardDescription>
                </div>
                {hasAdminAccess && (
                  <Button
                    onClick={() => setShowAssignSubjectTeacherModal(true)}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    Assign Specialist
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {classSubjects.filter(cs => cs.teacher).length > 0 ? (
                  classSubjects.filter(cs => cs.teacher).map((cs) => (
                    <div key={cs.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/20">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {cs.teacher.photo_url && <AvatarImage src={cs.teacher.photo_url} />}
                          <AvatarFallback className="text-[10px] font-bold">
                            {cs.teacher.first_name?.[0]}
                            {cs.teacher.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold leading-none text-foreground">
                            {cs.teacher.first_name} {cs.teacher.last_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">{cs.teacher.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 border-none bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {cs.subject?.name}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs text-muted-foreground italic">All curricula managed by class teacher lead</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    )
  }

  const renderSettingsTab = () => {
    return (
      <Card className="py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80 bg-transparent">
        <CardContent className="p-0 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Identity Settings */}
            <Card className={cn("border shadow-none overflow-hidden bg-white dark:bg-zinc-950", !hasAdminAccess && "opacity-60 pointer-events-none")}>
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/30 border-b border-border/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider">Identity Zone</CardTitle>
                <CardDescription className="text-[11px]">Manage class naming, section and placement</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-4">
                  <div className="grid gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Class Label</label>
                    <Input
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="bg-slate-50/50 dark:bg-zinc-900 border-none font-bold"
                      placeholder="e.g. Grade 1 Gold"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Section</label>
                    <Select
                      value={settingsForm.sectionId}
                      onValueChange={(val) => setSettingsForm({ ...settingsForm, sectionId: val })}
                    >
                      <SelectTrigger className="bg-slate-50/50 dark:bg-zinc-900 border-none font-bold">
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {allSections.map((sec) => (
                          <SelectItem key={sec.id} value={sec.id} className="font-bold">{sec.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Total Capacity</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={settingsForm.capacity}
                        onChange={(e) => setSettingsForm({ ...settingsForm, capacity: parseInt(e.target.value) })}
                        className="bg-slate-50/50 dark:bg-zinc-900 border-none font-bold pl-10"
                      />
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full font-bold uppercase tracking-wider text-xs rounded-xl"
                  onClick={async () => {
                    setIsUpdatingSettings(true)
                    try {
                      const classId = initialClassId || classData?.id
                      await updateClass(classId, {
                        name: settingsForm.name,
                        capacity: settingsForm.capacity,
                        section_id: settingsForm.sectionId
                      })
                      toast.success("Identity updated successfully")
                      setRefreshKey((prev) => prev + 1)
                    } catch (err) {
                      toast.error("Failed to update class")
                    } finally {
                      setIsUpdatingSettings(false)
                    }
                  }}
                  disabled={isUpdatingSettings}
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>

            {/* Danger zone / Guardrails */}
            <div className="space-y-6">
              <Card className="border shadow-none overflow-hidden bg-white dark:bg-zinc-950">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/30 border-b border-border/50">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Academic Guardrails</CardTitle>
                  <CardDescription className="text-[11px]">Global standards for this class</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/30 dark:bg-zinc-900/10 border">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold uppercase">Global Pass Mark</p>
                      <p className="text-[10px] text-muted-foreground italic">Apply default pass score to all subjects</p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">40%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/30 dark:bg-zinc-900/10 border">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold uppercase">Attendance Alert</p>
                      <p className="text-[10px] text-muted-foreground italic">Flag students below 85% attendance</p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">Inactive</span>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className={cn("border border-red-200/50 dark:border-red-900/30 shadow-none overflow-hidden bg-white dark:bg-zinc-950", !hasAdminAccess && "opacity-60 pointer-events-none")}>
                <CardHeader className="bg-red-50/20 dark:bg-red-950/10 border-b border-red-200/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-destructive">Danger Zone</CardTitle>
                  <CardDescription className="text-[11px] text-destructive/80">Destructive administrative actions</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => {
                    const classId = initialClassId || classData?.id
                    toast.promise(updateClass(classId, { is_active: !classDetails?.is_active }), {
                      loading: 'Processing...',
                      success: 'Class state toggled',
                      error: 'Failed to archive'
                    })
                  }}>
                    <div>
                      <p className="text-xs font-bold uppercase">Archive Class</p>
                      <p className="text-[10px] text-muted-foreground italic">Temporarily disable access for this period</p>
                    </div>
                    <Archive className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between group cursor-pointer" onClick={() => setShowDeleteDialog(true)}>
                    <div>
                      <p className="text-xs font-bold uppercase text-destructive">Permanently Delete</p>
                      <p className="text-[10px] text-muted-foreground italic">Erase class and all associated records forever</p>
                    </div>
                    <Trash2 className="h-4 w-4 text-destructive/60 group-hover:text-destructive transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Delete Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="border-none dark:bg-zinc-950 rounded-3xl p-8 shadow-2xl">
              <AlertDialogHeader>
                <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-lg font-bold uppercase">Critical Action</AlertDialogTitle>
                <AlertDialogDescription className="text-xs font-medium">
                  This will PERMANENTLY erase <span className="text-destructive font-bold">{classDetails?.name}</span>. This action is irreversible and all student results linked to this class will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6 gap-3">
                <AlertDialogCancel className="h-10 border-none bg-slate-100 dark:bg-zinc-900 text-xs font-bold uppercase rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      const classId = initialClassId || classData?.id
                      await deleteClass(classId)
                      toast.success("Class terminated")
                      router.push("/classes")
                    } catch (err) {
                      toast.error("An error occurred during termination")
                    }
                  }}
                  className="h-10 bg-destructive text-destructive-foreground text-xs font-bold uppercase rounded-xl px-6 hover:bg-destructive/90"
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    )
  }

  const activeClassObj = classes.find((c) => c.id === initialClassId) || classData

  return (
    <>
      <div className="flex h-full flex-col gap-4 p-4 print:hidden w-full max-w-full overflow-x-hidden">
      {/* Header */}
      {(showTitle || showSelectors) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full">
          {showTitle && (
            <div className="flex flex-wrap items-center gap-2.5 max-w-full">
              {/* Vercel-style Class Switcher */}
              <div className="flex flex-wrap items-center gap-2 max-w-full">
                <Popover open={classDropdownOpen} onOpenChange={setClassDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-1.5 -ml-1.5 hover:bg-accent/80 hover:text-accent-foreground flex items-center gap-2 text-left rounded-lg transition-colors group max-w-full min-w-0"
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <h1 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                          {activeClassObj?.name || "Select Class"}
                        </h1>
                        {activeClassObj?.section?.name && (
                          <span className="text-xs font-semibold text-muted-foreground shrink-0">
                            ({activeClassObj.section.name})
                          </span>
                        )}
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ml-0.5 shrink-0" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0 shadow-lg" align="start">
                    <Command>
                      <CommandInput placeholder="Search class..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">No class found.</CommandEmpty>
                        <CommandGroup heading="Classes">
                          {classes.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.section?.name || ""}`}
                              onSelect={() => {
                                setClassDropdownOpen(false)
                                handleClassSwitch(c.id)
                              }}
                              className="flex items-center justify-between text-xs py-2 cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold">{c.name}</span>
                                <span className="text-[10px] text-muted-foreground">{c.section?.name || "General"}</span>
                              </div>
                              {c.id === (initialClassId || classData?.id) && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* View Mode Switcher */}
                <div className="flex h-7 items-center rounded-lg border bg-muted/40 p-0.5 gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode("student")}
                    className={cn(
                      "h-6 px-2 text-[11px] font-bold flex items-center gap-1 rounded-md transition-all",
                      viewMode === "student"
                        ? "bg-background shadow-2xs text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Student View"
                  >
                    <User className="h-3 w-3" />
                    <span className="hidden sm:inline">Student View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("subject")}
                    className={cn(
                      "h-6 px-2 text-[11px] font-bold flex items-center gap-1 rounded-md transition-all",
                      viewMode === "subject"
                        ? "bg-background shadow-2xs text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Subject View"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span className="hidden sm:inline">Subject View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("class_info")}
                    className={cn(
                      "h-6 px-2 text-[11px] font-bold flex items-center gap-1 rounded-md transition-all",
                      viewMode === "class_info"
                        ? "bg-background shadow-2xs text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Class Info"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span className="hidden sm:inline">Class Info</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {showSelectors && (
            <div className="shrink-0 max-w-full overflow-x-auto">
              <SessionTermSelector
                sessions={sessions}
                terms={terms}
                selectedSessionId={sessionId}
                selectedTermId={termId}
                updateUrlOnSelect={true}
                size="sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Subject View Container (Kept in DOM to prevent reloading data on tab switch) */}
      <div className={cn(viewMode === "subject" ? "block" : "hidden")}>
        <SubjectResultView
          classId={initialClassId || classData?.id}
          sessionId={sessionId}
          termId={termId}
          students={students}
          subjects={classSubjectsList}
          onSwitchToSubjectView={() => setViewMode("subject")}
          onSaveSuccess={() => {
            setRefreshKey((prev) => prev + 1)
            if (selectedStudent) {
              setSelectedStudent((prev) => (prev ? { ...prev } : null))
            }
          }}
        />
      </div>

      {/* Student View Container (Kept in DOM) */}
      <div className={cn("flex flex-col gap-4 flex-1", viewMode === "student" ? "flex" : "hidden")}>
        {/* Completion Stats Grid (4 Lightly Color-Coded KPIs) */}
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Scores Completion - Subtle Blue */}
        <Card className="py-0 shadow-none bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20 dark:border-blue-500/30 text-blue-950 dark:text-blue-100 min-w-[130px] lg:min-w-0 shrink-0 lg:shrink">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/80 dark:text-blue-400/80">Scores</p>
                <p className="text-sm font-bold mt-0.5 text-blue-900 dark:text-blue-200">
                  {scoresCompletion.completed}/{scoresCompletion.total}
                </p>
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {scoresCompletion.total > 0
                  ? Math.round((scoresCompletion.completed / scoresCompletion.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skills Completion - Subtle Purple */}
        <Card className="py-0 shadow-none bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/20 dark:border-purple-500/30 text-purple-950 dark:text-purple-100 min-w-[130px] lg:min-w-0 shrink-0 lg:shrink">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-600/80 dark:text-purple-400/80">Skills</p>
                <p className="text-sm font-bold mt-0.5 text-purple-900 dark:text-purple-200">
                  {skillsCompletion.completed}/{skillsCompletion.total}
                </p>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {skillsCompletion.total > 0
                  ? Math.round((skillsCompletion.completed / skillsCompletion.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Completion - Subtle Emerald */}
        <Card className="py-0 shadow-none bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100 min-w-[130px] lg:min-w-0 shrink-0 lg:shrink">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80">Attendance</p>
                <p className="text-sm font-bold mt-0.5 text-emerald-900 dark:text-emerald-200">
                  {attendanceCompletion.completed}/{attendanceCompletion.total}
                </p>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {attendanceCompletion.total > 0
                  ? Math.round((attendanceCompletion.completed / attendanceCompletion.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Remarks Completion - Subtle Amber */}
        <Card className="py-0 shadow-none bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 dark:border-amber-500/30 text-amber-950 dark:text-amber-100 min-w-[130px] lg:min-w-0 shrink-0 lg:shrink">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80 dark:text-amber-400/80">Remarks </p>
                <p className="text-sm font-bold mt-0.5 text-amber-900 dark:text-amber-200">
                  {remarksCompletion.completed}/{remarksCompletion.total}
                </p>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {remarksCompletion.total > 0
                  ? Math.round((remarksCompletion.completed / remarksCompletion.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Students List */}
        <Card className="w-full lg:w-[320px] py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
          <CardContent className="flex h-full flex-col gap-2.5 p-3">
            {/* Sidebar Title & Filter Button Popover */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold">Students</h2>
                <span className="text-xs text-muted-foreground font-semibold">({filteredStudents.length})</span>
              </div>

              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={isFilterActive ? "secondary" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs gap-1.5 font-medium relative"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                      <Badge variant="default" className="h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full ml-0.5">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-3 space-y-3 shadow-xl" align="end">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider">Filter Students</h4>
                    {isFilterActive && (
                      <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-6 px-1.5 text-[11px] text-muted-foreground gap-1 hover:text-foreground">
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {/* Overall Status */}
                    <div>
                      <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">Overall Status</label>
                      <div className="grid grid-cols-3 gap-1 bg-muted/30 p-0.5 rounded-lg border border-border/50">
                        <button
                          onClick={() => setFilterStatus("all")}
                          className={cn("py-1 text-xs font-semibold rounded-md transition-colors", filterStatus === "all" ? "bg-background shadow-2xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterStatus("completed")}
                          className={cn("py-1 text-xs font-semibold rounded-md transition-colors", filterStatus === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground hover:text-foreground")}
                        >
                          Done
                        </button>
                        <button
                          onClick={() => setFilterStatus("incomplete")}
                          className={cn("py-1 text-xs font-semibold rounded-md transition-colors", filterStatus === "incomplete" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground hover:text-foreground")}
                        >
                          Pending
                        </button>
                      </div>
                    </div>

                    {/* Detailed Category Filters */}
                    <div className="space-y-2 pt-1 border-t border-border/40">
                      <label className="text-[11px] font-bold uppercase text-muted-foreground block">Criteria Status</label>
                      
                      {/* Scores */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Scores</span>
                        <Select value={filterScores} onValueChange={(val: any) => setFilterScores(val)}>
                          <SelectTrigger className="h-7 w-[110px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="all" className="text-xs">All</SelectItem>
                            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Skills */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Skills</span>
                        <Select value={filterSkills} onValueChange={(val: any) => setFilterSkills(val)}>
                          <SelectTrigger className="h-7 w-[110px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="all" className="text-xs">All</SelectItem>
                            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Attendance */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Attendance</span>
                        <Select value={filterAttendance} onValueChange={(val: any) => setFilterAttendance(val)}>
                          <SelectTrigger className="h-7 w-[110px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="all" className="text-xs">All</SelectItem>
                            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Remarks */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Remarks</span>
                        <Select value={filterRemarks} onValueChange={(val: any) => setFilterRemarks(val)}>
                          <SelectTrigger className="h-7 w-[110px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="all" className="text-xs">All</SelectItem>
                            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-background"
            />

            {/* Line-Separated Compact Student List */}
            <div className="flex-1 overflow-y-auto pr-0 border border-border/60 rounded-xl bg-background divide-y divide-border/40">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const isCompleted = isStudentFullyCompleted(student.id)
                  const isSelected = selectedStudent?.id === student.id
                  return (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudent(student)
                        setMobileDetailOpen(true)
                        setMobileDetailType("student")
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent/60 relative",
                        isSelected && "bg-accent/80 font-semibold border-l-4 border-l-primary"
                      )}
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={student.photo_url || "/placeholder.svg"} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground leading-tight">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{student.student_id}</p>
                      </div>

                      {/* Green Checkmark Indicator for Completed Student */}
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/15 shrink-0 ml-auto" />
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No students match filter criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Details (Desktop) */}
        <Card className="hidden lg:block flex-1 py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80">
          <CardContent className="h-full overflow-y-auto p-4">
            {selectedStudent ? (
              <div className="space-y-4">
                {/* Student Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={selectedStudent.photo_url || "/placeholder.svg"} />
                      <AvatarFallback className="font-bold">
                        {selectedStudent.first_name[0]}
                        {selectedStudent.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailSheetStudentId(selectedStudent.id)
                            setIsDetailsSheetOpen(true)
                          }}
                          className="text-base font-bold leading-tight hover:text-blue-600 transition-colors text-left font-sans"
                        >
                          {selectedStudent.first_name} {selectedStudent.last_name}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-500 hover:text-foreground shrink-0 rounded-md"
                          onClick={() => {
                            setEditModalStudent(selectedStudent)
                            setIsEditModalOpen(true)
                          }}
                          title="Edit Student Information"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedStudent.student_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    
                    {/* Canva-style Split Group Print Button */}
                    <div className="inline-flex rounded-md border border-input bg-background p-0.5 shadow-2xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintCurrentStudent("print")}
                        disabled={isPreparingPrint}
                        className="h-7 gap-1.5 px-2.5 text-xs font-semibold rounded-r-none border-r border-border/60 hover:bg-accent"
                      >
                        {isPreparingPrint ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <Printer className="h-3.5 w-3.5" />
                        )}
                        {isPreparingPrint ? "Preparing..." : "Print"}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 rounded-none border-r border-border/60 hover:bg-accent"
                            title="Download Options"
                          >
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuItem onClick={() => handlePrintCurrentStudent("pdf")}>
                            <FileText className="mr-2 h-4 w-4 text-rose-500" />
                            Download as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintCurrentStudent("image")}>
                            <ImageIcon className="mr-2 h-4 w-4 text-emerald-500" />
                            Download as Image
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Popover open={printPopoverOpen} onOpenChange={setPrintPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 rounded-l-none hover:bg-accent"
                            title="Batch Print Options"
                          >
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 shadow-xl" align="end">
                          <div className="p-3 border-b border-border/60 flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider">Bulk Print Report Cards</h4>
                              <p className="text-[10px] text-muted-foreground font-medium">Select students to print in batch</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {selectedStudentIdsForPrint.length}/{students.length}
                            </Badge>
                          </div>

                          <div className="p-2 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                              <Checkbox
                                checked={selectedStudentIdsForPrint.length === students.length && students.length > 0}
                                onCheckedChange={handleToggleSelectAllPrint}
                              />
                              Select All Students
                            </label>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {selectedStudentIdsForPrint.length} selected
                            </span>
                          </div>

                          <div className="max-h-[220px] overflow-y-auto p-1.5 space-y-1">
                            {students.map((student) => (
                              <label
                                key={student.id}
                                className="flex items-center gap-2.5 p-2 rounded-md hover:bg-accent/60 cursor-pointer text-xs"
                              >
                                <Checkbox
                                  checked={selectedStudentIdsForPrint.includes(student.id)}
                                  onCheckedChange={() => handleToggleStudentPrint(student.id)}
                                />
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={student.photo_url} />
                                  <AvatarFallback className="text-[9px] font-bold">{student.first_name[0]}{student.last_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 truncate">
                                  <span className="font-semibold block truncate">{student.first_name} {student.last_name}</span>
                                  <span className="text-[9px] text-muted-foreground block">{student.student_id}</span>
                                </div>
                              </label>
                            ))}
                          </div>

                          <div className="p-2.5 border-t border-border/60 bg-muted/10 space-y-2">
                            <Button
                              onClick={() => handleExecuteBulkPrint("print")}
                              disabled={selectedStudentIdsForPrint.length === 0 || isPreparingPrint}
                              className="w-full h-8 text-xs font-bold gap-2"
                            >
                              {isPreparingPrint ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Printer className="h-3.5 w-3.5" />
                              )}
                              {isPreparingPrint
                                ? "Preparing..."
                                : `Print ${selectedStudentIdsForPrint.length} Selected`}
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                onClick={() => handleExecuteBulkPrint("pdf")}
                                disabled={selectedStudentIdsForPrint.length === 0 || isPreparingPrint}
                                className="h-8 text-xs font-bold gap-1.5 bg-white dark:bg-zinc-950"
                              >
                                <FileText className="h-3.5 w-3.5 text-rose-500" />
                                PDF
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleExecuteBulkPrint("image")}
                                disabled={selectedStudentIdsForPrint.length === 0 || isPreparingPrint}
                                className="h-8 text-xs font-bold gap-1.5 bg-white dark:bg-zinc-950"
                              >
                                <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
                                Images
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Top Stats Row: Summary (Total Score, Avg. Score, Grade) + DOB + Gender */}
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                  {/* Total Score */}
                  <Card className="min-w-[120px] flex-1 py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 shrink-0 sm:shrink">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Score</p>
                      <p className="text-sm font-bold mt-0.5 whitespace-nowrap">
                        {totalScore}/{maxScore}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Avg. Score */}
                  <Card className="min-w-[110px] flex-1 py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 shrink-0 sm:shrink">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg. Score</p>
                      <p className="text-sm font-bold mt-0.5 whitespace-nowrap">{averageScore.toFixed(0)}%</p>
                    </CardContent>
                  </Card>

                  {/* Grade */}
                  <Card className="min-w-[100px] flex-1 py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 shrink-0 sm:shrink">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Grade</p>
                      <p className="text-sm font-bold mt-0.5 whitespace-nowrap">{grade}</p>
                    </CardContent>
                  </Card>

                  {/* DOB */}
                  <Card className="min-w-[120px] flex-1 py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 shrink-0 sm:shrink">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DOB</p>
                      <p className="text-sm font-semibold mt-0.5 whitespace-nowrap">
                        {selectedStudent.date_of_birth
                          ? new Date(selectedStudent.date_of_birth).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : "N/A"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Gender */}
                  <Card className="min-w-[100px] flex-1 py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 shrink-0 sm:shrink">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender</p>
                      <p className="text-sm font-semibold mt-0.5 whitespace-nowrap">{selectedStudent.gender || "N/A"}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Scores Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Scores</h4>
                    <span className="text-[10px] text-muted-foreground font-medium">Right-click subject to clear scores</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <th className="border-r py-2 px-3 text-left">Subject</th>
                          <th className="border-r py-2 px-3 text-center">CA Test 1</th>
                          <th className="border-r py-2 px-3 text-center">CA Test 2</th>
                          <th className="border-r py-2 px-3 text-center">Exam</th>
                          <th className="border-r py-2 px-3 text-center">Total</th>
                          <th className="border-r py-2 px-3 text-center">Grade</th>
                          <th className="py-2 px-3 text-left">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((score, index) => (
                          <ContextMenu key={index}>
                            <ContextMenuTrigger asChild>
                              <tr className="border-b last:border-0 hover:bg-muted/20 text-xs cursor-context-menu select-none">
                                <td className="border-r py-2 px-3 font-semibold">
                                  <div className="flex items-center justify-between">
                                    <span>{score.subject_name}</span>
                                    {score.has_components && (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button 
                                            onClick={(e) => e.stopPropagation()} 
                                            className="ml-2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            title="View sub-components"
                                          >
                                            <Layers className="h-3.5 w-3.5" />
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent 
                                          className="w-[420px] p-0" 
                                          align="start"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-muted/30">
                                            <h5 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                              <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                              {score.subject_name} - Sub-components Breakdown
                                            </h5>
                                          </div>
                                          <div className="p-2 overflow-x-auto">
                                            <table className="w-full border-collapse text-[11px]">
                                              <thead>
                                                <tr className="border-b bg-muted/40 font-bold text-muted-foreground">
                                                  <th className="py-1.5 px-2 text-left">Sub-component</th>
                                                  <th className="py-1.5 px-2 text-center">CA 1</th>
                                                  <th className="py-1.5 px-2 text-center">CA 2</th>
                                                  <th className="py-1.5 px-2 text-center">Exam</th>
                                                  <th className="py-1.5 px-2 text-center font-black">Total</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {score.components && score.components.length > 0 ? (
                                                  score.components.map((comp: any, idx: number) => (
                                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/10">
                                                      <td className="py-1.5 px-2 font-medium">{comp.name}</td>
                                                      <td className="py-1.5 px-2 text-center text-muted-foreground">{comp.ca1 ?? "-"}</td>
                                                      <td className="py-1.5 px-2 text-center text-muted-foreground">{comp.ca2 ?? "-"}</td>
                                                      <td className="py-1.5 px-2 text-center text-muted-foreground">{comp.exam ?? "-"}</td>
                                                      <td className="py-1.5 px-2 text-center font-bold text-zinc-800 dark:text-zinc-200">{comp.total ?? "-"}</td>
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan={5} className="py-3 text-center text-muted-foreground italic">
                                                      No sub-component scores entered yet
                                                    </td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    )}
                                  </div>
                                </td>
                                <td className="border-r py-2 px-3 text-center text-muted-foreground">{score.ca1 ?? "-"}</td>
                                <td className="border-r py-2 px-3 text-center text-muted-foreground">{score.ca2 ?? "-"}</td>
                                <td className="border-r py-2 px-3 text-center text-muted-foreground">{score.exam ?? "-"}</td>
                                <td className="border-r py-2 px-3 text-center font-bold">
                                  {score.total !== null ? score.total : "-"}
                                </td>
                                <td className="border-r py-2 px-3 text-center font-bold">{score.grade || "-"}</td>
                                <td className="py-2 px-3 text-left text-muted-foreground font-medium">{score.remark || "-"}</td>
                              </tr>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-52">
                              <ContextMenuItem 
                                onClick={() => handleClearSubjectScores(score.subject_name, score.subject_id)}
                                className="text-rose-600 dark:text-rose-400 font-semibold focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50 gap-2 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear {score.subject_name} Scores
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Skills & Attendance */}
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Affective Skills */}
                  <div>
                    <Card className="py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
                          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Affective Skills</h4>
                          <div className="flex gap-2 text-[10px] font-bold text-muted-foreground">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleBulkSetRating("Affective", num)}
                                title={`Click to set all Affective Skills to ${num}`}
                                className="w-4 text-center hover:text-primary hover:scale-125 transition-all cursor-pointer select-none font-bold"
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {affectiveSkills.map((skill) => (
                            <div key={skill.skill_name} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                              <span className="text-xs font-medium">{skill.skill_name}</span>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Checkbox
                                    key={rating}
                                    checked={skill.rating === rating}
                                    onCheckedChange={() =>
                                      handleSkillRatingChange("Affective", skill.skill_name, rating)
                                    }
                                    className="h-4 w-4"
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Psychomotor Skills & Attendance Column */}
                  <div className="space-y-3">
                    {/* Psychomotor Skills */}
                    <div>
                      <Card className="py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Psychomotor Skills</h4>
                            <div className="flex gap-2 text-[10px] font-bold text-muted-foreground">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => handleBulkSetRating("Psychomotor", num)}
                                  title={`Click to set all Psychomotor Skills to ${num}`}
                                  className="w-4 text-center hover:text-primary hover:scale-125 transition-all cursor-pointer select-none font-bold"
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {psychomotorSkills.map((skill) => (
                              <div key={skill.skill_name} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                                <span className="text-xs font-medium">{skill.skill_name}</span>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <Checkbox
                                      key={rating}
                                      checked={skill.rating === rating}
                                      onCheckedChange={() =>
                                        handleSkillRatingChange("Psychomotor", skill.skill_name, rating)
                                      }
                                      className="h-4 w-4"
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Attendance Card */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Attendance Track</h4>
                        {(parseInt(attendanceTotal, 10) || 0) > 0 && (
                          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                            {(((parseInt(attendancePresent, 10) || 0) / (parseInt(attendanceTotal, 10) || 1)) * 100).toFixed(1)}% Present
                          </span>
                        )}
                      </div>
                      <Card className="py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80">
                        <CardContent className="p-3">
                          <div className="grid grid-cols-2 gap-3 items-center">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                Days Present
                              </label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={attendancePresent}
                                onChange={(e) => setAttendancePresent(e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                Total School Days
                              </label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="0"
                                value={attendanceTotal}
                                onChange={(e) => setAttendanceTotal(e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Teacher & Principal Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-muted-foreground">Teacher's Remarks</h4>
                    <Textarea
                      placeholder="Enter teacher remarks..."
                      value={teacherRemarks}
                      onChange={(e) => setTeacherRemarks(e.target.value)}
                      rows={1}
                      className="text-xs min-h-[36px] max-h-[80px] transition-all resize-y"
                    />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-muted-foreground">School Head Remarks</h4>
                    <Textarea
                      placeholder="Enter school head / principal remarks..."
                      value={principalRemarks}
                      onChange={(e) => setPrincipalRemarks(e.target.value)}
                      rows={1}
                      className="text-xs min-h-[36px] max-h-[80px] transition-all resize-y"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={loading} size="sm" className="h-9 px-6 font-bold">
                    {loading ? "Saving..." : "Save Finalized Evaluation"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-muted-foreground">Select a student to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Full-Screen Student Detail Slide-Over Overlay */}
      {mobileDetailOpen && mobileDetailType === "student" && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col lg:hidden overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between p-3 border-b bg-card shrink-0 gap-2 shadow-xs w-full max-w-full overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileDetailOpen(false)}
              className="h-8 px-2 text-xs font-bold gap-1 text-muted-foreground hover:text-foreground shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-center overflow-hidden">
              {selectedStudent && (
                <Avatar className="h-6 w-6 border shrink-0">
                  <AvatarImage src={selectedStudent.photo_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-[10px] font-bold">
                    {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="text-xs font-bold truncate min-w-0">
                {selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : "Student Details"}
              </span>
            </div>
            <Button onClick={handleSave} disabled={loading} size="sm" className="h-8 px-3 text-xs font-bold shrink-0">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-4 w-full max-w-full">
            {selectedStudent ? (
              <div className="space-y-4 w-full max-w-full overflow-x-hidden">
                {/* Top Stats Row */}
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
                  <Card className="min-w-[110px] flex-1 py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
                    <CardContent className="p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Score</p>
                      <p className="text-xs font-bold mt-0.5 whitespace-nowrap">{totalScore}/{maxScore}</p>
                    </CardContent>
                  </Card>
                  <Card className="min-w-[100px] flex-1 py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
                    <CardContent className="p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Avg. Score</p>
                      <p className="text-xs font-bold mt-0.5 whitespace-nowrap">{averageScore.toFixed(0)}%</p>
                    </CardContent>
                  </Card>
                  <Card className="min-w-[90px] flex-1 py-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
                    <CardContent className="p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Grade</p>
                      <p className="text-xs font-bold mt-0.5 whitespace-nowrap">{grade}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Scores Table */}
                <div className="w-full max-w-full overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Scores Breakdown</h4>
                  </div>
                  <div className="w-full rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-background overflow-hidden">
                    <table className="w-full table-fixed border-collapse text-xs">
                      <thead>
                        <tr className="border-b bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <th className="border-r py-2 px-2 text-left w-[32%]">Subject</th>
                          <th className="border-r py-2 px-1 text-center w-[13%]">CA1</th>
                          <th className="border-r py-2 px-1 text-center w-[13%]">CA2</th>
                          <th className="border-r py-2 px-1 text-center w-[14%]">Exam</th>
                          <th className="border-r py-2 px-1 text-center w-[14%]">Total</th>
                          <th className="py-2 px-1 text-center w-[14%]">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((score, index) => (
                          <tr key={index} className="border-b last:border-0 hover:bg-muted/20 text-xs">
                            <td className="border-r py-2 px-2 font-semibold truncate text-[11px]">{score.subject_name}</td>
                            <td className="border-r py-2 px-1 text-center text-muted-foreground font-mono text-[11px]">{score.ca1 ?? "-"}</td>
                            <td className="border-r py-2 px-1 text-center text-muted-foreground font-mono text-[11px]">{score.ca2 ?? "-"}</td>
                            <td className="border-r py-2 px-1 text-center text-muted-foreground font-mono text-[11px]">{score.exam ?? "-"}</td>
                            <td className="border-r py-2 px-1 text-center font-bold font-mono text-[11px]">{score.total ?? "—"}</td>
                            <td className="py-2 px-1 text-center font-bold text-[11px]">{score.grade || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Behavioral & Psychomotor Skills */}
                <div className="border-t border-border/40 pt-3 space-y-3 w-full max-w-full overflow-hidden">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Behavioral Skills (1 - 5)</h4>
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-foreground">Affective Skills</h5>
                    <div className="rounded-lg border border-border/60 divide-y divide-border/40 bg-background overflow-hidden">
                      {affectiveSkills.map((skill) => (
                        <div key={skill.skill_name} className="flex items-center justify-between px-2.5 py-1.5 text-xs gap-2">
                          <span className="font-medium text-foreground text-[11px] truncate flex-1 min-w-0">{skill.skill_name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleSkillRatingChange("Affective", skill.skill_name, val)}
                                className={cn(
                                  "h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-all",
                                  skill.rating === val
                                    ? "bg-primary text-primary-foreground font-black shadow-2xs"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-foreground">Psychomotor Skills</h5>
                    <div className="rounded-lg border border-border/60 divide-y divide-border/40 bg-background overflow-hidden">
                      {psychomotorSkills.map((skill) => (
                        <div key={skill.skill_name} className="flex items-center justify-between px-2.5 py-1.5 text-xs gap-2">
                          <span className="font-medium text-foreground text-[11px] truncate flex-1 min-w-0">{skill.skill_name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleSkillRatingChange("Psychomotor", skill.skill_name, val)}
                                className={cn(
                                  "h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center transition-all",
                                  skill.rating === val
                                    ? "bg-primary text-primary-foreground font-black shadow-2xs"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="border-t border-border/40 pt-3 w-full max-w-full overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Attendance Track</h4>
                    {(parseInt(attendanceTotal, 10) || 0) > 0 && (
                      <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {(((parseInt(attendancePresent, 10) || 0) / (parseInt(attendanceTotal, 10) || 1)) * 100).toFixed(1)}% Present
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Days Present</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={attendancePresent}
                        onChange={(e) => setAttendancePresent(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Total School Days</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="0"
                        value={attendanceTotal}
                        onChange={(e) => setAttendanceTotal(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="border-t border-border/40 pt-3 space-y-3 w-full max-w-full overflow-hidden">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Teacher Remarks</label>
                    <Textarea
                      placeholder="Enter class teacher remarks..."
                      value={teacherRemarks}
                      onChange={(e) => setTeacherRemarks(e.target.value)}
                      rows={2}
                      className="text-xs min-h-[40px] resize-y"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Principal Remarks</label>
                    <Textarea
                      placeholder="Enter principal remarks..."
                      value={principalRemarks}
                      onChange={(e) => setPrincipalRemarks(e.target.value)}
                      rows={2}
                      className="text-xs min-h-[40px] resize-y"
                    />
                  </div>
                </div>

                {/* Mobile Bottom Save Button */}
                <div className="pt-2">
                  <Button onClick={handleSave} disabled={loading} size="sm" className="w-full h-9 font-bold">
                    {loading ? "Saving Evaluation..." : "Save Evaluation"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      </div>

      {/* Class Info Container */}
      <div className={cn("flex-1 overflow-hidden", viewMode === "class_info" ? "block" : "hidden")}>
        <div className="flex flex-col lg:flex-row h-full gap-4 overflow-hidden">
          {/* Sidebar */}
          <Card className="w-full lg:w-[200px] shrink-0 py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
            <CardContent className="flex flex-row lg:flex-col gap-1 p-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setActiveInfoTab("students")}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left whitespace-nowrap shrink-0 lg:w-full",
                  activeInfoTab === "students"
                    ? "bg-primary text-primary-foreground font-black"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Users className="h-4 w-4" />
                Students
              </button>
              <button
                onClick={() => setActiveInfoTab("subjects")}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left whitespace-nowrap shrink-0 lg:w-full",
                  activeInfoTab === "subjects"
                    ? "bg-primary text-primary-foreground font-black"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Book className="h-4 w-4" />
                Subjects
              </button>
              <button
                onClick={() => setActiveInfoTab("teachers")}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left whitespace-nowrap shrink-0 lg:w-full",
                  activeInfoTab === "teachers"
                    ? "bg-primary text-primary-foreground font-black"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Shield className="h-4 w-4" />
                Teachers
              </button>
              <button
                onClick={() => setActiveInfoTab("settings")}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left whitespace-nowrap shrink-0 lg:w-full",
                  activeInfoTab === "settings"
                    ? "bg-primary text-primary-foreground font-black"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto pr-1">
            {activeInfoTab === "students" && renderStudentsTab()}
            {activeInfoTab === "subjects" && renderSubjectsTab()}
            {activeInfoTab === "teachers" && renderTeachersTab()}
            {activeInfoTab === "settings" && renderSettingsTab()}
          </div>
        </div>
      </div>
      </div>

      {hasAdminAccess && (
        <>
          <AddStudentToClassModal
            open={showAddStudentModal}
            onOpenChange={setShowAddStudentModal}
            classId={initialClassId || classData?.id}
            sessionId={sessionId}
            termId={termId}
            unenrolledStudents={unenrolledStudents}
          />

          <ClassSubjectsChecklistModal
            open={showAddSubjectModal}
            onOpenChange={setShowAddSubjectModal}
            classId={initialClassId || classData?.id}
            classNameText={classDetails?.name || "Class"}
            onAssignedSubjectsChanged={() => {
              setRefreshKey((prev) => prev + 1)
              router.refresh()
            }}
          />

          <AssignTeacherModal
            open={showAssignClassTeacherModal}
            onOpenChange={setShowAssignClassTeacherModal}
            classId={initialClassId || classData?.id}
            sessionId={sessionId}
            teachers={allTeachers}
            type="class"
          />

          <AssignTeacherModal
            open={showAssignSubjectTeacherModal}
            onOpenChange={setShowAssignSubjectTeacherModal}
            classId={initialClassId || classData?.id}
            sessionId={sessionId}
            teachers={allTeachers}
            type="subject"
            subjects={classSubjects.map((cs) => ({ id: cs.subject?.id, name: cs.subject?.name }))}
          />

          {tempSubjectForReassign && (
            <ReassignTeacherModal
              open={showReassignTeacherModal}
              onOpenChange={setShowReassignTeacherModal}
              classId={initialClassId || classData?.id}
              sessionId={sessionId}
              subjectId={tempSubjectForReassign.id}
              subjectName={tempSubjectForReassign.name}
              currentTeacher={tempSubjectForReassign.teacher}
              teachers={allTeachers}
            />
          )}

          {/* Student Details Sheet drawer */}
          <StudentDetailsSheet
            studentId={detailSheetStudentId}
            open={isDetailsSheetOpen}
            onOpenChange={setIsDetailsSheetOpen}
            userRole={userRole}
            sessions={sessions}
            terms={terms}
            classes={classes}
          />

          {/* Student Editing Modal */}
          {editModalStudent && (
            <EditStudentModal
              student={editModalStudent}
              guardians={[]}
              open={isEditModalOpen}
              onOpenChange={(isOpen) => {
                setIsEditModalOpen(isOpen)
                if (!isOpen) {
                  setRefreshKey((prev) => prev + 1)
                  router.refresh()
                }
              }}
            />
          )}
        </>
      )}

      {/* Global Print Styles to guarantee app headers & sidebars hide during print */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, [data-slot="sidebar"], [role="navigation"] {
            display: none !important;
          }
          .report-card-print-area {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            z-index: auto !important;
            width: 297mm !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* Hidden Print Container for Single & Batch Printing */}
      <div 
        ref={printContainerRef}
        className="report-card-print-area bg-white text-black p-0 m-0 border-none shadow-none"
        style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}
      >
        {printCardsData.map((card, idx) => (
          <PrintableReportCard key={card.student?.id || idx} {...card} />
        ))}
      </div>
    </>
  )
}
