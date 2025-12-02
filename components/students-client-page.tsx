"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RegisterStudentModal } from "@/components/register-student-modal"
import { StudentDetailsSheet } from "@/components/student-details-sheet"

interface StudentsClientPageProps {
  initialStudents: any[]
  guardians: any[]
  sessions: any[]
  terms: any[]
  classes: any[]
  userRole: string // Add userRole prop
}

export function StudentsClientPage({
  initialStudents,
  guardians,
  sessions,
  terms,
  classes,
  userRole, // Destructure userRole
}: StudentsClientPageProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const allStudents = initialStudents

  const filteredStudents = allStudents.filter((student) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      student.first_name?.toLowerCase().includes(search) ||
      student.last_name?.toLowerCase().includes(search) ||
      student.student_id?.toLowerCase().includes(search)
    )
  })

  const enrolledStudents = filteredStudents.filter(
    (student) => student.student_enrollments && student.student_enrollments.length > 0,
  )

  const notEnrolledStudents = filteredStudents.filter(
    (student) => !student.student_enrollments || student.student_enrollments.length === 0,
  )

  const renderStudentTable = (students: any[], emptyMessage: string) => {
    if (!students || students.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          {searchTerm ? "No students found matching your search." : emptyMessage}
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Current Class</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student: any) => {
            const activeEnrollment = student.student_enrollments?.find((e: any) => e.is_active)

            return (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.student_id}</TableCell>
                <TableCell>
                  {student.first_name} {student.last_name}
                </TableCell>
                <TableCell>{student.gender}</TableCell>
                <TableCell>
                  {activeEnrollment?.class?.name || <span className="text-muted-foreground italic">Not Enrolled</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={student.status === "Active" ? "default" : "secondary"}>{student.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedStudentId(student.id)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">
              {userRole === "teacher"
                ? "View students in your assigned classes"
                : "Manage student records and enrollments"}
            </p>
          </div>
          {userRole !== "teacher" && <RegisterStudentModal guardians={guardians} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Records</CardTitle>
            <CardDescription>View all students, filter by enrollment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name or student ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Students ({filteredStudents.length})</TabsTrigger>
                <TabsTrigger value="enrolled">Enrolled ({enrolledStudents.length})</TabsTrigger>
                <TabsTrigger value="not-enrolled">Not Enrolled ({notEnrolledStudents.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {renderStudentTable(
                  filteredStudents,
                  "No students registered yet. Register your first student to get started.",
                )}
              </TabsContent>

              <TabsContent value="enrolled" className="mt-4">
                {renderStudentTable(enrolledStudents, "No enrolled students found.")}
              </TabsContent>

              <TabsContent value="not-enrolled" className="mt-4">
                {renderStudentTable(notEnrolledStudents, "All students are enrolled in classes.")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <StudentDetailsSheet
        studentId={selectedStudentId}
        open={!!selectedStudentId}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null)
        }}
        sessions={sessions}
        terms={terms}
        classes={classes}
        userRole={userRole} // Pass userRole to StudentDetailsSheet
      />
    </>
  )
}
