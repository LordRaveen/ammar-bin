"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Award, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AcademicReportsClientProps {
  performance: any[]
  subjectPerformance: any[]
  sessions: any[]
  classes: any[]
}

export default function AcademicReportsClient({
  performance,
  subjectPerformance,
  sessions,
  classes,
}: AcademicReportsClientProps) {
  const [selectedSession, setSelectedSession] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("all")

  // Filter data based on selections
  const filteredPerformance = performance.filter((p) => {
    if (selectedSession !== "all" && p.session_name !== selectedSession) return false
    if (selectedClass !== "all" && p.class_name !== selectedClass) return false
    return true
  })

  const filteredSubjects = subjectPerformance.filter((s) => {
    if (selectedSession !== "all" && s.session_name !== selectedSession) return false
    if (selectedClass !== "all" && s.class_name !== selectedClass) return false
    return true
  })

  // Calculate statistics
  const topPerformers = filteredPerformance.slice(0, 10)
  const avgClassPerformance =
    filteredPerformance.reduce((sum, p) => sum + (p.average_percentage || 0), 0) / filteredPerformance.length || 0

  const exportToPDF = async () => {
    // Placeholder for PDF export functionality
    alert("PDF export will be implemented with jsPDF library")
  }

  const exportToExcel = async () => {
    // Placeholder for Excel export functionality
    alert("Excel export will be implemented with xlsx library")
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Filter reports by session and class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Session</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.name}>
                      {session.name} - {session.term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-end">
              <Button onClick={exportToPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClassPerformance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPerformance.length}</div>
            <p className="text-xs text-muted-foreground">With recorded results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Assessed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSubjects.length}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
          <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
          <TabsTrigger value="top">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Overview</CardTitle>
              <CardDescription>Detailed performance data for all students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead className="text-right">Assessments</TableHead>
                      <TableHead className="text-right">Avg Score</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead className="text-right">Rank</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No performance data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPerformance.map((student) => (
                        <TableRow key={student.student_id}>
                          <TableCell className="font-medium">{student.student_number}</TableCell>
                          <TableCell>{student.student_name}</TableCell>
                          <TableCell>{student.class_name}</TableCell>
                          <TableCell>
                            {student.session_name} - {student.term}
                          </TableCell>
                          <TableCell className="text-right">{student.total_assessments}</TableCell>
                          <TableCell className="text-right">{student.average_score}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                student.average_percentage >= 75
                                  ? "default"
                                  : student.average_percentage >= 50
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {student.average_percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{student.class_rank}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance Analysis</CardTitle>
              <CardDescription>Average performance across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">Avg Score</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No subject data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubjects.map((subject, index) => (
                        <TableRow key={`${subject.subject_id}-${index}`}>
                          <TableCell className="font-medium">{subject.subject_name}</TableCell>
                          <TableCell>{subject.class_name}</TableCell>
                          <TableCell>
                            {subject.session_name} - {subject.term}
                          </TableCell>
                          <TableCell className="text-right">{subject.student_count}</TableCell>
                          <TableCell className="text-right">{subject.avg_score}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                subject.avg_percentage >= 75
                                  ? "default"
                                  : subject.avg_percentage >= 50
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {subject.avg_percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{subject.min_score}</TableCell>
                          <TableCell className="text-right">{subject.max_score}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Performers</CardTitle>
              <CardDescription>Highest performing students based on average percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Rank</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Average Percentage</TableHead>
                      <TableHead className="text-right">Total Assessments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPerformers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No top performers data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      topPerformers.map((student, index) => (
                        <TableRow key={student.student_id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                              {index === 1 && <Award className="h-5 w-5 text-gray-400" />}
                              {index === 2 && <Award className="h-5 w-5 text-amber-600" />}
                              {index > 2 && <span className="font-semibold">{index + 1}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{student.student_name}</TableCell>
                          <TableCell>{student.class_name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default">{student.average_percentage}%</Badge>
                          </TableCell>
                          <TableCell className="text-right">{student.total_assessments}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
