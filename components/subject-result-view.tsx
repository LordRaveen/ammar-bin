"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, BookOpen, Save, Pencil, X, Loader2, AlertTriangle, History, RefreshCw, Bookmark, CheckCircle2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { saveBatchSubjectScores, saveStudentScore } from "@/app/(dashboard)/classes/[id]/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  photo_url?: string | null
}

interface Subject {
  id: string
  name: string
  code?: string
}

interface SubjectResultViewProps {
  classId: string
  sessionId: string
  termId: string
  students: Student[]
  subjects: Subject[]
  initialSubjectId?: string
  isEditable?: boolean
  onSubjectChange?: (subjectId: string) => void
  onSaveSuccess?: () => void
  onSwitchToSubjectView?: () => void
}

interface ScoreDraft {
  ca1: string
  ca2: string
  exam: string
  remark: string
  isRemarkUserEditedManually?: boolean
}

export function SubjectResultView({
  classId,
  sessionId,
  termId,
  students = [],
  subjects = [],
  initialSubjectId,
  isEditable = true,
  onSubjectChange,
  onSaveSuccess,
  onSwitchToSubjectView,
}: SubjectResultViewProps) {
  const supabase = createBrowserClient()

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ""
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [scoresData, setScoresData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasComponents, setHasComponents] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeCell, setActiveCell] = useState<{ studentId: string; field: "ca1" | "ca2" | "exam" | "remark" } | null>(null)
  const [classComponentsList, setClassComponentsList] = useState<any[]>([])
  const [editingStudentForComponents, setEditingStudentForComponents] = useState<Student | null>(null)
  const [componentScores, setComponentScores] = useState<Record<string, { ca1: string; ca2: string; exam: string; remark: string }>>({})
  const [loadingComponentScores, setLoadingComponentScores] = useState(false)
  const [savingComponentScores, setSavingComponentScores] = useState(false)

  const handleCellDoubleClick = (studentId: string, field: "ca1" | "ca2" | "exam" | "remark") => {
    if (hasComponents) {
      const student = students.find(s => s.id === studentId)
      if (student) {
        handleOpenComponentModal(student)
      }
      return
    }
    setActiveCell({ studentId, field })
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  const handleOpenComponentModal = async (student: Student) => {
    setEditingStudentForComponents(student)
    setLoadingComponentScores(true)
    try {
      const { data } = await supabase
        .from("student_scores")
        .select(`
          score,
          grade,
          remarks,
          assessment:assessments!inner(
            subject_component_id,
            assessment_type:assessment_types(name)
          )
        `)
        .eq("student_id", student.id)
        .eq("assessment.class_id", classId)
        .eq("assessment.session_id", sessionId)
        .eq("assessment.term_id", termId)

      const initialScores: Record<string, { ca1: string; ca2: string; exam: string; remark: string }> = {}
      classComponentsList.forEach(comp => {
        initialScores[comp.component_id] = { ca1: "", ca2: "", exam: "", remark: "" }
      })

      data?.forEach(item => {
        const compId = item.assessment?.subject_component_id
        const typeName = item.assessment?.assessment_type?.name || ""
        if (!compId || !initialScores[compId]) return

        const scoreStr = item.score !== null && item.score !== undefined ? String(item.score) : ""
        if (typeName.includes("CA Test 1")) {
          initialScores[compId].ca1 = scoreStr
        } else if (typeName.includes("CA Test 2")) {
          initialScores[compId].ca2 = scoreStr
        } else if (typeName.includes("Exam")) {
          initialScores[compId].exam = scoreStr
          if (item.remarks) initialScores[compId].remark = item.remarks
        }
      })
      setComponentScores(initialScores)
    } catch (err) {
      console.error("Error loading component scores:", err)
      toast.error("Failed to load component scores")
    } finally {
      setLoadingComponentScores(false)
    }
  }

  const handleComponentScoreChange = (componentId: string, field: "ca1" | "ca2" | "exam" | "remark", value: string) => {
    // Input validation for scores
    if (field !== "remark") {
      if (value && !/^\d*\.?\d*$/.test(value)) return
      
      const comp = classComponentsList.find(c => c.component_id === componentId)
      if (comp) {
        const maxScore = field === "exam" ? comp.max_exam : comp.max_ca / 2
        const numVal = parseFloat(value)
        if (value && numVal > maxScore) {
          toast.warning(`Maximum score for ${comp.name} ${field.toUpperCase()} is ${maxScore}`)
          return
        }
      }
    }

    setComponentScores(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        [field]: value
      }
    }))
  }

  const handleSaveComponentScores = async () => {
    if (!editingStudentForComponents) return
    setSavingComponentScores(true)
    try {
      for (const comp of classComponentsList) {
        const scoreObj = componentScores[comp.component_id] || { ca1: "", ca2: "", exam: "", remark: "" }
        const caCount = comp.ca_count ?? 2
        const ca1Max = caCount === 1 ? comp.max_ca : (comp.max_ca / 2)
        const ca2Max = caCount === 1 ? 0 : (comp.max_ca / 2)
        const examMax = comp.max_exam

        const ca1Val = parseFloat(scoreObj.ca1)
        const ca2Val = caCount === 1 ? 0 : parseFloat(scoreObj.ca2)
        const examVal = parseFloat(scoreObj.exam)

        if (!isNaN(ca1Val) && (ca1Val < 0 || ca1Val > ca1Max)) {
          throw new Error(`CA 1 score for ${comp.name} must be between 0 and ${ca1Max}`)
        }
        if (caCount === 2 && !isNaN(ca2Val) && (ca2Val < 0 || ca2Val > ca2Max)) {
          throw new Error(`CA 2 score for ${comp.name} must be between 0 and ${ca2Max}`)
        }
        if (!isNaN(examVal) && (examVal < 0 || examVal > examMax)) {
          throw new Error(`Exam score for ${comp.name} must be between 0 and ${examMax}`)
        }

        const scorePayload = {
          ca1: isNaN(ca1Val) ? null : ca1Val,
          ca2: caCount === 1 ? null : (isNaN(ca2Val) ? null : ca2Val),
          exam: isNaN(examVal) ? null : examVal
        }

        const res = await saveStudentScore(
          editingStudentForComponents.id,
          selectedSubjectId,
          classId,
          sessionId,
          termId,
          scorePayload,
          scoreObj.remark || null,
          comp.component_id
        )

        if (res && !res.success) {
          throw new Error(res.error || `Failed to save score for component ${comp.name}`)
        }
      }
      toast.success(`Sub-component scores saved successfully!`)
      setEditingStudentForComponents(null)
      fetchScores()
    } catch (err: any) {
      console.error("Error saving component scores:", err)
      toast.error(err.message || "Failed to save sub-component scores")
    } finally {
      setSavingComponentScores(false)
    }
  }

  // Focus and select double-clicked cell ONCE, then clear activeCell so typing does not steal focus
  useEffect(() => {
    if (!activeCell || !isEditing) return

    const timer = setTimeout(() => {
      const el = document.getElementById(`score_input_${activeCell.studentId}_${activeCell.field}`) as HTMLInputElement | null
      if (el) {
        el.focus()
        el.select()
      }
      setActiveCell(null)
    }, 10)

    return () => clearTimeout(timer)
  }, [activeCell, isEditing])

  // Ref to hold edit mode state across subject switches
  const shouldMaintainEditModeRef = useRef(false)

  // Unsaved changes dialog states
  const [pendingSubjectId, setPendingSubjectId] = useState<string | null>(null)
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false)

  // Recovered Cache Draft Dialog states & Tabular Preview
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [recoveredCacheData, setRecoveredCacheData] = useState<any | null>(null)
  const [hasStoredDraft, setHasStoredDraft] = useState(false)

  // Local draft scores state for Excel-style editing
  const [draftScores, setDraftScores] = useState<Record<string, ScoreDraft>>({})

  // Storage key for caching unsaved drafts locally
  const cacheKey = `unsaved_subject_scores_${classId}_${sessionId}_${termId}`

  // Keep selected subject in sync
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id)
    }
  }, [subjects, selectedSubjectId])

  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0]
  }, [subjects, selectedSubjectId])

  // Map of original database scores per student for detecting actual changes
  const originalScoresMap = useMemo(() => {
    const tempMap: Record<string, { ca1: number | null; ca2: number | null; exam: number | null; remark: string }> = {}

    scoresData.forEach((item: any) => {
      const stId = item.student_id
      const typeName = item.assessment?.assessment_type?.name || ""
      const scoreVal = item.score !== null && item.score !== undefined ? Number(item.score) : 0

      if (!tempMap[stId]) {
        tempMap[stId] = { ca1: null, ca2: null, exam: null, remark: "" }
      }

      if (typeName.includes("CA Test 1")) {
        tempMap[stId].ca1 = (tempMap[stId].ca1 || 0) + scoreVal
      } else if (typeName.includes("CA Test 2")) {
        tempMap[stId].ca2 = (tempMap[stId].ca2 || 0) + scoreVal
      } else if (typeName.includes("Exam")) {
        tempMap[stId].exam = (tempMap[stId].exam || 0) + scoreVal
        if (item.remarks) tempMap[stId].remark = item.remarks
      }
    })

    const map: Record<string, { ca1: string; ca2: string; exam: string; remark: string }> = {}
    Object.entries(tempMap).forEach(([stId, data]) => {
      map[stId] = {
        ca1: data.ca1 !== null ? String(data.ca1) : "",
        ca2: data.ca2 !== null ? String(data.ca2) : "",
        exam: data.exam !== null ? String(data.exam) : "",
        remark: data.remark,
      }
    })

    return map
  }, [scoresData])

  // Grade remark auto-mapping according to exact metric image
  const getAutoRemark = (grade: string): string => {
    switch (grade) {
      case "A+":
        return "Outstanding"
      case "A":
        return "Excellent"
      case "B+":
        return "Very good"
      case "B":
        return "Good"
      case "C":
        return "Average"
      case "D":
        return "Weak"
      case "F":
        return "Fail"
      default:
        return ""
    }
  }

  // Grade calculator
  const calculateGrade = (total: number): string => {
    if (total >= 90) return "A+"
    if (total >= 80) return "A"
    if (total >= 70) return "B+"
    if (total >= 60) return "B"
    if (total >= 50) return "C"
    if (total >= 40) return "D"
    return "F"
  }

  // Fetch student scores for current class, session, term, and selected subject
  const fetchScores = async () => {
    if (!classId || !sessionId || !termId || !selectedSubjectId) return

    try {
      setIsLoading(true)

      // Step 1: Fetch assessments for this class, session, term, and subject
      const { data: assessments, error: assError } = await supabase
        .from("assessments")
        .select("id, assessment_type:assessment_types(name)")
        .eq("class_id", classId)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("subject_id", selectedSubjectId)

      if (assError) {
        console.error("[SubjectResultView] Error fetching assessments:", assError)
        setScoresData([])
        return
      }

      if (!assessments || assessments.length === 0) {
        setScoresData([])
        return
      }

      const assMap = new Map(assessments.map((a: any) => [a.id, a]))
      const assessmentIds = assessments.map((a: any) => a.id)

      // Step 2: Fetch student scores for those assessment IDs
      const { data: scores, error: scoresError } = await supabase
        .from("student_scores")
        .select("id, student_id, score, grade, remarks, assessment_id")
        .in("assessment_id", assessmentIds)

      if (scoresError) {
        console.error("[SubjectResultView] Error fetching student scores:", scoresError)
        setScoresData([])
        return
      }

      // Format data into expected structure
      const formatted = (scores || []).map((s: any) => ({
        id: s.id,
        student_id: s.student_id,
        score: s.score,
        grade: s.grade,
        remarks: s.remarks,
        assessment: assMap.get(s.assessment_id) || null,
      }))

      setScoresData(formatted)
    } catch (err) {
      console.error("[SubjectResultView] Error in fetchScores:", err)
      setScoresData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScores()
    if (shouldMaintainEditModeRef.current) {
      setIsEditing(true)
      shouldMaintainEditModeRef.current = false
    } else {
      setIsEditing(false)
    }
  }, [classId, sessionId, termId, selectedSubjectId])

  useEffect(() => {
    async function checkComponents() {
      if (!classId || !selectedSubjectId) return
      const { data } = await supabase
        .from("class_subject_components")
        .select(`
          id,
          subject_component_id,
          max_ca,
          max_exam,
          ca_count,
          component:subject_components(id, name)
        `)
        .eq("class_id", classId)
        .eq("subject_id", selectedSubjectId)
      
      if (data) {
        setClassComponentsList(data.map((c: any) => ({
          id: c.id,
          component_id: c.subject_component_id,
          name: c.component?.name || "",
          max_ca: c.max_ca ?? 40,
          max_exam: c.max_exam ?? 60,
          ca_count: c.ca_count ?? 2
        })))
        setHasComponents(data.length > 0)
      } else {
        setClassComponentsList([])
        setHasComponents(false)
      }
    }
    checkComponents()
  }, [classId, selectedSubjectId, supabase])

  // Initialize draft scores whenever scoresData or students change
  useEffect(() => {
    const initialDrafts: Record<string, ScoreDraft> = {}

    students.forEach((st) => {
      const existing = originalScoresMap[st.id] || { ca1: "", ca2: "", exam: "", remark: "" }
      
      const ca1Val = existing.ca1 !== "" ? Number(existing.ca1) : 0
      const ca2Val = existing.ca2 !== "" ? Number(existing.ca2) : 0
      const examVal = existing.exam !== "" ? Number(existing.exam) : 0
      const hasAnyScore = existing.ca1 !== "" || existing.ca2 !== "" || existing.exam !== ""
      const total = ca1Val + ca2Val + examVal
      const grade = hasAnyScore ? calculateGrade(total) : ""
      const computedRemark = existing.remark || (grade ? getAutoRemark(grade) : "")

      initialDrafts[st.id] = {
        ...existing,
        remark: computedRemark,
        isRemarkUserEditedManually: false,
      }
    })

    setDraftScores(initialDrafts)
  }, [students, originalScoresMap])

  // Check for unsaved draft cache on mount / class load
  useEffect(() => {
    try {
      const cachedRaw = localStorage.getItem(cacheKey)
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw)
        if (cached && cached.subjects && Object.keys(cached.subjects).length > 0) {
          setRecoveredCacheData(cached)
          setHasStoredDraft(true)
          setRestoreDialogOpen(true)
        }
      }
    } catch (e) {
      console.error("[Cache] Error checking cached draft scores:", e)
    }
  }, [cacheKey])

  // Auto-Save ONLY CHANGED SCORES to LocalStorage whenever draftScores change in edit mode
  useEffect(() => {
    if (!isEditing || !selectedSubjectId) return

    try {
      const changedScores: Record<string, { current: ScoreDraft; original: { ca1: string; ca2: string; exam: string; remark: string } }> = {}

      Object.entries(draftScores).forEach(([stId, draft]) => {
        const orig = originalScoresMap[stId] || { ca1: "", ca2: "", exam: "", remark: "" }
        const ca1Changed = draft.ca1 !== orig.ca1
        const ca2Changed = draft.ca2 !== orig.ca2
        const examChanged = draft.exam !== orig.exam
        const remarkChanged = draft.isRemarkUserEditedManually && draft.remark !== orig.remark

        if (ca1Changed || ca2Changed || examChanged || remarkChanged) {
          changedScores[stId] = {
            current: draft,
            original: orig,
          }
        }
      })

      const existingRaw = localStorage.getItem(cacheKey)
      const payload = existingRaw ? JSON.parse(existingRaw) : { classId, sessionId, termId, subjects: {} }
      payload.timestamp = new Date().toISOString()
      payload.subjects = payload.subjects || {}

      if (Object.keys(changedScores).length > 0) {
        payload.subjects[selectedSubjectId] = {
          subjectName: selectedSubject?.name || "Subject",
          subjectCode: selectedSubject?.code || "",
          changedScores,
        }
        localStorage.setItem(cacheKey, JSON.stringify(payload))
        setRecoveredCacheData(payload)
        setHasStoredDraft(true)
      } else {
        delete payload.subjects[selectedSubjectId]
        if (Object.keys(payload.subjects).length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(payload))
          setRecoveredCacheData(payload)
          setHasStoredDraft(true)
        } else {
          localStorage.removeItem(cacheKey)
          setRecoveredCacheData(null)
          setHasStoredDraft(false)
        }
      }
    } catch (e) {
      console.error("[Cache] Error auto-saving draft to local storage:", e)
    }
  }, [draftScores, isEditing, cacheKey, selectedSubjectId, selectedSubject?.name, selectedSubject?.code, classId, sessionId, termId, originalScoresMap])

  // Intentional Save as Draft Action
  const handleSaveAsDraft = () => {
    if (!selectedSubjectId) return

    try {
      const changedScores: Record<string, { current: ScoreDraft; original: { ca1: string; ca2: string; exam: string; remark: string } }> = {}

      Object.entries(draftScores).forEach(([stId, draft]) => {
        const orig = originalScoresMap[stId] || { ca1: "", ca2: "", exam: "", remark: "" }
        const ca1Changed = draft.ca1 !== orig.ca1
        const ca2Changed = draft.ca2 !== orig.ca2
        const examChanged = draft.exam !== orig.exam
        const remarkChanged = draft.isRemarkUserEditedManually && draft.remark !== orig.remark

        if (ca1Changed || ca2Changed || examChanged || remarkChanged) {
          changedScores[stId] = {
            current: draft,
            original: orig,
          }
        }
      })

      const existingRaw = localStorage.getItem(cacheKey)
      const payload = existingRaw ? JSON.parse(existingRaw) : { classId, sessionId, termId, subjects: {} }
      payload.timestamp = new Date().toISOString()
      payload.subjects = payload.subjects || {}

      if (Object.keys(changedScores).length > 0) {
        payload.subjects[selectedSubjectId] = {
          subjectName: selectedSubject?.name || "Subject",
          subjectCode: selectedSubject?.code || "",
          changedScores,
        }
        localStorage.setItem(cacheKey, JSON.stringify(payload))
        setRecoveredCacheData(payload)
        setHasStoredDraft(true)

        toast.success("Draft Saved Successfully!", {
          description: `Saved unsaved score changes for ${selectedSubject?.name || "subject"}. Click Save Scores when ready to publish.`,
        })
      } else {
        toast.info("No score modifications detected to save as draft.")
      }

      setIsEditing(false)
    } catch (e) {
      console.error("[Cache] Error saving draft intentionally:", e)
      toast.error("Failed to save draft.")
    }
  }

  // Edit Single Subject from Modal -> GUARANTEES Edit Mode
  const handleEditSingleSubjectFromDraft = (subjId: string, subjData: any) => {
    shouldMaintainEditModeRef.current = true
    setSelectedSubjectId(subjId)

    if (subjData && subjData.changedScores) {
      setDraftScores((prev) => {
        const merged = { ...prev }
        Object.entries(subjData.changedScores).forEach(([stId, change]: [string, any]) => {
          merged[stId] = { ...change.current }
        })
        return merged
      })
    }

    onSwitchToSubjectView?.()
    setIsEditing(true)
    setRestoreDialogOpen(false)
    toast.success(`Editing ${subjData.subjectName || "subject"} draft scores`)
  }

  // Save Single Subject directly from Modal
  const handleSaveSingleSubjectFromDraft = async (subjId: string, subjData: any) => {
    try {
      setIsSaving(true)
      const { data: typeList } = await supabase
        .from("assessment_types")
        .select("id, name")
        .in("name", ["CA Test 1", "CA Test 2", "Exam"])

      let ca1TypeId = typeList?.find((t: any) => t.name.includes("CA Test 1"))?.id
      let ca2TypeId = typeList?.find((t: any) => t.name.includes("CA Test 2"))?.id
      let examTypeId = typeList?.find((t: any) => t.name.includes("Exam"))?.id

      const today = new Date().toISOString().split("T")[0]

      const { data: existingAssessments } = await supabase
        .from("assessments")
        .select("id, assessment_type_id")
        .eq("class_id", classId)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("subject_id", subjId)

      let ca1AssessmentId = existingAssessments?.find((a: any) => a.assessment_type_id === ca1TypeId)?.id
      let ca2AssessmentId = existingAssessments?.find((a: any) => a.assessment_type_id === ca2TypeId)?.id
      let examAssessmentId = existingAssessments?.find((a: any) => a.assessment_type_id === examTypeId)?.id

      if (!ca1AssessmentId && ca1TypeId) {
        const { data: newAss } = await supabase.from("assessments").insert({ class_id: classId, session_id: sessionId, term_id: termId, subject_id: subjId, assessment_type_id: ca1TypeId, total_marks: 20, date: today }).select("id").single()
        ca1AssessmentId = newAss?.id
      }
      if (!ca2AssessmentId && ca2TypeId) {
        const { data: newAss } = await supabase.from("assessments").insert({ class_id: classId, session_id: sessionId, term_id: termId, subject_id: subjId, assessment_type_id: ca2TypeId, total_marks: 20, date: today }).select("id").single()
        ca2AssessmentId = newAss?.id
      }
      if (!examAssessmentId && examTypeId) {
        const { data: newAss } = await supabase.from("assessments").insert({ class_id: classId, session_id: sessionId, term_id: termId, subject_id: subjId, assessment_type_id: examTypeId, total_marks: 60, date: today }).select("id").single()
        examAssessmentId = newAss?.id
      }

      const scoreRowsToUpsert: any[] = []

      Object.entries(subjData.changedScores || {}).forEach(([stId, change]: [string, any]) => {
        const curr = change.current || {}
        const ca1Num = curr.ca1 !== "" ? Number(curr.ca1) : null
        const ca2Num = curr.ca2 !== "" ? Number(curr.ca2) : null
        const examNum = curr.exam !== "" ? Number(curr.exam) : null

        const total = (ca1Num || 0) + (ca2Num || 0) + (examNum || 0)
        const grade = calculateGrade(total)
        const remark = curr.remark || getAutoRemark(grade)

        if (ca1Num !== null && ca1AssessmentId) {
          scoreRowsToUpsert.push({ student_id: stId, assessment_id: ca1AssessmentId, score: ca1Num, grade, remarks: remark })
        }
        if (ca2Num !== null && ca2AssessmentId) {
          scoreRowsToUpsert.push({ student_id: stId, assessment_id: ca2AssessmentId, score: ca2Num, grade, remarks: remark })
        }
        if (examNum !== null && examAssessmentId) {
          scoreRowsToUpsert.push({ student_id: stId, assessment_id: examAssessmentId, score: examNum, grade, remarks: remark })
        }
      })

      if (scoreRowsToUpsert.length > 0) {
        const { error: batchErr } = await supabase.from("student_scores").upsert(scoreRowsToUpsert, { onConflict: "student_id,assessment_id" })
        if (batchErr) throw batchErr
      }

      // Remove subjId from local cache payload
      const existingRaw = localStorage.getItem(cacheKey)
      if (existingRaw) {
        const payload = JSON.parse(existingRaw)
        delete payload.subjects[subjId]
        if (Object.keys(payload.subjects).length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(payload))
          setRecoveredCacheData(payload)
        } else {
          localStorage.removeItem(cacheKey)
          setRecoveredCacheData(null)
          setHasStoredDraft(false)
          setRestoreDialogOpen(false)
        }
      }

      toast.success(`Saved scores for ${subjData.subjectName}!`)
      onSaveSuccess?.()
      if (subjId === selectedSubjectId) {
        await fetchScores()
      }
    } catch (e) {
      console.error("[Cache] Error saving single subject draft:", e)
      toast.error(`Failed to save scores for ${subjData.subjectName}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Save ALL subjects from draft modal in 1 batch
  const handleSaveAllDrafts = async () => {
    if (!recoveredCacheData?.subjects) return

    try {
      setIsSaving(true)
      const subjEntries = Object.entries(recoveredCacheData.subjects)
      for (const [subjId, subjData] of subjEntries) {
        await handleSaveSingleSubjectFromDraft(subjId, subjData)
      }
      localStorage.removeItem(cacheKey)
      setRecoveredCacheData(null)
      setHasStoredDraft(false)
      setRestoreDialogOpen(false)
      toast.success("Saved All Draft Scores Successfully!")
    } catch (e) {
      console.error("[Cache] Error saving all drafts:", e)
    } finally {
      setIsSaving(false)
    }
  }

  // Restore Draft Action -> GUARANTEES Edit Mode
  const handleRestoreDraft = () => {
    if (recoveredCacheData && recoveredCacheData.subjects) {
      const targetSubjId = selectedSubjectId in recoveredCacheData.subjects
        ? selectedSubjectId
        : Object.keys(recoveredCacheData.subjects)[0]

      const targetSubjData = recoveredCacheData.subjects[targetSubjId]

      shouldMaintainEditModeRef.current = true

      if (targetSubjId) {
        setSelectedSubjectId(targetSubjId)
      }

      if (targetSubjData && targetSubjData.changedScores) {
        setDraftScores((prev) => {
          const merged = { ...prev }
          Object.entries(targetSubjData.changedScores).forEach(([stId, change]: [string, any]) => {
            merged[stId] = { ...change.current }
          })
          return merged
        })
      }

      onSwitchToSubjectView?.()
      setIsEditing(true)

      toast.success("Restored Draft & Entered Edit Mode!", {
        description: `Loaded unsaved edits for ${targetSubjData?.subjectName || "subject"}. Click Save Scores to publish.`,
      })
    }
    setRestoreDialogOpen(false)
  }

  // Discard Draft Action
  const handleDiscardCacheDraft = () => {
    try {
      localStorage.removeItem(cacheKey)
    } catch (e) {}
    setRestoreDialogOpen(false)
    setRecoveredCacheData(null)
    setHasStoredDraft(false)
    toast.info("Discarded Unsaved Draft")
  }

  // Filter subjects for left list
  const filteredSubjects = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return subjects.filter((s) => s.name.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
  }, [subjects, searchQuery])

  // Count subjects in draft
  const draftSubjectsCount = useMemo(() => {
    if (!recoveredCacheData?.subjects) return 0
    return Object.keys(recoveredCacheData.subjects).length
  }, [recoveredCacheData])

  // Count total modified students in draft preview
  const draftModifiedCount = useMemo(() => {
    if (!recoveredCacheData?.subjects) return 0
    let count = 0
    Object.values(recoveredCacheData.subjects).forEach((subData: any) => {
      if (subData?.changedScores) {
        count += Object.keys(subData.changedScores).length
      }
    })
    return count
  }, [recoveredCacheData])

  // Deduplicate incoming students by ID to eliminate duplicate key errors
  const uniqueStudents = useMemo(() => {
    const map = new Map<string, Student>()
    students?.forEach((st) => {
      if (st && st.id && !map.has(st.id)) {
        map.set(st.id, st)
      }
    })
    return Array.from(map.values())
  }, [students])

  // Compute table rows & KPIs dynamically
  const { tableRows, kpis } = useMemo(() => {
    const totalEnrolled = uniqueStudents.length
    if (totalEnrolled === 0) {
      return {
        tableRows: [],
        kpis: { completedCount: 0, totalEnrolled: 0, completedPercent: 0, average: 0, highest: 0, topStudentName: "-", lowest: 0, passRate: 0 },
      }
    }

    const rows = uniqueStudents.map((st) => {
      const draft = draftScores[st.id] || { ca1: "", ca2: "", exam: "", remark: "" }

      const ca1Val = draft.ca1 !== "" ? Number(draft.ca1) : null
      const ca2Val = draft.ca2 !== "" ? Number(draft.ca2) : null
      const examVal = draft.exam !== "" ? Number(draft.exam) : null

      const hasAnyScore = ca1Val !== null || ca2Val !== null || examVal !== null
      const total = (ca1Val || 0) + (ca2Val || 0) + (examVal || 0)
      const grade = hasAnyScore ? calculateGrade(total) : ""
      const autoRemark = grade ? getAutoRemark(grade) : ""
      const displayRemark = draft.isRemarkUserEditedManually ? draft.remark : (autoRemark || draft.remark)

      return {
        student: st,
        ca1: ca1Val,
        ca2: ca2Val,
        exam: examVal,
        total,
        grade,
        hasAnyScore,
        remark: displayRemark,
      }
    })

    // Compute KPIs
    const scoredStudents = rows.filter((r) => r.hasAnyScore)
    const completedCount = scoredStudents.length
    const completedPercent = totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0

    let average = 0
    let highest = 0
    let topStudentName = "-"
    let lowest = 0
    let passRate = 0

    if (scoredStudents.length > 0) {
      const sumTotals = scoredStudents.reduce((acc, r) => acc + r.total, 0)
      average = Math.round((sumTotals / scoredStudents.length) * 10) / 10

      const sortedByTotal = [...scoredStudents].sort((a, b) => b.total - a.total)
      highest = sortedByTotal[0].total
      topStudentName = `${sortedByTotal[0].student.first_name} ${sortedByTotal[0].student.last_name}`

      lowest = sortedByTotal[sortedByTotal.length - 1].total

      const passedCount = scoredStudents.filter((r) => r.total >= 50).length
      passRate = Math.round((passedCount / scoredStudents.length) * 100)
    }

    return {
      tableRows: rows,
      kpis: {
        completedCount,
        totalEnrolled,
        completedPercent,
        average,
        highest,
        topStudentName,
        lowest,
        passRate,
      },
    }
  }, [students, draftScores])

  // Custom Unsaved Changes Dialog handler
  const handleSelectSubject = (id: string) => {
    if (id === selectedSubjectId) return
    if (isEditing) {
      setPendingSubjectId(id)
      setUnsavedDialogOpen(true)
      return
    }
    setSelectedSubjectId(id)
    onSubjectChange?.(id)
  }

  const handleConfirmDiscardSwitch = () => {
    if (pendingSubjectId) {
      setSelectedSubjectId(pendingSubjectId)
      onSubjectChange?.(pendingSubjectId)
    }
    setIsEditing(false)
    setUnsavedDialogOpen(false)
    setPendingSubjectId(null)
  }

  // Handle cell input change & auto-populate remarks live
  const handleScoreInputChange = (
    studentId: string,
    field: "ca1" | "ca2" | "exam" | "remark",
    value: string
  ) => {
    let sanitized = value

    if (field !== "remark") {
      sanitized = value.replace(/[^0-9.]/g, "")
      const num = Number(sanitized)
      const maxMap = { ca1: 20, ca2: 20, exam: 60 }
      if (sanitized !== "" && num > maxMap[field]) {
        toast.error(`Maximum allowed for ${field.toUpperCase()} is ${maxMap[field]}`)
        sanitized = String(maxMap[field])
      }
    }

    setDraftScores((prev) => {
      const current = prev[studentId] || { ca1: "", ca2: "", exam: "", remark: "" }
      const updated = { ...current, [field]: sanitized }

      if (field !== "remark") {
        const c1 = updated.ca1 !== "" ? Number(updated.ca1) : 0
        const c2 = updated.ca2 !== "" ? Number(updated.ca2) : 0
        const ex = updated.exam !== "" ? Number(updated.exam) : 0
        const hasScore = updated.ca1 !== "" || updated.ca2 !== "" || updated.exam !== ""
        
        if (hasScore) {
          const tot = c1 + c2 + ex
          const grd = calculateGrade(tot)
          const autoRem = getAutoRemark(grd)

          // Auto-update remark live according to grade metric unless user explicitly typed inside remark box
          if (!updated.isRemarkUserEditedManually) {
            updated.remark = autoRem
          }
        }
      } else {
        // User typed manually in the remark field
        updated.isRemarkUserEditedManually = true
      }

      return {
        ...prev,
        [studentId]: updated,
      }
    })
  }

  // Ultra-Fast Fail-Safe Server Action Batch Upsert
  const handleBatchSave = async () => {
    if (!selectedSubjectId || !classId || !sessionId || !termId) return

    try {
      setIsSaving(true)

      const payloadScores: any[] = []
      students.forEach((st) => {
        const draft = draftScores[st.id]
        if (!draft) return

        const ca1Num = draft.ca1 !== "" ? Number(draft.ca1) : null
        const ca2Num = draft.ca2 !== "" ? Number(draft.ca2) : null
        const examNum = draft.exam !== "" ? Number(draft.exam) : null

        if (ca1Num !== null || ca2Num !== null || examNum !== null) {
          payloadScores.push({
            studentId: st.id,
            ca1: ca1Num,
            ca2: ca2Num,
            exam: examNum,
            remark: draft.remark,
          })
        }
      })

      if (payloadScores.length === 0) {
        toast.info("No score entries detected to save.")
        setIsSaving(false)
        return
      }

      const res = await saveBatchSubjectScores({
        classId,
        sessionId,
        termId,
        subjectId: selectedSubjectId,
        scores: payloadScores,
      })

      if (!res.success) {
        throw new Error(res.error || "Failed to save scores")
      }

      // Always clear local unsaved draft cache completely on save
      try {
        localStorage.removeItem(cacheKey)
      } catch (e) {}

      setHasStoredDraft(false)
      setRecoveredCacheData(null)

      toast.success("Scores Saved & Published!", {
        description: `Successfully saved ${res.count} score entries for ${selectedSubject?.name || "subject"}.`,
      })
      setIsEditing(false)
      await fetchScores()
      onSaveSuccess?.()
    } catch (error: any) {
      console.error("[SubjectResultView] Error saving batch scores:", error)
      toast.error(error.message || "Failed to save scores. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Global Ctrl + S / Cmd + S Keyboard Shortcut for Saving Scores
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (isEditing && !isSaving) {
          handleBatchSave()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isEditing, isSaving, selectedSubjectId, classId, sessionId, termId, draftScores, students, handleBatchSave])

  return (
    <div className="flex flex-col gap-4">
      {/* Top KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Completed */}
        <Card className="py-0 shadow-none bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20 text-blue-950 dark:text-blue-100">
          <CardContent className="p-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80 block">Completed</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-sm font-bold">{kpis.completedCount}/{kpis.totalEnrolled}</p>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400">{kpis.completedPercent}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Class Average */}
        <Card className="py-0 shadow-none bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-950 dark:text-emerald-100">
          <CardContent className="p-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80 block">Class Average</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{kpis.average}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">of 100</span>
            </div>
          </CardContent>
        </Card>

        {/* Highest Score */}
        <Card className="py-0 shadow-none bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/20 text-purple-950 dark:text-purple-100">
          <CardContent className="p-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600/80 dark:text-purple-400/80 block">Highest Score</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-xl font-black text-purple-600 dark:text-purple-400">{kpis.highest}</p>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 truncate max-w-[90px]">{kpis.topStudentName}</span>
            </div>
          </CardContent>
        </Card>

        {/* Lowest Score */}
        <Card className="py-0 shadow-none bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 text-amber-950 dark:text-amber-100">
          <CardContent className="p-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80 block">Lowest Score</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">{kpis.lowest}</p>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-semibold">Attention</span>
            </div>
          </CardContent>
        </Card>

        {/* Pass Rate */}
        <Card className="py-0 shadow-none bg-sky-500/5 dark:bg-sky-950/20 border-sky-500/20 text-sky-950 dark:text-sky-100">
          <CardContent className="p-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600/80 dark:text-sky-400/80 block">Pass Rate</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-xl font-black text-sky-600 dark:text-sky-400">{kpis.passRate}%</p>
              <Badge variant="outline" className="text-[9px] h-4 py-0 font-bold bg-sky-500/10 text-sky-600 border-sky-200">
                {kpis.passRate >= 80 ? "Excellent" : kpis.passRate >= 60 ? "Good" : "Fair"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout (Subject Sidebar + Excel Score Sheet Table) */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Subjects List Sidebar */}
        <Card className="w-full md:w-[260px] shrink-0 py-0 shadow-none border">
          <CardContent className="p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Class Subjects</span>
              <Badge variant="secondary" className="text-[10px] font-bold">{subjects.length}</Badge>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search subject..."
                className="pl-8 h-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-0.5 scrollbar-thin">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subj) => {
                  const isSelected = subj.id === selectedSubjectId
                  const hasDraft = Boolean(recoveredCacheData?.subjects?.[subj.id]?.changedScores && Object.keys(recoveredCacheData.subjects[subj.id].changedScores).length > 0)

                  return (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => handleSelectSubject(subj.id)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between border gap-1.5",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                          : "bg-background hover:bg-muted/60 text-foreground border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{subj.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {hasDraft && (
                          <span
                            title="Unsaved draft scores available"
                            className={cn(
                              "flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 transition-all shadow-2xs",
                              isSelected
                                ? "bg-amber-500 text-white border-amber-400 font-extrabold dark:bg-amber-500 dark:text-black dark:border-amber-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            )}
                          >
                            <History className="h-2.5 w-2.5 shrink-0 animate-pulse" />
                            <span>Draft</span>
                          </span>
                        )}

                        {subj.code && (
                          <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded", isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            {subj.code}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No subjects found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Compact Excel Score Sheet Table */}
        <Card className="flex-1 py-0 shadow-none border min-w-0">
          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-bold">
                {selectedSubject?.name || "Subject"} — Score Sheet
              </CardTitle>
              {selectedSubject?.code && (
                <Badge variant="outline" className="text-[9px] font-mono py-0 h-4">
                  {selectedSubject.code}
                </Badge>
              )}
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Unsaved Draft Button (if draft exists in local cache) */}
              {hasStoredDraft && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRestoreDialogOpen(true)}
                  className="h-7 text-xs font-bold gap-1.5 px-3 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                >
                  <History className="h-3.5 w-3.5 text-amber-500" />
                  <span>Unsaved Draft</span>
                  <Badge variant="secondary" className="h-4 px-1 text-[9px] font-mono font-black bg-amber-500 text-white border-none ml-0.5">
                    {draftModifiedCount || "!"}
                  </Badge>
                </Button>
              )}

              {isEditable && (
                <div className="flex items-center gap-1.5">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="h-7 text-xs px-2 gap-1 text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveAsDraft}
                        disabled={isSaving}
                        className="h-7 text-xs font-bold gap-1 px-2.5 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                        Save as Draft
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleBatchSave}
                        disabled={isSaving}
                        className="h-7 text-xs font-bold gap-1.5 px-3 bg-primary text-primary-foreground"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            Save Scores
                          </>
                        )}
                      </Button>
                    </>
                  ) : hasComponents ? (
                    <div className="text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 font-semibold flex items-center gap-1.5 shadow-2xs">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                      Derived from Sub-components
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-7 text-xs font-bold gap-1.5 px-3"
                    >
                      <Pencil className="h-3.5 w-3.5 text-primary" />
                      Edit Scores
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader className="bg-muted/40 border-b">
                <TableRow className="h-8">
                  <TableHead className="w-10 text-center text-[11px] font-bold border-r px-1">SN</TableHead>
                  <TableHead className="text-[11px] font-bold border-r min-w-[150px] px-2">Student Name</TableHead>
                  
                  {/* Score Column Headers - Subtle background ONLY in Edit Mode */}
                  <TableHead className={cn("w-20 text-[11px] font-bold text-center border-r px-0 transition-colors", isEditing && "bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400")}>
                    CA 1 (20)
                  </TableHead>
                  <TableHead className={cn("w-20 text-[11px] font-bold text-center border-r px-0 transition-colors", isEditing && "bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400")}>
                    CA 2 (20)
                  </TableHead>
                  <TableHead className={cn("w-20 text-[11px] font-bold text-center border-r px-0 transition-colors", isEditing && "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400")}>
                    EXAM (60)
                  </TableHead>
                  
                  {/* Total Column - Same color as default background */}
                  <TableHead className="w-16 text-[11px] font-bold text-center border-r bg-background px-1">TOTAL</TableHead>
                  <TableHead className="w-16 text-[11px] font-bold text-center border-r px-1">GRADE</TableHead>
                  <TableHead className="text-[11px] font-bold min-w-[130px] px-2">REMARKS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Loading subject score sheet...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tableRows.length > 0 ? (
                  tableRows.map((row, idx) => {
                    const draft = draftScores[row.student.id] || { ca1: "", ca2: "", exam: "", remark: "" }

                    return (
                      <TableRow key={row.student.id} className="h-8 hover:bg-accent/30 text-xs transition-colors border-b">
                        <TableCell className="text-center font-mono text-[11px] text-muted-foreground border-r px-1">{idx + 1}</TableCell>
                        <TableCell className="font-semibold border-r px-2 py-0">
                          <div className="flex items-center gap-2 py-0.5">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={row.student.photo_url || ""} />
                              <AvatarFallback className="text-[8px] font-bold">
                                {row.student.first_name[0]}
                                {row.student.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                              <p className="font-bold text-[11px] text-foreground leading-tight truncate">{row.student.first_name} {row.student.last_name}</p>
                              <p className="text-[9px] text-muted-foreground font-mono leading-none">{row.student.student_id}</p>
                            </div>
                            {hasComponents && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenComponentModal(row.student)}
                                className="h-5 w-5 ml-auto text-muted-foreground hover:text-emerald-600 transition-colors"
                                title="Edit Sub-component Scores"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>

                        {/* Excel-Style CA 1 Cell */}
                        <TableCell
                          onDoubleClick={() => handleCellDoubleClick(row.student.id, "ca1")}
                          className={cn(
                            "p-0 border-r text-center align-middle transition-colors cursor-pointer",
                            isEditing ? "bg-blue-500/5 dark:bg-blue-950/20" : "bg-transparent hover:bg-accent/40"
                          )}
                        >
                          {isEditing ? (
                            <input
                              id={`score_input_${row.student.id}_ca1`}
                              type="text"
                              inputMode="numeric"
                              value={draft.ca1}
                              onChange={(e) => handleScoreInputChange(row.student.id, "ca1", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="—"
                              className="w-full h-8 px-1 text-center font-mono font-medium text-xs bg-transparent border-0 focus:bg-blue-500/15 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-inset transition-colors"
                            />
                          ) : (
                            <span className="font-mono font-medium text-xs select-none">{row.ca1 !== null ? row.ca1 : "—"}</span>
                          )}
                        </TableCell>

                        {/* Excel-Style CA 2 Cell */}
                        <TableCell
                          onDoubleClick={() => handleCellDoubleClick(row.student.id, "ca2")}
                          className={cn(
                            "p-0 border-r text-center align-middle transition-colors cursor-pointer",
                            isEditing ? "bg-blue-500/5 dark:bg-blue-950/20" : "bg-transparent hover:bg-accent/40"
                          )}
                        >
                          {isEditing ? (
                            <input
                              id={`score_input_${row.student.id}_ca2`}
                              type="text"
                              inputMode="numeric"
                              value={draft.ca2}
                              onChange={(e) => handleScoreInputChange(row.student.id, "ca2", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="—"
                              className="w-full h-8 px-1 text-center font-mono font-medium text-xs bg-transparent border-0 focus:bg-blue-500/15 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-inset transition-colors"
                            />
                          ) : (
                            <span className="font-mono font-medium text-xs select-none">{row.ca2 !== null ? row.ca2 : "—"}</span>
                          )}
                        </TableCell>

                        {/* Excel-Style Exam Cell */}
                        <TableCell
                          onDoubleClick={() => handleCellDoubleClick(row.student.id, "exam")}
                          className={cn(
                            "p-0 border-r text-center align-middle transition-colors cursor-pointer",
                            isEditing ? "bg-emerald-500/5 dark:bg-emerald-950/20" : "bg-transparent hover:bg-accent/40"
                          )}
                        >
                          {isEditing ? (
                            <input
                              id={`score_input_${row.student.id}_exam`}
                              type="text"
                              inputMode="numeric"
                              value={draft.exam}
                              onChange={(e) => handleScoreInputChange(row.student.id, "exam", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="—"
                              className="w-full h-8 px-1 text-center font-mono font-medium text-xs bg-transparent border-0 focus:bg-emerald-500/15 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-inset transition-colors"
                            />
                          ) : (
                            <span className="font-mono font-medium text-xs select-none">{row.exam !== null ? row.exam : "—"}</span>
                          )}
                        </TableCell>

                        {/* Non-Editable Total Cell — Same color as background */}
                        <TableCell className="text-center font-mono font-bold text-foreground bg-background border-r px-1 text-xs select-none">
                          {row.hasAnyScore ? row.total : "—"}
                        </TableCell>

                        {/* Grade Cell (Live Calculated) */}
                        <TableCell className="text-center border-r px-1 select-none">
                          {row.grade ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-bold text-[9px] px-1 py-0 border h-4",
                                row.grade.startsWith("A")
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400"
                                  : row.grade.startsWith("B")
                                  ? "bg-blue-500/10 text-blue-600 border-blue-300 dark:text-blue-400"
                                  : row.grade === "C"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-300 dark:text-amber-400"
                                  : "bg-red-500/10 text-red-600 border-red-300 dark:text-red-400"
                              )}
                            >
                              {row.grade}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        {/* Auto-Populated Remarks Cell (Auto-updates live based on grade) */}
                        <TableCell
                          onDoubleClick={() => handleCellDoubleClick(row.student.id, "remark")}
                          className="p-0 align-middle cursor-pointer hover:bg-accent/40 transition-colors"
                        >
                          {isEditing ? (
                            <input
                              id={`score_input_${row.student.id}_remark`}
                              type="text"
                              value={draft.remark}
                              onChange={(e) => handleScoreInputChange(row.student.id, "remark", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="Remark..."
                              className="w-full h-8 px-2 text-[11px] bg-transparent border-0 focus:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-inset transition-colors"
                            />
                          ) : (
                            <span className="px-2 text-muted-foreground text-[11px] select-none">{row.remark || "—"}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      No students enrolled in this class.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Custom Unsaved Changes Switch Subject Dialog */}
      <AlertDialog open={unsavedDialogOpen} onOpenChange={setUnsavedDialogOpen}>
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="text-base font-bold">Unsaved Score Changes</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              You have unsaved changes on the current score sheet. Switching subjects without saving will discard your edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row items-center justify-end gap-2.5 mt-4">
            <AlertDialogCancel className="h-9 px-4 text-xs font-semibold rounded-lg">
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscardSwitch}
              className="h-9 px-4 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white border-0 shadow-xs"
            >
              Discard & Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recovered Unsaved Draft Tabular Preview Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col p-5 overflow-hidden">
          <AlertDialogHeader className="shrink-0">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <History className="h-5 w-5 shrink-0" />
                <AlertDialogTitle className="text-base font-bold">Unsaved Draft Recovered</AlertDialogTitle>
              </div>
              {recoveredCacheData?.timestamp && (
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {new Date(recoveredCacheData.timestamp).toLocaleTimeString()} ({new Date(recoveredCacheData.timestamp).toLocaleDateString()})
                </span>
              )}
            </div>
            
            <AlertDialogDescription className="text-xs text-muted-foreground pt-2" asChild>
              <div className="text-xs text-muted-foreground space-y-3">
                <p>We detected unsaved score modifications from your previous session. Preview your changed scores below before restoring or saving:</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Single Clean Sleek Scrollable List of Preview Tables */}
          <div className="flex-1 overflow-y-auto pr-1 my-3 space-y-3 scrollbar-thin">
            {recoveredCacheData?.subjects && Object.keys(recoveredCacheData.subjects).length > 0 ? (
              Object.entries(recoveredCacheData.subjects).map(([subjId, subjData]: [string, any]) => {
                const changedRows = Object.entries(subjData.changedScores || {}).map(([stId, change]: [string, any]) => {
                  const stObj = students.find((s) => s.id === stId)
                  const curr = change.current || {}
                  const orig = change.original || {}

                  const c1 = curr.ca1 !== "" ? Number(curr.ca1) : 0
                  const c2 = curr.ca2 !== "" ? Number(curr.ca2) : 0
                  const ex = curr.exam !== "" ? Number(curr.exam) : 0
                  const total = c1 + c2 + ex

                  return {
                    stId,
                    name: stObj ? `${stObj.first_name} ${stObj.last_name}` : stId,
                    studentId: stObj?.student_id || "",
                    ca1: curr.ca1,
                    origCa1: orig.ca1,
                    ca1Changed: curr.ca1 !== orig.ca1,

                    ca2: curr.ca2,
                    origCa2: orig.ca2,
                    ca2Changed: curr.ca2 !== orig.ca2,

                    exam: curr.exam,
                    origExam: orig.exam,
                    examChanged: curr.exam !== orig.exam,

                    total,
                  }
                })

                if (changedRows.length === 0) return null

                return (
                  <div key={subjId} className="border rounded-lg overflow-hidden bg-card text-card-foreground shadow-2xs">
                    {/* Subject Table Card Header with Dedicated Per-Subject Action Buttons */}
                    <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 border-b gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-bold text-xs text-foreground truncate">{subjData.subjectName}</span>
                        {subjData.subjectCode && (
                          <Badge variant="outline" className="text-[9px] font-mono py-0 h-4 shrink-0">
                            {subjData.subjectCode}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="secondary" className="text-[9px] font-bold bg-amber-500/10 text-amber-600 border-amber-300 dark:text-amber-400">
                          {changedRows.length} student{changedRows.length > 1 ? "s" : ""}
                        </Badge>

                        {/* Dedicated Per-Subject Action Buttons */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSingleSubjectFromDraft(subjId, subjData)}
                          className="h-6 text-[10px] font-bold px-2 gap-1 text-primary border-primary/30"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveSingleSubjectFromDraft(subjId, subjData)}
                          disabled={isSaving}
                          className="h-6 text-[10px] font-bold px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Save
                        </Button>
                      </div>
                    </div>

                    <Table className="border-collapse">
                      <TableHeader className="bg-muted/30 border-b">
                        <TableRow className="h-7">
                          <TableHead className="text-[10px] font-bold py-1 px-2">Student Name</TableHead>
                          <TableHead className="text-[10px] font-bold text-center w-24 py-1 px-1">CA 1</TableHead>
                          <TableHead className="text-[10px] font-bold text-center w-24 py-1 px-1">CA 2</TableHead>
                          <TableHead className="text-[10px] font-bold text-center w-24 py-1 px-1">EXAM</TableHead>
                          <TableHead className="text-[10px] font-bold text-center w-14 py-1 px-1 bg-muted/40">TOTAL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {changedRows.map((row) => (
                          <TableRow key={row.stId} className="h-7 text-xs border-b">
                            <TableCell className="py-1 px-2 font-medium">
                              <span>{row.name}</span>
                              {row.studentId && <span className="text-[9px] text-muted-foreground font-mono ml-1.5">({row.studentId})</span>}
                            </TableCell>

                            {/* CA 1 Cell with Side-by-Side Change Indicator */}
                            <TableCell className="py-1 px-1 text-center font-mono text-[11px]">
                              {row.ca1Changed ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-[10px] text-muted-foreground/60 line-through font-normal">{row.origCa1 || "—"}</span>
                                  <span className="font-bold text-amber-600 dark:text-amber-400">{row.ca1 || "—"}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{row.ca1 || "—"}</span>
                              )}
                            </TableCell>

                            {/* CA 2 Cell with Side-by-Side Change Indicator */}
                            <TableCell className="py-1 px-1 text-center font-mono text-[11px]">
                              {row.ca2Changed ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-[10px] text-muted-foreground/60 line-through font-normal">{row.origCa2 || "—"}</span>
                                  <span className="font-bold text-amber-600 dark:text-amber-400">{row.ca2 || "—"}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{row.ca2 || "—"}</span>
                              )}
                            </TableCell>

                            {/* Exam Cell with Side-by-Side Change Indicator */}
                            <TableCell className="py-1 px-1 text-center font-mono text-[11px]">
                              {row.examChanged ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-[10px] text-muted-foreground/60 line-through font-normal">{row.origExam || "—"}</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{row.exam || "—"}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{row.exam || "—"}</span>
                              )}
                            </TableCell>

                            <TableCell className="py-1 px-1 text-center font-mono font-black bg-muted/20">{row.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              })
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">No draft modifications found.</div>
            )}
          </div>

          <AlertDialogFooter className="flex flex-row items-center justify-between gap-2.5 pt-3 border-t shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setRestoreDialogOpen(false)} className="h-8 text-xs text-muted-foreground">
              Close
            </Button>

            <div className="flex items-center gap-2">
              <AlertDialogCancel onClick={handleDiscardCacheDraft} className="h-8 px-3 text-xs font-semibold text-destructive hover:text-destructive border-destructive/30">
                Discard Draft
              </AlertDialogCancel>

              {/* Conditional Main Action Button: Restore & Edit (Single Subj) vs Save All (Multiple Subjs) */}
              {draftSubjectsCount > 1 ? (
                <AlertDialogAction
                  onClick={handleSaveAllDrafts}
                  disabled={isSaving}
                  className="h-8 px-4 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-1.5"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save All ({draftSubjectsCount})
                </AlertDialogAction>
              ) : (
                <AlertDialogAction
                  onClick={handleRestoreDraft}
                  className="h-8 px-4 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restore & Edit
                </AlertDialogAction>
              )}
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Component Scores Editing Dialog */}
      <Dialog open={editingStudentForComponents !== null} onOpenChange={(open) => !open && setEditingStudentForComponents(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-4 border-b shrink-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <span>Edit Sub-component Scores</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure component scores for <strong>{editingStudentForComponents?.first_name} {editingStudentForComponents?.last_name}</strong> ({editingStudentForComponents?.student_id}).
            </DialogDescription>
          </DialogHeader>

          {loadingComponentScores ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-xs text-muted-foreground">Fetching sub-component scores...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-4 scrollbar-thin">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold text-xs text-foreground px-4">Component</TableHead>
                      <TableHead className="w-24 text-center font-semibold text-xs text-foreground px-2">CA 1</TableHead>
                      <TableHead className="w-24 text-center font-semibold text-xs text-foreground px-2">CA 2</TableHead>
                      <TableHead className="w-24 text-center font-semibold text-xs text-foreground px-2">Exam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classComponentsList.map((comp) => {
                      const score = componentScores[comp.component_id] || { ca1: "", ca2: "", exam: "", remark: "" }
                      const caCount = comp.ca_count ?? 2
                      const ca1Max = caCount === 1 ? comp.max_ca : (comp.max_ca / 2)
                      const ca2Max = caCount === 1 ? 0 : (comp.max_ca / 2)
                      const examMax = comp.max_exam

                      return (
                        <TableRow key={comp.component_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                          <TableCell className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 px-4">
                            <div>{comp.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">Max CA: {comp.max_ca} ({caCount} CA{caCount > 1 ? 's' : ''}) • Max Exam: {comp.max_exam}</div>
                          </TableCell>
                          
                          <TableCell className="p-2 text-center align-middle">
                            <div className="space-y-1">
                              <Input
                                type="text"
                                value={score.ca1}
                                onChange={(e) => handleComponentScoreChange(comp.component_id, "ca1", e.target.value)}
                                className="h-8 w-20 text-center font-mono text-xs mx-auto"
                                placeholder={`max ${ca1Max}`}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="p-2 text-center align-middle">
                            <div className="space-y-1">
                              {caCount === 2 ? (
                                <Input
                                  type="text"
                                  value={score.ca2}
                                  onChange={(e) => handleComponentScoreChange(comp.component_id, "ca2", e.target.value)}
                                  className="h-8 w-20 text-center font-mono text-xs mx-auto"
                                  placeholder={`max ${ca2Max}`}
                                />
                              ) : (
                                <span className="text-[10px] text-zinc-400 font-bold">—</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="p-2 text-center align-middle">
                            <div className="space-y-1">
                              <Input
                                type="text"
                                value={score.exam}
                                onChange={(e) => handleComponentScoreChange(comp.component_id, "exam", e.target.value)}
                                className="h-8 w-20 text-center font-mono text-xs mx-auto"
                                placeholder={`max ${examMax}`}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t flex flex-row items-center justify-between gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingStudentForComponents(null)}
              className="h-8 text-xs"
              disabled={savingComponentScores}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveComponentScores}
              disabled={savingComponentScores || loadingComponentScores}
              className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
            >
              {savingComponentScores ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Scores...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Scores
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
