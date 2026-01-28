"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Download, Printer, Award, TrendingUp, TrendingDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePrint } from "@/components/finance/print-provider"

interface ParentResultsClientProps {
  children: any[]
  sessions: any[]
  terms: any[]
  selectedStudentId?: string
  selectedSessionId?: string
  selectedTermId?: string
  resultData: any
  scores: any[]
  grading: any[]
}

export function ParentResultsClient({
  children,
  sessions,
  terms,
  selectedStudentId,
  selectedSessionId,
  selectedTermId,
  resultData,
  scores,
  grading,
}: ParentResultsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [student, setStudent] = useState(selectedStudentId || "")
  const [session, setSession] = useState(selectedSessionId || "")
  const [term, setTerm] = useState(selectedTermId || "")

  const selectedChild = children.find((c) => c.id === student)
  const selectedSession = sessions.find((s) => s.id === session)
  const selectedTerm = terms.find((t) => t.id === term)

  const availableTerms = terms.filter((t) => t.session_id === session)

  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (student) params.set("student", student)
    if (session) params.set("session", session)
    if (term) params.set("term", term)
    router.push(`/parent/results?${params.toString()}`)
  }

  const { print } = usePrint()

  const handlePrint = () => {
    if (!resultData || !scores) return

    print("result", {
      studentName: `${resultData.students.first_name} ${resultData.students.last_name}`,
      studentId: resultData.students.student_id,
      className: `${resultData.classes?.name} (${resultData.classes?.sections?.name || 'A'})`,
      term: selectedTerm?.name || "Term",
      session: selectedSession?.name || "Session",
      average: resultData.average_score || 0,
      totalScore: resultData.total_score || 0,
      position: resultData.position || "N/A",
      subjects: scores.map(s => ({
        name: s.name,
        ca: s.ca,
        exam: s.exam,
        total: s.total,
        grade: s.grade,
        remark: s.remark
      })),
      grading: grading || [],
      teacherRemark: resultData.teacher_remark,
      principalRemark: resultData.principal_remark
    })
  }

  const handleDownload = () => {
    // TODO: Generate PDF report card
  }

  const hasResults = resultData && scores && scores.length > 0

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Student & Term</CardTitle>
          <CardDescription>Choose a child and academic term to view results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Child</label>
              <Select value={student} onValueChange={setStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.is_active && <Badge className="ml-2">Active</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={term} onValueChange={setTerm} disabled={!session}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {availableTerms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.is_active && <Badge className="ml-2">Active</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleFilterChange} disabled={!student || !session || !term}>
              View Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {!hasResults && student && session && term && (
        <Alert>
          <AlertDescription>
            No results available for the selected term. Results may not have been published yet.
          </AlertDescription>
        </Alert>
      )}

      {hasResults && (
        <>
          {/* Student Info & Overall Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedChild?.photo_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedChild?.first_name?.[0]}
                      {selectedChild?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>
                      {resultData.students.first_name} {resultData.students.middle_name} {resultData.students.last_name}
                    </CardTitle>
                    <CardDescription>
                      {resultData.students.student_id} • {resultData.classes?.sections?.name} -{" "}
                      {resultData.classes?.name}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className="text-2xl font-bold">{resultData.total_score?.toFixed(1) || "0.0"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">{resultData.average_score?.toFixed(1) || "0.0"}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    {resultData.position || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subjects</p>
                  <div className="flex gap-2 items-center">
                    <Badge variant="default" className="bg-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {resultData.subjects_passed || 0} Passed
                    </Badge>
                    {resultData.subjects_failed > 0 && (
                      <Badge variant="destructive">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {resultData.subjects_failed} Failed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>
                {selectedSession?.name} - {selectedTerm?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Subject</th>
                      <th className="text-center p-2">CA Score</th>
                      <th className="text-center p-2">Exam Score</th>
                      <th className="text-center p-2">Total</th>
                      <th className="text-center p-2">Grade</th>
                      <th className="text-left p-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((subject: any) => (
                      <tr key={subject.id} className="border-b">
                        <td className="p-2 font-medium">{subject.name}</td>
                        <td className="p-2 text-center">{subject.ca.toFixed(1)}</td>
                        <td className="p-2 text-center">{subject.exam.toFixed(1)}</td>
                        <td className="p-2 text-center font-bold">{subject.total.toFixed(1)}</td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              subject.grade === "A" || subject.grade === "B"
                                ? "default"
                                : subject.grade === "F"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {subject.grade}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">{subject.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Grading Scale Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Grading Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-5">
                {grading?.map((grade: any) => (
                  <div key={grade.id} className="flex items-center gap-2 p-2 rounded border">
                    <Badge>{grade.grade}</Badge>
                    <div className="text-sm">
                      <p className="font-medium">
                        {grade.min_score}-{grade.max_score}
                      </p>
                      <p className="text-muted-foreground">{grade.remark}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Remarks */}
          <div className="grid gap-6 md:grid-cols-2">
            {resultData.teacher_remark && (
              <Card>
                <CardHeader>
                  <CardTitle>Class Teacher's Remark</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{resultData.teacher_remark}</p>
                </CardContent>
              </Card>
            )}

            {resultData.principal_remark && (
              <Card>
                <CardHeader>
                  <CardTitle>Principal's Remark</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{resultData.principal_remark}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
