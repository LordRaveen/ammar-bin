"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
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
import { CheckCircle2, ChevronLeft, Save, SlidersHorizontal, ArrowLeft, Loader2, RotateCcw, Pencil, Printer, ChevronDown, Download, FileText, Image as ImageIcon, ChevronsUpDown, Check, Filter, ExternalLink } from "lucide-react"
import { PrintableReportCard } from "@/components/printable-report-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportReportCardsAsPDF, exportReportCardsAsImages } from "@/lib/export-report-card"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  subject_name: string
  ca1: number | null
  ca2: number | null
  exam: number | null
  total: number
  grade: string
  subject_position: number | null
  subject_highest: number | null
  subject_lowest: number | null
  subject_average: number | null
}

type Skill = {
  skill_category: "Affective" | "Psychomotor"
  skill_name: string
  rating: number | null
}

const DEFAULT_AFFECTIVE_SKILLS = [
  "Punctuality",
  "Politeness",
  "Neatness",
  "Honesty",
  "Leadership skill",
  "Cooperation",
  "Attentiveness",
  "Perseverance",
  "Attitude to work",
]

const DEFAULT_PSYCHOMOTOR_SKILLS = [
  "Handwriting",
  "Verbal fluency",
  "Sports",
  "Handling tools",
  "Drawing & painting",
]

interface Props {
  sessions: any[]
  terms: any[]
  classData: any
  classes?: any[]
  school?: any
  students: Student[]
  initialSessionId: string
  initialTermId: string
  initialClassId: string
  showSelectors?: boolean
  showTitle?: boolean
}

export function ResultFinalizationInterface({
  sessions,
  terms,
  classData,
  classes = [],
  school,
  students: initialStudents,
  initialSessionId,
  initialTermId,
  initialClassId,
  showSelectors = true,
  showTitle = true,
}: Props) {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [sessionId, setSessionId] = useState(initialSessionId)
  const [termId, setTermId] = useState(initialTermId)
  const [students, setStudents] = useState(initialStudents)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    initialStudents[0] || null
  )
  const [classDropdownOpen, setClassDropdownOpen] = useState(false)

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
  const [refreshKey, setRefreshKey] = useState(0)

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

  const preparePrintDataForStudents = async (studentIds: string[]) => {
    if (studentIds.length === 0) return
    setIsPreparingPrint(true)

    try {
      const cards: any[] = []
      const currentSession = sessions.find((s) => s.id === sessionId)
      const currentTerm = terms.find((t) => t.id === termId)

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
              subject:subjects(name, code),
              assessment_type:assessment_types(name)
            )
          `)
          .eq("student_id", stId)

        const subjectScoresMap: Record<string, any> = {}
        scoresData?.forEach((scoreItem: any) => {
          const subjName = scoreItem.assessment?.subject?.name
          const assessmentType = scoreItem.assessment?.assessment_type?.name

          if (!subjName) return

          if (!subjectScoresMap[subjName]) {
            subjectScoresMap[subjName] = {
              code: scoreItem.assessment?.subject?.code,
              ca1: null,
              ca2: null,
              exam: null,
              total: 0,
              grade: "",
              remark: "",
            }
          }

          if (assessmentType?.includes("CA Test 1")) {
            subjectScoresMap[subjName].ca1 = scoreItem.score
          } else if (assessmentType?.includes("CA Test 2")) {
            subjectScoresMap[subjName].ca2 = scoreItem.score
          } else if (assessmentType?.includes("Exam")) {
            subjectScoresMap[subjName].exam = scoreItem.score
            subjectScoresMap[subjName].grade = scoreItem.grade
            subjectScoresMap[subjName].remark = scoreItem.remarks
          }

          subjectScoresMap[subjName].total =
            (subjectScoresMap[subjName].ca1 || 0) +
            (subjectScoresMap[subjName].ca2 || 0) +
            (subjectScoresMap[subjName].exam || 0)
        })

        // Sort subjectScoresMap by class subjects order
        const { data: classSubjs } = await supabase
          .from("class_subjects")
          .select("subject:subjects(name)")
          .eq("class_id", initialClassId || classData?.id)

        const classSubjectOrder = classSubjs?.map((cs: any) => cs.subject?.name).filter(Boolean) || []
        
        const sortedSubjectScoresMap: Record<string, any> = {}
        const orderMap = new Map(classSubjectOrder.map((name: string, index: number) => [name.toLowerCase(), index]))
        
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
        if (action === "pdf") {
          await exportReportCardsAsPDF(nodes, "Report_Cards.pdf")
        } else if (action === "image") {
          const filenames = studentIds.map(id => `ReportCard_${id}.png`)
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

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
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
        supabase.from("student_scores").select("student_id").in("student_id", studentIds),
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
        const [scoresRes, skillsRes, resultRes] = await Promise.all([
          supabase
            .from("student_scores")
            .select(`
              score,
              grade,
              assessment:assessments(
                subject:subjects(name),
                assessment_type:assessment_types(name)
              )
            `)
            .eq("student_id", selectedStudent.id),

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
            .maybeSingle()
        ])

        const scoresData = scoresRes.data
        const skillsData = skillsRes.data
        const resultData = resultRes.data

        // Organize scores by subject
        const scoresBySubject = new Map<string, any>()
        scoresData?.forEach((score: any) => {
          const subjectName = score.assessment?.subject?.name
          const assessmentType = score.assessment?.assessment_type?.name

          if (!subjectName) return

          if (!scoresBySubject.has(subjectName)) {
            scoresBySubject.set(subjectName, {
              subject_name: subjectName,
              ca1: null,
              ca2: null,
              exam: null,
              total: 0,
              grade: "",
            })
          }

          const subjectScore = scoresBySubject.get(subjectName)
          if (assessmentType?.includes("CA Test 1")) {
            subjectScore.ca1 = score.score
          } else if (assessmentType?.includes("CA Test 2")) {
            subjectScore.ca2 = score.score
          } else if (assessmentType?.includes("Exam")) {
            subjectScore.exam = score.score
            subjectScore.grade = score.grade
          }
        })

        // Fetch class subjects ordering
        const { data: classSubjs } = await supabase
          .from("class_subjects")
          .select("subject:subjects(name)")
          .eq("class_id", initialClassId || classData?.id)

        const classSubjectOrder = classSubjs?.map((cs: any) => cs.subject?.name).filter(Boolean) || []
        const orderMap = new Map(classSubjectOrder.map((name: string, index: number) => [name.toLowerCase(), index]))

        // Calculate totals and sort by unified class subject order
        const scoresArray = Array.from(scoresBySubject.values())
          .map((s) => ({
            ...s,
            total: (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0),
          }))
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

        const currentTerm = terms.find((t) => t.id === termId)
        const currentSession = sessions.find((s) => s.id === sessionId)
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
    if (showSelectors) {
      router.push(`/assessments/results/finalize?session=${sessionId}&term=${termId}&class=${newClassId}`)
    } else {
      router.push(`/classes/${newClassId}`)
    }
  }

  const handleSessionChange = (value: string) => {
    setSessionId(value)
    router.push(
      `/assessments/results/finalize?session=${value}&term=${termId}&class=${initialClassId}`
    )
  }

  const handleTermChange = (value: string) => {
    setTermId(value)
    router.push(
      `/assessments/results/finalize?session=${sessionId}&term=${value}&class=${initialClassId}`
    )
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
      const totalScore = scores.reduce((sum, s) => sum + s.total, 0)
      const maxScore = scores.length * 100
      const averageScore = scores.length > 0 ? (totalScore / maxScore) * 100 : 0
      const totalSubjects = scores.length
      const subjectsPassed = scores.filter((s) => s.total >= 50).length
      const subjectsFailed = scores.filter((s) => s.total < 50).length
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

  const totalScore = scores.reduce((sum, s) => sum + s.total, 0)
  const maxScore = scores.length * 100 // Assuming 100 per subject
  const averageScore = scores.length > 0 ? (totalScore / maxScore) * 100 : 0
  const grade = averageScore >= 90 ? "A" : averageScore >= 80 ? "B" : averageScore >= 70 ? "C" : averageScore >= 60 ? "D" : "F"

  const activeClassObj = classes.find((c) => c.id === initialClassId) || classData

  return (
    <>
      <div className="flex h-full flex-col gap-4 p-4 print:hidden">
      {/* Header */}
      {(showTitle || showSelectors) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {showTitle && (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Vercel-style Class Switcher */}
              <div className="flex items-center gap-1.5">
                <Popover open={classDropdownOpen} onOpenChange={setClassDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-1.5 -ml-1.5 hover:bg-accent/80 hover:text-accent-foreground flex items-center gap-2 text-left rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {activeClassObj?.name || "Select Class"}
                        </h1>
                        {activeClassObj?.section?.name && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            ({activeClassObj.section.name})
                          </span>
                        )}
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ml-0.5" />
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

                {(initialClassId || classData?.id) && (
                  <a
                    href={`/classes/${initialClassId || classData?.id}?tab=scores`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open class scores tab in new tab"
                  >
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground">
                      <span>Class Scores</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
          {showSelectors && (
            <div className="flex gap-2">
              <Select value={sessionId} onValueChange={handleSessionChange}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id} className="text-xs">
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={termId} onValueChange={handleTermChange}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id} className="text-xs">
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Completion Stats Grid (4 Lightly Color-Coded KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Scores Completion - Subtle Blue */}
        <Card className="py-0 shadow-none bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20 dark:border-blue-500/30 text-blue-950 dark:text-blue-100">
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
        <Card className="py-0 shadow-none bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/20 dark:border-purple-500/30 text-purple-950 dark:text-purple-100">
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
        <Card className="py-0 shadow-none bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100">
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
        <Card className="py-0 shadow-none bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 dark:border-amber-500/30 text-amber-950 dark:text-amber-100">
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
        <Card className="w-[280px] sm:w-[320px] py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80">
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
                      onClick={() => setSelectedStudent(student)}
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

        {/* Student Details */}
        <Card className="flex-1 py-0 shadow-none border-zinc-200/80 dark:border-zinc-800/80">
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
                      <h3 className="text-base font-bold leading-tight">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedStudent.student_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    
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
                  <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">Scores</h4>
                  <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <th className="border-r py-2 px-3 text-left">Subject</th>
                          <th className="border-r py-2 px-3 text-center">CA Test 1</th>
                          <th className="border-r py-2 px-3 text-center">CA Test 2</th>
                          <th className="border-r py-2 px-3 text-center">Exam</th>
                          <th className="border-r py-2 px-3 text-center">Total</th>
                          <th className="py-2 px-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((score, index) => (
                          <tr key={index} className="border-b last:border-0 hover:bg-muted/20 text-xs">
                            <td className="border-r py-2 px-3 font-semibold">{score.subject_name}</td>
                            <td className="border-r py-2 px-3 text-center text-muted-foreground">{score.ca1 ?? "-"}</td>
                            <td className="border-r py-2 px-3 text-center text-muted-foreground">{score.ca2 ?? "-"}</td>
                            <td className="border-r py-2 px-3 text-center text-muted-foreground">{score.exam ?? "-"}</td>
                            <td className="border-r py-2 px-3 text-center font-bold">
                              {score.total}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">{score.grade}</td>
                          </tr>
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
      </div>

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
            width: 210mm !important;
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
