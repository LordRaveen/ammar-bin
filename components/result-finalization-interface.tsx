"use client"

import { useState, useEffect } from "react"
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
import { ChevronLeft, Printer, Pencil } from 'lucide-react'
import { createBrowserClient } from "@/lib/supabase/client"
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
  skill_name: string
  rating: number | null
}

type Props = {
  sessions: Array<{ id: string; name: string }>
  terms: Array<{ id: string; name: string; session_id: string }>
  classData: { id: string; name: string; section: { name: string } } | null
  students: Student[]
  initialSessionId: string
  initialTermId: string
  initialClassId: string
}

export function ResultFinalizationInterface({
  sessions,
  terms,
  classData,
  students: initialStudents,
  initialSessionId,
  initialTermId,
  initialClassId,
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
  const [scores, setScores] = useState<Score[]>([])
  const [affectiveSkills, setAffectiveSkills] = useState<Skill[]>([])
  const [psychomotorSkills, setPsychomotorSkills] = useState<Skill[]>([])
  const [teacherRemarks, setTeacherRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const [scoresCompletion, setScoresCompletion] = useState({ completed: 0, total: 0 })
  const [skillsCompletion, setSkillsCompletion] = useState({ completed: 0, total: 0 })

  // Filter terms based on selected session
  const filteredTerms = terms.filter((t) => t.session_id === sessionId)

  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase()) || student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Fetch completion stats
  useEffect(() => {
    async function fetchCompletionStats() {
      if (!initialClassId || !sessionId || !termId) return

      // Fetch scores completion
      const { data: scoresData } = await supabase
        .from("student_scores")
        .select("student_id, score")
        .in(
          "student_id",
          students.map((s) => s.id)
        )

      const studentsWithScores = new Set(scoresData?.filter((s) => s.score !== null).map((s) => s.student_id))
      setScoresCompletion({
        completed: studentsWithScores.size,
        total: students.length,
      })

      // Fetch skills completion
      const { data: skillsData } = await supabase
        .from("student_skills")
        .select("student_id, rating")
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .in(
          "student_id",
          students.map((s) => s.id)
        )

      const studentsWithSkills = new Set(skillsData?.filter((s) => s.rating !== null).map((s) => s.student_id))
      setSkillsCompletion({
        completed: studentsWithSkills.size,
        total: students.length,
      })
    }

    fetchCompletionStats()
  }, [initialClassId, sessionId, termId, students, supabase])

  // Fetch student data when selected
  useEffect(() => {
    async function fetchStudentData() {
      if (!selectedStudent) return
      setLoading(true)

      try {
        // Fetch scores
        const { data: scoresData } = await supabase
          .from("student_scores")
          .select(`
            score,
            grade,
            assessment:assessments(
              subject:subjects(name),
              assessment_type:assessment_types(name)
            )
          `)
          .eq("student_id", selectedStudent.id)

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

        // Calculate totals
        const scoresArray = Array.from(scoresBySubject.values()).map((s) => ({
          ...s,
          total: (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0),
        }))

        setScores(scoresArray)

        // Fetch skills
        const { data: skillsData } = await supabase
          .from("student_skills")
          .select("skill_category, skill_name, rating")
          .eq("student_id", selectedStudent.id)
          .eq("session_id", sessionId)
          .eq("term_id", termId)

        setAffectiveSkills(
          skillsData?.filter((s) => s.skill_category === "Affective") || []
        )
        setPsychomotorSkills(
          skillsData?.filter((s) => s.skill_category === "Psychomotor") || []
        )

        // Fetch remarks
        const { data: resultData } = await supabase
          .from("student_results")
          .select("teacher_remark")
          .eq("student_id", selectedStudent.id)
          .eq("session_id", sessionId)
          .eq("term_id", termId)
          .single()

        setTeacherRemarks(resultData?.teacher_remark || "")
      } catch (error) {
        console.error("[v0] Error fetching student data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [selectedStudent, sessionId, termId, supabase])

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
          s.skill_name === skillName ? { ...s, rating } : s
        )
      )
    } else {
      setPsychomotorSkills((prev) =>
        prev.map((s) =>
          s.skill_name === skillName ? { ...s, rating } : s
        )
      )
    }
  }

  const handleSave = async () => {
    if (!selectedStudent) return
    setLoading(true)

    try {
      // Save skills
      const allSkills = [...affectiveSkills, ...psychomotorSkills]
      for (const skill of allSkills) {
        await supabase
          .from("student_skills")
          .upsert({
            student_id: selectedStudent.id,
            session_id: sessionId,
            term_id: termId,
            class_id: initialClassId,
            skill_category: affectiveSkills.includes(skill) ? "Affective" : "Psychomotor",
            skill_name: skill.skill_name,
            rating: skill.rating,
            assessed_by: (await supabase.auth.getUser()).data.user?.id,
          })
      }

      // Save remarks
      const totalScore = scores.reduce((sum, s) => sum + s.total, 0)
      const averageScore = scores.length > 0 ? totalScore / scores.length : 0

      await supabase.from("student_results").upsert({
        student_id: selectedStudent.id,
        session_id: sessionId,
        term_id: termId,
        class_id: initialClassId,
        total_score: totalScore,
        average_score: averageScore,
        teacher_remark: teacherRemarks,
      })

      alert("Results saved successfully!")
    } catch (error) {
      console.error("[v0] Error saving results:", error)
      alert("Failed to save results. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const totalScore = scores.reduce((sum, s) => sum + s.total, 0)
  const maxScore = scores.length * 100 // Assuming 100 per subject
  const averageScore = scores.length > 0 ? (totalScore / maxScore) * 100 : 0
  const grade = averageScore >= 90 ? "A" : averageScore >= 80 ? "B" : averageScore >= 70 ? "C" : averageScore >= 60 ? "D" : "F"

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{classData?.name}</h1>
            <p className="text-sm text-muted-foreground">{classData?.section?.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={sessionId} onValueChange={handleSessionChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={termId} onValueChange={handleTermChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {filteredTerms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Completion Stats */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scores completion</p>
                <p className="text-lg font-semibold">
                  {scoresCompletion.completed}/{scoresCompletion.total}
                </p>
              </div>
              <p className="text-3xl font-bold">
                {scoresCompletion.total > 0
                  ? Math.round((scoresCompletion.completed / scoresCompletion.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Skills completion</p>
                <p className="text-lg font-semibold">
                  {skillsCompletion.completed}/{skillsCompletion.total}
                </p>
              </div>
              <p className="text-3xl font-bold">
                {skillsCompletion.total > 0
                  ? Math.round((skillsCompletion.completed / skillsCompletion.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Students List */}
        <Card className="w-[400px]">
          <CardContent className="flex h-full flex-col gap-4 p-6">
            <h2 className="text-xl font-bold">Students</h2>
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex-1 space-y-2 overflow-y-auto">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                    selectedStudent?.id === student.id && "border-primary bg-accent"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.photo_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {student.first_name[0]}
                      {student.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{student.student_id}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student Details */}
        <Card className="flex-1">
          <CardContent className="h-full overflow-y-auto p-6">
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Student Header */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStudent.photo_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedStudent.first_name[0]}
                        {selectedStudent.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudent.student_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">DOB</p>
                      <p className="font-medium">
                        {selectedStudent.date_of_birth
                          ? new Date(selectedStudent.date_of_birth).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium">{selectedStudent.gender || "N/A"}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Scores Table */}
                <div>
                  <h4 className="mb-3 font-semibold">Scores</h4>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="border-r p-3 text-left text-sm font-medium">Subject</th>
                          <th className="border-r p-3 text-center text-sm font-medium">CA Test 1</th>
                          <th className="border-r p-3 text-center text-sm font-medium">CA Test 2</th>
                          <th className="border-r p-3 text-center text-sm font-medium">Exam</th>
                          <th className="border-r p-3 text-center text-sm font-medium">Total</th>
                          <th className="p-3 text-center text-sm font-medium">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scores.map((score, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="border-r p-3 text-sm">{score.subject_name}</td>
                            <td className="border-r p-3 text-center text-sm">{score.ca1 ?? "-"}</td>
                            <td className="border-r p-3 text-center text-sm">{score.ca2 ?? "-"}</td>
                            <td className="border-r p-3 text-center text-sm">{score.exam ?? "-"}</td>
                            <td className="border-r p-3 text-center text-sm font-medium">
                              {score.total}
                            </td>
                            <td className="p-3 text-center text-sm font-medium">{score.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="mb-3 font-semibold">Summary</h4>
                  <div className="flex gap-4">
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Score</p>
                        <p className="text-xl font-bold">
                          {totalScore}/{maxScore}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Avg. Score</p>
                        <p className="text-xl font-bold">{averageScore.toFixed(0)}%</p>
                      </CardContent>
                    </Card>
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Grade</p>
                        <p className="text-xl font-bold">{grade}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Skills */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Affective Skills */}
                  <div>
                    <h4 className="mb-3 font-semibold">Affective Skills</h4>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {affectiveSkills.map((skill) => (
                            <div key={skill.skill_name} className="flex items-center justify-between">
                              <span className="text-sm">{skill.skill_name}</span>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Checkbox
                                    key={rating}
                                    checked={skill.rating === rating}
                                    onCheckedChange={() =>
                                      handleSkillRatingChange("Affective", skill.skill_name, rating)
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Psychomotor Skills */}
                  <div>
                    <h4 className="mb-3 font-semibold">Psychomotor Skills</h4>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {psychomotorSkills.map((skill) => (
                            <div key={skill.skill_name} className="flex items-center justify-between">
                              <span className="text-sm">{skill.skill_name}</span>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Checkbox
                                    key={rating}
                                    checked={skill.rating === rating}
                                    onCheckedChange={() =>
                                      handleSkillRatingChange("Psychomotor", skill.skill_name, rating)
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Teacher Remarks */}
                <div>
                  <h4 className="mb-3 font-semibold">Teachers Remarks</h4>
                  <Textarea
                    placeholder="Enter teacher remarks..."
                    value={teacherRemarks}
                    onChange={(e) => setTeacherRemarks(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading} size="lg">
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Select a student to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
