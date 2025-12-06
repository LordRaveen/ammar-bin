"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, TrendingUp, Award, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Child {
  id: string
  student_id: string
  first_name: string
  middle_name?: string
  last_name: string
  photo_url?: string
}

interface Session {
  id: string
  name: string
  is_active: boolean
}

interface Term {
  id: string
  name: string
  session_id: string
  is_active: boolean
}

interface GradingScheme {
  grade: string
  min_score: number
  max_score: number
  remark: string
  is_passing: boolean
}

export function ParentResultsClient({
  children,
  sessions,
  terms,
  defaultSessionId,
  defaultTermId,
  gradingSchemes,
}: {
  children: Child[]
  sessions: Session[]
  terms: Term[]
  defaultSessionId?: string
  defaultTermId?: string
  gradingSchemes: GradingScheme[]
}) {
  const [selectedChild, setSelectedChild] = useState<string>(children[0]?.id || "")
  const [selectedSession, setSelectedSession] = useState<string>(defaultSessionId || "")
  const [selectedTerm, setSelectedTerm] = useState<string>(defaultTermId || "")
  const [result, setResult] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [historicalResults, setHistoricalResults] = useState<any[]>([])
  const { toast } = useToast()

  const filteredTerms = terms.filter((t) => t.session_id === selectedSession)

  useEffect(() => {
    if (selectedChild && selectedSession && selectedTerm) {
      fetchResults()
    }
  }, [selectedChild, selectedSession, selectedTerm])

  useEffect(() => {
    if (selectedChild) {
      fetchHistoricalResults()
    }
  }, [selectedChild])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const resultRes = await fetch(
        `/api/parent/results?studentId=${selectedChild}&sessionId=${selectedSession}&termId=${selectedTerm}`,
      )
      const resultData = await resultRes.json()

      if (resultData.result) {
        setResult(resultData.result)
        setScores(resultData.scores || [])
      } else {
        setResult(null)
        setScores([])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch results",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchHistoricalResults = async () => {
    try {
      const res = await fetch(`/api/parent/results/history?studentId=${selectedChild}`)
      const data = await res.json()
      setHistoricalResults(data.results || [])
    } catch (error) {
      console.error("Failed to fetch historical results:", error)
    }
  }

  const handlePrint = () => {
    window.open(
      `/parent/results/report-card?studentId=${selectedChild}&sessionId=${selectedSession}&termId=${selectedTerm}`,
      "_blank",
    )
  }

  const handleDownload = async () => {
    toast({
      title: "Coming Soon",
      description: "PDF download feature will be available soon",
    })
  }

  const selectedChildData = children.find((c) => c.id === selectedChild)
  const selectedSessionData = sessions.find((s) => s.id === selectedSession)
  const selectedTermData = terms.find((t) => t.id === selectedTerm)

  const subjectScores: Record<string, any> = {}
  scores.forEach((score: any) => {
    const subjectName = score.subject_name
    if (!subjectScores[subjectName]) {
      subjectScores[subjectName] = {
        ca1: 0,
        ca2: 0,
        exam: 0,
        total: 0,
        grade: "",
        remark: "",
      }
    }

    if (score.assessment_type === "CA Test 1") {
      subjectScores[subjectName].ca1 = score.score || 0
    } else if (score.assessment_type === "CA Test 2") {
      subjectScores[subjectName].ca2 = score.score || 0
    } else if (score.assessment_type === "Exam") {
      subjectScores[subjectName].exam = score.score || 0
    }

    subjectScores[subjectName].total =
      subjectScores[subjectName].ca1 + subjectScores[subjectName].ca2 + subjectScores[subjectName].exam
    subjectScores[subjectName].grade = score.grade || ""
    subjectScores[subjectName].remark = score.remarks || ""
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
        <p className="text-muted-foreground">View your children's academic performance and report cards</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Student & Term</CardTitle>
          <CardDescription>Choose a child and academic period to view results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Child</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
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
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} {session.is_active && <Badge className="ml-2">Active</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} {term.is_active && <Badge className="ml-2">Active</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="text-muted-foreground">Loading results...</p>
          </CardContent>
        </Card>
      )}

      {!loading && result && (
        <>
          {/* Student Info Banner */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary-foreground/20">
                  <AvatarImage src={selectedChildData?.photo_url || ""} />
                  <AvatarFallback>
                    {selectedChildData?.first_name?.[0]}
                    {selectedChildData?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {selectedChildData?.first_name} {selectedChildData?.middle_name} {selectedChildData?.last_name}
                  </h2>
                  <p className="text-primary-foreground/80">
                    {selectedSessionData?.name} - {selectedTermData?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </Button>
                  <Button variant="secondary" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Score</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.total_score?.toFixed(1) || "0.0"}</div>
                <p className="text-xs text-muted-foreground">Out of {result.total_subjects * 100}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.average_score?.toFixed(1) || "0.0"}%</div>
                <p className="text-xs text-muted-foreground">Class average: N/A</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Class Position</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.position || "N/A"}</div>
                <p className="text-xs text-muted-foreground">Out of class</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {result.subjects_passed || 0}/{result.total_subjects || 0}
                </div>
                <p className="text-xs text-muted-foreground">{result.subjects_failed || 0} failed</p>
              </CardContent>
            </Card>
          </div>

          {/* Subject Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Detailed breakdown of scores by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Subject</th>
                      <th className="text-center p-3 font-semibold">CA 1 (20)</th>
                      <th className="text-center p-3 font-semibold">CA 2 (20)</th>
                      <th className="text-center p-3 font-semibold">Exam (60)</th>
                      <th className="text-center p-3 font-semibold">Total (100)</th>
                      <th className="text-center p-3 font-semibold">Grade</th>
                      <th className="text-left p-3 font-semibold">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(subjectScores).map(([subject, data]: [string, any]) => (
                      <tr key={subject} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{subject}</td>
                        <td className="p-3 text-center">{data.ca1}</td>
                        <td className="p-3 text-center">{data.ca2}</td>
                        <td className="p-3 text-center">{data.exam}</td>
                        <td className="p-3 text-center font-bold">{data.total}</td>
                        <td className="p-3 text-center">
                          <Badge variant={data.grade === "F" ? "destructive" : "default"}>{data.grade}</Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{data.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Grading Scale */}
          <Card>
            <CardHeader>
              <CardTitle>Grading Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {gradingSchemes.map((scheme) => (
                  <div key={scheme.grade} className="border rounded p-2 text-center">
                    <p className="font-bold">{scheme.grade}</p>
                    <p className="text-xs text-muted-foreground">
                      {scheme.min_score}-{scheme.max_score}
                    </p>
                    <p className="text-xs">{scheme.remark}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Class Teacher's Comment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.teacher_remark || "No comment provided"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Principal's Comment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.principal_remark || "No comment provided"}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!loading && !result && selectedChild && selectedSession && selectedTerm && (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="text-muted-foreground">No results available for the selected period.</p>
            <p className="text-sm text-muted-foreground mt-2">Results may not have been published yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Historical Results */}
      {historicalResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Performance</CardTitle>
            <CardDescription>Past academic results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historicalResults.map((hr: any) => (
                <div key={hr.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {hr.session_name} - {hr.term_name}
                    </p>
                    <p className="text-sm text-muted-foreground">Position: {hr.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{hr.average_score?.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">
                      {hr.subjects_passed}/{hr.total_subjects} passed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
