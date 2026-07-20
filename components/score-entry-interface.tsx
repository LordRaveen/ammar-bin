"use client"

import { useState, useEffect, useRef } from "react"
import { IconSearch, IconCheck, IconAlertCircle, IconCircle, IconChevronRight, IconChartBar, IconTrendingUp, IconTrendingDown, IconTable, IconLayoutList, IconUser } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { saveStudentScore } from "@/app/(dashboard)/classes/[id]/actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ScoreEntryInterfaceProps {
  classId: string
  sessionId: string
  termId: string
  students: Array<{
    id: string
    student_id: string
    first_name: string
    middle_name: string | null
    last_name: string
    photo_url: string | null
  }>
  subjects: Array<{
    id: string
    name: string
    code: string
    max_score: number
    pass_mark: number
  }>
}

interface StudentScore {
  student_id: string
  ca1: string
  ca2: string
  exam: string
  total: number
  grade: string
  remark: string
}

interface ClassStatistics {
  totalStudents: number
  completedScores: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
}

type ViewMode = "subject" | "table" | "student"

export function ScoreEntryInterface({
  classId,
  sessionId,
  termId,
  students,
  subjects,
}: ScoreEntryInterfaceProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [scores, setScores] = useState<Map<string, StudentScore>>(new Map())
  const [loading, setLoading] = useState(false)
  const [assessmentTypes, setAssessmentTypes] = useState<any[]>([])
  const [statistics, setStatistics] = useState<ClassStatistics | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("subject")
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    const savedView = localStorage.getItem(`scoreView-${classId}`)
    const savedSubject = localStorage.getItem(`lastSubject-${classId}`)
    
    if (savedView && ['subject', 'table', 'student'].includes(savedView)) {
      setViewMode(savedView as ViewMode)
    }
    
    if (savedSubject && subjects.find(s => s.id === savedSubject)) {
      setSelectedSubject(savedSubject)
    } else if (subjects.length > 0) {
      // Auto-select first subject if no saved subject
      setSelectedSubject(subjects[0].id)
    }
  }, [classId, subjects])

  useEffect(() => {
    if (viewMode) {
      localStorage.setItem(`scoreView-${classId}`, viewMode)
    }
  }, [viewMode, classId])

  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem(`lastSubject-${classId}`, selectedSubject)
    }
  }, [selectedSubject, classId])

  useEffect(() => {
    if (viewMode === 'subject' && students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0].id)
    }
  }, [viewMode, students, selectedStudent])

  // Fetch assessment types (CA1, CA2, Exam, etc.)
  useEffect(() => {
    async function fetchAssessmentTypes() {
      const { data } = await supabase
        .from("assessment_types")
        .select("*")
        .eq("is_active", true)
        .order("name")

      console.log("[v0] Fetched assessment types:", data)

      if (data) {
        setAssessmentTypes(data)
      }
    }

    fetchAssessmentTypes()
  }, [])

  // Fetch existing scores when subject changes
  useEffect(() => {
    if (selectedSubject && sessionId && termId && assessmentTypes.length > 0) {
      fetchScoresForSubject()
    }
  }, [selectedSubject, sessionId, termId, assessmentTypes])

  useEffect(() => {
    if (selectedSubject && scores.size > 0) {
      calculateStatistics()
    }
  }, [scores, selectedSubject])

  useEffect(() => {
    if (!selectedSubject || !sessionId || !termId) return

    console.log("[v0] Setting up realtime subscription for scores")

    // Subscribe to student_scores changes
    const scoresChannel = supabase
      .channel(`scores-${classId}-${selectedSubject}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_scores',
        },
        (payload) => {
          console.log("[v0] Score change detected:", payload)
          if (!isSaving) {
            setTimeout(() => {
              fetchScoresForSubject()
            }, 300)
          }
        }
      )
      .subscribe()

    // Subscribe to assessments changes
    const assessmentsChannel = supabase
      .channel(`assessments-${classId}-${selectedSubject}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assessments',
        },
        (payload) => {
          console.log("[v0] Assessment change detected:", payload)
          if (!isSaving) {
            setTimeout(() => {
              fetchScoresForSubject()
            }, 300)
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount or when subject changes
    return () => {
      console.log("[v0] Cleaning up score realtime subscriptions")
      supabase.removeChannel(scoresChannel)
      supabase.removeChannel(assessmentsChannel)
    }
  }, [selectedSubject, sessionId, termId, classId, isSaving])

  async function fetchScoresForSubject() {
    if (!selectedSubject || assessmentTypes.length === 0) {
      console.log("[v0] Cannot fetch scores: missing subject or assessment types")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Fetching scores for subject:", selectedSubject)
      
      // Fetch assessments for this subject, class, session, term
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id, assessment_type_id, total_marks")
        .eq("class_id", classId)
        .eq("subject_id", selectedSubject)
        .eq("session_id", sessionId)
        .eq("term_id", termId)

      console.log("[v0] Fetched assessments:", assessments)

      if (!assessments || assessments.length === 0) {
        console.log("[v0] No assessments found for this subject")
        setScores(new Map())
        setStatistics(null)
        return
      }

      // Fetch all scores for these assessments
      const assessmentIds = assessments.map(a => a.id)
      const { data: studentScores } = await supabase
        .from("student_scores")
        .select("*")
        .in("assessment_id", assessmentIds)

      console.log("[v0] Fetched student scores:", studentScores)

      const ca1Assessment = assessments.find(a => {
        const type = assessmentTypes.find(t => t.id === a.assessment_type_id)
        return type?.name === "CA Test 1"
      })
      
      const ca2Assessment = assessments.find(a => {
        const type = assessmentTypes.find(t => t.id === a.assessment_type_id)
        return type?.name === "CA Test 2"
      })
      
      const examAssessment = assessments.find(a => {
        const type = assessmentTypes.find(t => t.id === a.assessment_type_id)
        return type?.name === "Exam"
      })

      console.log("[v0] Matched assessments:", { ca1Assessment, ca2Assessment, examAssessment })

      // Organize scores by student
      const scoresMap = new Map<string, StudentScore>()
      
      students.forEach(student => {
        const studentScoreRecords = (studentScores || []).filter(s => s.student_id === student.id)
        
        const ca1Score = studentScoreRecords.find(s => s.assessment_id === ca1Assessment?.id)
        const ca2Score = studentScoreRecords.find(s => s.assessment_id === ca2Assessment?.id)
        const examScore = studentScoreRecords.find(s => s.assessment_id === examAssessment?.id)

        const ca1Val = ca1Score?.score ?? null
        const ca2Val = ca2Score?.score ?? null
        const examVal = examScore?.score ?? null
        
        const total = (ca1Val ?? 0) + (ca2Val ?? 0) + (examVal ?? 0)

        scoresMap.set(student.id, {
          student_id: student.id,
          ca1: ca1Val !== null ? ca1Val.toString() : "",
          ca2: ca2Val !== null ? ca2Val.toString() : "",
          exam: examVal !== null ? examVal.toString() : "",
          total,
          grade: ca1Score?.grade || examScore?.grade || "",
          remark: ca1Score?.remarks || examScore?.remarks || "",
        })
      })

      console.log("[v0] Organized scores map:", Array.from(scoresMap.entries()))
      setScores(scoresMap)
    } catch (error) {
      console.error("[v0] Error fetching scores:", error)
    } finally {
      setLoading(false)
    }
  }

  function calculateStatistics() {
    const currentSubject = subjects.find(s => s.id === selectedSubject)
    if (!currentSubject) return

    const scoresArray = Array.from(scores.values())
    const completedScores = scoresArray.filter(s => s.ca1 && s.ca2 && s.exam)
    const totals = completedScores.map(s => s.total).filter(t => t > 0)

    if (totals.length === 0) {
      setStatistics({
        totalStudents: students.length,
        completedScores: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0
      })
      return
    }

    const averageScore = totals.reduce((sum, score) => sum + score, 0) / totals.length
    const highestScore = Math.max(...totals)
    const lowestScore = Math.min(...totals)
    const passedCount = totals.filter(score => score >= currentSubject.pass_mark).length
    const passRate = (passedCount / totals.length) * 100

    setStatistics({
      totalStudents: students.length,
      completedScores: completedScores.length,
      averageScore,
      highestScore,
      lowestScore,
      passRate
    })
  }

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.toLowerCase()
    const id = student.student_id.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || id.includes(query)
  })

  const currentSubject = subjects.find(s => s.id === selectedSubject)

  function getStudentProgress(studentId: string) {
    const score = scores.get(studentId)
    if (!score) return "empty"
    
    const hasCA1 = score.ca1 !== ""
    const hasCA2 = score.ca2 !== ""
    const hasExam = score.exam !== ""
    
    if (hasCA1 && hasCA2 && hasExam) return "complete"
    if (hasCA1 || hasCA2 || hasExam) return "partial"
    return "empty"
  }

  function getProgressIcon(progress: string) {
    switch (progress) {
      case "complete":
        return <IconCheck className="h-4 w-4 text-green-500" />
      case "partial":
        return <IconAlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <IconCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  function getSubjectCompletionStatus(subjectId: string) {
    const subjectScores = Array.from(scores.entries())
      .filter(([_, score]) => score.student_id)
      .map(([_, score]) => score)
    
    if (subjectScores.length === 0) return { completed: 0, total: students.length }
    
    const completed = subjectScores.filter(score => 
      score.ca1 !== "" && score.ca2 !== "" && score.exam !== ""
    ).length
    
    return { completed, total: students.length }
  }

  return (
    <div className="space-y-4">
      {/* View Selector and Subject Chips */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Subject Chips */}
        <div className="flex-1">
          <Label className="mb-2 block text-sm font-medium">Subjects</Label>
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => {
              const status = selectedSubject === subject.id ? getSubjectCompletionStatus(subject.id) : { completed: 0, total: students.length }
              const isSelected = selectedSubject === subject.id
              const completionRate = status.total > 0 ? (status.completed / status.total) * 100 : 0
              
              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={cn(
                    "group relative rounded-full border px-4 py-2 text-sm font-medium transition-all hover:shadow-md",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent"
                  )}
                >
                  <span>{subject.code}</span>
                  {isSelected && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 h-5 px-1.5 text-xs"
                    >
                      {status.completed}/{status.total}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* View Selector with Tooltips */}
        <div>
          <Label className="mb-2 block text-sm font-medium">Select View</Label>
          <TooltipProvider>
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="subject" aria-label="Subject-by-Subject View">
                    <IconLayoutList className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Subject-by-Subject View</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="table" aria-label="Table View">
                    <IconTable className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Table View</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="student" aria-label="Student-by-Student View" disabled>
                    <IconUser className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Student-by-Student View (Coming Soon)</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </TooltipProvider>
        </div>
      </div>

      {/* Statistics Cards - Slimmer horizontal layout */}
      {selectedSubject && statistics && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-sm font-bold">{statistics.completedScores}/{statistics.totalStudents}</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {((statistics.completedScores / statistics.totalStudents) * 100).toFixed(0)}%
            </Badge>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Class Average</p>
              <p className="text-sm font-bold">{statistics.averageScore.toFixed(1)}</p>
            </div>
            <span className="text-xs text-muted-foreground">of {currentSubject?.max_score || 100}</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Highest</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">{statistics.highestScore.toFixed(1)}</p>
            </div>
            <span className="text-xs text-muted-foreground">Top</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Lowest</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{statistics.lowestScore.toFixed(1)}</p>
            </div>
            <span className="text-xs text-muted-foreground">Attention</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Pass Rate</p>
              <p className="text-sm font-bold">{statistics.passRate.toFixed(0)}%</p>
            </div>
            <Badge variant={statistics.passRate >= 80 ? "default" : "secondary"} className="text-xs">
              {statistics.passRate >= 80 ? "Excellent" : "Good"}
            </Badge>
          </div>
        </div>
      )}

      {/* Render different views based on viewMode */}
      {selectedSubject && viewMode === "subject" && (
        <SubjectBySubjectView
          students={filteredStudents}
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          scores={scores}
          getStudentProgress={getStudentProgress}
          getProgressIcon={getProgressIcon}
          currentSubject={currentSubject}
          classId={classId}
          sessionId={sessionId}
          termId={termId}
          onScoreSave={(studentId, updatedScore) => {
            setScores(new Map(scores.set(studentId, updatedScore)))
          }}
          setIsSaving={setIsSaving}
        />
      )}

      {selectedSubject && viewMode === "table" && (
        <TableView
          students={students}
          scores={scores}
          currentSubject={currentSubject}
          classId={classId}
          sessionId={sessionId}
          termId={termId}
          onScoreSave={(studentId, updatedScore) => {
            setScores(new Map(scores.set(studentId, updatedScore)))
          }}
          setIsSaving={setIsSaving}
        />
      )}

      {selectedSubject && viewMode === "student" && (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          <IconUser className="mx-auto mb-4 h-12 w-12" />
          <p>Student-by-Student view coming soon...</p>
        </div>
      )}

      {!selectedSubject && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <IconChevronRight className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">Select a Subject</CardTitle>
            <CardDescription>Choose a subject from the chips above to start entering scores</CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SubjectBySubjectView({
  students,
  selectedStudent,
  setSelectedStudent,
  searchQuery,
  setSearchQuery,
  scores,
  getStudentProgress,
  getProgressIcon,
  currentSubject,
  classId,
  sessionId,
  termId,
  onScoreSave,
  setIsSaving, // Added prop
}: any) {
  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* Student List - Left Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>{students.length} student(s)</CardDescription>
          <div className="relative">
            <IconSearch className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {students.map((student: any) => {
            const progress = getStudentProgress(student.id)
            const isSelected = selectedStudent === student.id
            
            return (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <Avatar className="h-8 w-8">
                  {student.photo_url && <AvatarImage src={student.photo_url || "/placeholder.svg"} />}
                  <AvatarFallback>
                    {student.first_name[0]}{student.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {student.student_id}
                  </p>
                </div>
                {getProgressIcon(progress)}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Score Entry Form - Right Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Score Entry</CardTitle>
              <CardDescription>
                {currentSubject?.name} ({currentSubject?.code})
              </CardDescription>
            </div>
            {selectedStudent && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentIndex = students.findIndex((s: any) => s.id === selectedStudent)
                    if (currentIndex > 0) {
                      setSelectedStudent(students[currentIndex - 1].id)
                    }
                  }}
                  disabled={students.findIndex((s: any) => s.id === selectedStudent) === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentIndex = students.findIndex((s: any) => s.id === selectedStudent)
                    if (currentIndex < students.length - 1) {
                      setSelectedStudent(students[currentIndex + 1].id)
                    }
                  }}
                  disabled={students.findIndex((s: any) => s.id === selectedStudent) === students.length - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedStudent ? (
            <ScoreEntryForm
              student={students.find((s: any) => s.id === selectedStudent)!}
              subjectId={currentSubject.id}
              classId={classId}
              sessionId={sessionId}
              termId={termId}
              currentScore={scores.get(selectedStudent)}
              maxScore={currentSubject?.max_score || 100}
              passmark={currentSubject?.pass_mark || 40}
              onSave={(updatedScore) => onScoreSave(selectedStudent, updatedScore)}
              setIsSaving={setIsSaving}
            />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
              <IconChevronRight className="mb-2 h-12 w-12" />
              <p>Select a student to enter scores</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TableView({
  students,
  scores,
  currentSubject,
  classId,
  sessionId,
  termId,
  onScoreSave,
  setIsSaving, // Added prop
}: any) {
  const [editingCell, setEditingCell] = useState<{ studentId: string; field: string; rowIndex: number; colIndex: number } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'success' | 'error' }>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select()
    }
  }, [editingCell])

  function handleCellClick(studentId: string, field: string, currentValue: string, rowIndex: number, colIndex: number) {
    setEditingCell({ studentId, field, rowIndex, colIndex })
    setEditValue(currentValue)
  }

  function handleInputChange(value: string, field: string) {
    // Only accept numbers and decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) {
      return
    }

    // Check max score based on field
    let maxScore = 0
    if (field === 'ca1' || field === 'ca2') maxScore = 20
    if (field === 'exam') maxScore = 60

    const numValue = parseFloat(value)
    if (value && numValue > maxScore) {
      return // Don't update if exceeds max
    }

    setEditValue(value)
  }

  async function handleCellBlur(studentId: string) {
    if (!editingCell || editingCell.studentId !== studentId) return

    const currentEditingCell = editingCell
    const currentEditValue = editValue
    
    // Close the editor immediately so the next click/focus can open the new cell without interference
    setEditingCell(null)

    const cellKey = `${studentId}-${currentEditingCell.field}`
    setSaveStatus(prev => ({ ...prev, [cellKey]: 'saving' }))

    const currentScore = scores.get(studentId) || {
      student_id: studentId,
      ca1: "",
      ca2: "",
      exam: "",
      total: 0,
      grade: "",
      remark: "",
    }

    const updatedScore = {
      ...currentScore,
      [currentEditingCell.field]: currentEditValue,
    }

    // Recalculate totals and grade
    const ca1Val = parseFloat(updatedScore.ca1) || 0
    const ca2Val = parseFloat(updatedScore.ca2) || 0
    const examVal = parseFloat(updatedScore.exam) || 0
    const total = ca1Val + ca2Val + examVal

    updatedScore.total = total
    updatedScore.grade = getGrade(total)
    
    if (!updatedScore.remark) {
      updatedScore.remark = getRemarkFromScore(total, currentSubject?.pass_mark || 40)
    }

    setIsSaving(true)
    
    onScoreSave(studentId, updatedScore)
    
    // Save to database
    try {
      const result = await saveStudentScore(
        studentId,
        currentSubject.id,
        classId,
        sessionId,
        termId,
        {
          ca1: ca1Val,
          ca2: ca2Val,
          exam: examVal
        },
        updatedScore.remark
      )
      
      if (result && !result.success) {
        throw new Error(result.error || "Failed to save score")
      }
      
      setSaveStatus(prev => ({ ...prev, [cellKey]: 'success' }))
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [cellKey]: 'idle' }))
      }, 2000)
    } catch (error) {
      console.error("[v0] Error saving score:", error)
      setSaveStatus(prev => ({ ...prev, [cellKey]: 'error' }))
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [cellKey]: 'idle' }))
      }, 3000)
    } finally {
      setTimeout(() => {
        setIsSaving(false)
      }, 500)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, studentId: string, rowIndex: number, colIndex: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCellBlur(studentId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingCell(null)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleCellBlur(studentId)
    }
  }

  function getCellBorderColor(studentId: string, field: string, value: string): string {
    const cellKey = `${studentId}-${field}`
    const status = saveStatus[cellKey]
    
    if (status === 'saving') return 'border-yellow-500 border-2'
    if (status === 'success') return 'border-green-500 border-2'
    if (status === 'error') return 'border-red-500 border-2'
    
    // Validation colors
    if (!value) return ''
    
    const numValue = parseFloat(value)
    if (field === 'ca1' || field === 'ca2') {
      if (numValue < 0 || numValue > 20) return 'border-red-500 border-2'
    }
    if (field === 'exam') {
      if (numValue < 0 || numValue > 60) return 'border-red-500 border-2'
    }
    
    return ''
  }

  function getGrade(score: number): string {
    if (score >= 90) return "A+"
    if (score >= 80) return "A"
    if (score >= 70) return "B+"
    if (score >= 60) return "B"
    if (score >= 50) return "C"
    if (score >= 40) return "D"
    return "F"
  }

  function getRemarkFromScore(score: number, pass: number): string {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Very Good"
    if (score >= 70) return "Good"
    if (score >= 60) return "Credit"
    if (score >= pass) return "Pass"
    return "Fail"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Table</CardTitle>
        <CardDescription>
          Click to edit • Enter/Tab to save • Esc to cancel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Student</TableHead>
                <TableHead className="w-[80px]">CA 1</TableHead>
                <TableHead className="w-[80px]">CA 2</TableHead>
                <TableHead className="w-[80px]">Exam</TableHead>
                <TableHead className="w-[80px]">Total</TableHead>
                <TableHead className="w-[80px]">Grade</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any, rowIndex: number) => {
                const score = scores.get(student.id) || {
                  ca1: "",
                  ca2: "",
                  exam: "",
                  total: 0,
                  grade: "",
                  remark: "",
                }

                const isPassing = score.total >= (currentSubject?.pass_mark || 40)

                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {student.photo_url && <AvatarImage src={student.photo_url || "/placeholder.svg"} />}
                          <AvatarFallback>
                            {student.first_name[0]}{student.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.student_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingCell?.studentId === student.id && editingCell?.field === "ca1" ? (
                        <Input
                          ref={inputRef}
                          type="text"
                          inputMode="decimal"
                          value={editValue}
                          onChange={(e) => handleInputChange(e.target.value, 'ca1')}
                          onBlur={() => handleCellBlur(student.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, rowIndex, 0)}
                          className={cn("h-8 w-16", getCellBorderColor(student.id, 'ca1', editValue))}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(student.id, "ca1", score.ca1, rowIndex, 0)}
                          className={cn(
                            "h-8 w-16 rounded border bg-background px-2 text-left hover:bg-accent transition-colors",
                            getCellBorderColor(student.id, 'ca1', score.ca1)
                          )}
                        >
                          {score.ca1 || "-"}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.studentId === student.id && editingCell?.field === "ca2" ? (
                        <Input
                          ref={inputRef}
                          type="text"
                          inputMode="decimal"
                          value={editValue}
                          onChange={(e) => handleInputChange(e.target.value, 'ca2')}
                          onBlur={() => handleCellBlur(student.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, rowIndex, 1)}
                          className={cn("h-8 w-16", getCellBorderColor(student.id, 'ca2', editValue))}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(student.id, "ca2", score.ca2, rowIndex, 1)}
                          className={cn(
                            "h-8 w-16 rounded border bg-background px-2 text-left hover:bg-accent transition-colors",
                            getCellBorderColor(student.id, 'ca2', score.ca2)
                          )}
                        >
                          {score.ca2 || "-"}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.studentId === student.id && editingCell?.field === "exam" ? (
                        <Input
                          ref={inputRef}
                          type="text"
                          inputMode="decimal"
                          value={editValue}
                          onChange={(e) => handleInputChange(e.target.value, 'exam')}
                          onBlur={() => handleCellBlur(student.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, rowIndex, 2)}
                          className={cn("h-8 w-16", getCellBorderColor(student.id, 'exam', editValue))}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(student.id, "exam", score.exam, rowIndex, 2)}
                          className={cn(
                            "h-8 w-16 rounded border bg-background px-2 text-left hover:bg-accent transition-colors",
                            getCellBorderColor(student.id, 'exam', score.exam)
                          )}
                        >
                          {score.exam || "-"}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {score.total > 0 ? score.total.toFixed(1) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={score.grade ? "secondary" : "outline"}>
                        {score.grade || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {score.total > 0 && (
                        <Badge variant={isPassing ? "default" : "destructive"}>
                          {isPassing ? "Pass" : "Fail"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.studentId === student.id && editingCell?.field === "remark" ? (
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellBlur(student.id)}
                          onKeyDown={(e) => handleKeyDown(e, student.id, rowIndex, 3)}
                          className={cn("h-8 w-32", getCellBorderColor(student.id, 'remark', editValue))}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(student.id, "remark", score.remark, rowIndex, 3)}
                          className={cn(
                            "h-8 w-32 truncate rounded border bg-background px-2 text-left text-sm hover:bg-accent transition-colors",
                            getCellBorderColor(student.id, 'remark', score.remark)
                          )}
                        >
                          {score.remark || "Click to edit"}
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

interface ScoreEntryFormProps {
  student: {
    id: string
    student_id: string
    first_name: string
    middle_name: string | null
    last_name: string
    photo_url: string | null
  }
  subjectId: string
  classId: string
  sessionId: string
  termId: string
  currentScore?: StudentScore
  maxScore: number
  passmark: number
  onSave: (score: StudentScore) => void
  setIsSaving: (saving: boolean) => void // Added prop
}

function ScoreEntryForm({
  student,
  subjectId,
  classId,
  sessionId,
  termId,
  currentScore,
  maxScore,
  passmark,
  onSave,
  setIsSaving, // Added prop
}: ScoreEntryFormProps) {
  const [ca1, setCA1] = useState(currentScore?.ca1 || "")
  const [ca2, setCA2] = useState(currentScore?.ca2 || "")
  const [exam, setExam] = useState(currentScore?.exam || "")
  const [remarks, setRemarks] = useState(currentScore?.remark || "")
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const ca1InputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCA1(currentScore?.ca1 || "")
    setCA2(currentScore?.ca2 || "")
    setExam(currentScore?.exam || "")
    setRemarks(currentScore?.remark || "")
    setSaveSuccess(false)
    
    setTimeout(() => {
      ca1InputRef.current?.focus()
    }, 100)
  }, [currentScore, student.id])

  const ca1Val = parseFloat(ca1) || 0
  const ca2Val = parseFloat(ca2) || 0
  const examVal = parseFloat(exam) || 0
  const total = ca1Val + ca2Val + examVal

  const isCA1Valid = ca1Val >= 0 && ca1Val <= 20
  const isCA2Valid = ca2Val >= 0 && ca2Val <= 20
  const isExamValid = examVal >= 0 && examVal <= 60
  const isFormValid = isCA1Valid && isCA2Valid && isExamValid

  const grade = getGrade(total)
  const remarkAuto = getRemarkFromScore(total, passmark)

  function getGrade(score: number): string {
    if (score >= 90) return "A+"
    if (score >= 80) return "A"
    if (score >= 70) return "B+"
    if (score >= 60) return "B"
    if (score >= 50) return "C"
    if (score >= 40) return "D"
    return "F"
  }

  function getRemarkFromScore(score: number, pass: number): string {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Very Good"
    if (score >= 70) return "Good"
    if (score >= 60) return "Credit"
    if (score >= pass) return "Pass"
    return "Fail"
  }

  async function handleSave() {
    if (!isFormValid) {
      alert("Please check your score entries. Values are out of range.")
      return
    }

    setSaving(true)
    setSaveSuccess(false)
    setIsSaving(true)
    
    try {
      console.log("[v0] Saving scores:", { ca1Val, ca2Val, examVal, total, grade, remarks })
      
      const updatedScore: StudentScore = {
        student_id: student.id,
        ca1,
        ca2,
        exam,
        total,
        grade,
        remark: remarks || remarkAuto,
      }
      
      onSave(updatedScore)
      
      const result = await saveStudentScore(
        student.id,
        subjectId,
        classId,
        sessionId,
        termId,
        {
          ca1: ca1Val,
          ca2: ca2Val,
          exam: examVal
        },
        remarks || remarkAuto
      )
      
      if (result && !result.success) {
        throw new Error(result.error || "Failed to save score")
      }
      
      setSaveSuccess(true)
      
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error("[v0] Error saving scores:", error)
      alert(`Failed to save scores: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSaving(false)
      setTimeout(() => {
        setIsSaving(false)
      }, 500)
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4 bg-zinc-50/50 dark:bg-zinc-900/10">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {student.photo_url && <AvatarImage src={student.photo_url || "/placeholder.svg"} />}
            <AvatarFallback>
              {student.first_name[0]}{student.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">
              {student.first_name} {student.middle_name} {student.last_name}
            </p>
            <p className="text-muted-foreground text-xs">{student.student_id}</p>
          </div>
        </div>

        {/* Inline KPI Info */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Total Score</p>
            <p className="text-lg font-bold mt-0.5 text-zinc-800 dark:text-zinc-100">
              {total.toFixed(1)}<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">/{maxScore}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Grade</p>
            <p className="text-lg font-bold mt-0.5 text-zinc-800 dark:text-zinc-100">{grade}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Status</p>
            <div className="mt-1">
              <Badge variant={total >= passmark ? "default" : "destructive"} className="text-[10px] font-bold">
                {total >= passmark ? "Pass" : "Fail"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Score Input Fields */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="ca1">CA Test 1 (Max: 20)</Label>
          <Input
            ref={ca1InputRef}
            id="ca1"
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={ca1}
            onChange={(e) => setCA1(e.target.value)}
            placeholder="0"
            className={!isCA1Valid && ca1 ? "border-destructive" : ""}
          />
          {!isCA1Valid && ca1 && (
            <p className="text-destructive text-xs">Score must be between 0 and 20</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ca2">CA Test 2 (Max: 20)</Label>
          <Input
            id="ca2"
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={ca2}
            onChange={(e) => setCA2(e.target.value)}
            placeholder="0"
            className={!isCA2Valid && ca2 ? "border-destructive" : ""}
          />
          {!isCA2Valid && ca2 && (
            <p className="text-destructive text-xs">Score must be between 0 and 20</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="exam">Exam (Max: 60)</Label>
          <Input
            id="exam"
            type="number"
            min="0"
            max="60"
            step="0.5"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            placeholder="0"
            className={!isExamValid && exam ? "border-destructive" : ""}
          />
          {!isExamValid && exam && (
            <p className="text-destructive text-xs">Score must be between 0 and 60</p>
          )}
        </div>
      </div>



      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks (Optional)</Label>
        <Input
          id="remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={remarkAuto}
        />
        <p className="text-muted-foreground text-xs">
          Auto-generated: {remarkAuto}
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
          Score saved successfully!
        </div>
      )}

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={saving || !isFormValid} 
        className="w-full"
      >
        {saving ? "Saving..." : "Save Score"}
      </Button>
    </div>
  )
}
