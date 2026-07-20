"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Trash2, Pencil, ChevronLeft, ChevronRight, Printer } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RegisterStudentModal } from "@/components/register-student-modal"
import { StudentDetailsSheet } from "@/components/student-details-sheet"
import { DeleteStudentDialog } from "@/components/delete-student-dialog"
import { EditStudentModal } from "@/components/edit-student-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StudentsClientPageProps {
  initialStudents: any[]
  guardians: any[]
  sessions: any[]
  terms: any[]
  classes: any[]
  userRole: string
}

export function StudentsClientPage({
  initialStudents,
  guardians,
  sessions,
  terms,
  classes,
  userRole,
}: StudentsClientPageProps) {
  const [students, setStudents] = useState(initialStudents)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const activeSession = sessions.find((s) => s.is_active)
  const activeTerm = terms.find((t) => t.is_active && t.session_id === activeSession?.id)
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [editStudent, setEditStudent] = useState<any | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [currentPage, setCurrentPage] = useState<Record<string, number>>({ all: 1, enrolled: 1, "not-enrolled": 1 })
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [activeTab, setActiveTab] = useState("all")

  const filteredStudents = students.filter((student) => {
    let matches = true

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      matches =
        matches &&
        (student.first_name?.toLowerCase().includes(search) ||
          student.last_name?.toLowerCase().includes(search) ||
          student.student_id?.toLowerCase().includes(search))
    }

    if (genderFilter !== "all") {
      matches = matches && student.gender === genderFilter
    }

    if (statusFilter !== "all") {
      matches = matches && student.status === statusFilter
    }

    return matches
  })

  const enrolledStudents = filteredStudents.filter(
    (student) => student.student_enrollments && student.student_enrollments.length > 0,
  )
  const notEnrolledStudents = filteredStudents.filter(
    (student) => !student.student_enrollments || student.student_enrollments.length === 0,
  )

  useEffect(() => {
    setCurrentPage({ all: 1, enrolled: 1, "not-enrolled": 1 })
    setRowSelection({})
  }, [searchTerm, genderFilter, statusFilter])

  const getTabData = () => {
    let data = filteredStudents
    if (activeTab === "enrolled") data = enrolledStudents
    if (activeTab === "not-enrolled") data = notEnrolledStudents
    return data
  }

  const tabData = getTabData()
  const page = currentPage[activeTab] || 1
  const totalPages = Math.ceil(tabData.length / rowsPerPage)
  const startIndex = (page - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedStudents = tabData.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    setCurrentPage((prev) => ({ ...prev, [activeTab]: newPage }))
  }

  const handlePageSizeChange = (size: string) => {
    setRowsPerPage(Number.parseInt(size))
    setCurrentPage({ all: 1, enrolled: 1, "not-enrolled": 1 })
  }

  const handleSelectAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {}
    paginatedStudents.forEach((student) => {
      newSelection[student.id] = checked
    })
    setRowSelection(newSelection)
  }

  const handleSelectRow = (studentId: string, checked: boolean) => {
    setRowSelection((prev) => ({
      ...prev,
      [studentId]: checked,
    }))
  }

  const selectedCount = Object.values(rowSelection).filter(Boolean).length
  const isAllSelected = paginatedStudents.length > 0 && paginatedStudents.every((s) => rowSelection[s.id])

  const renderStudentTable = () => {
    if (paginatedStudents.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          {activeTab === "all" && searchTerm
            ? "No students found matching your search."
            : activeTab === "all"
              ? "No students registered yet. Register your first student to get started."
              : activeTab === "enrolled"
                ? "No enrolled students found."
                : "All students are enrolled in classes."}
        </div>
      )
    }

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-12">SN</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Current Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map((student: any, index: number) => {
              const activeEnrollment = student.student_enrollments?.find((e: any) => e.is_active)
              const isSelected = rowSelection[student.id] || false

              return (
                <TableRow
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  data-state={isSelected && "selected"}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} className="px-2 py-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectRow(student.id, !!checked)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground px-2 py-2">{startIndex + index + 1}</TableCell>
                  <TableCell className="font-medium px-2 py-2">{student.student_id}</TableCell>
                  <TableCell className="px-2 py-2">
                    {student.first_name} {student.last_name}
                  </TableCell>
                  <TableCell className="px-2 py-2">{student.gender}</TableCell>
                  <TableCell className="px-2 py-2">
                    {activeEnrollment?.class?.name || (
                      <span className="text-muted-foreground italic ">Not Enrolled</span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <Badge variant={student.status === "Active" ? "default" : "secondary"}>{student.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right px-2 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {activeSession && activeTerm && (
                        <Link
                          href={`/assessments/results/${student.id}?session=${activeSession.id}&term=${activeTerm.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Print Report Card"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      {(userRole === "admin" || userRole === "super_admin") && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditStudent(student)
                            }}
                            title="Edit Student"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteStudentId(student.id)
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </>
    )
  }

  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between gap-4 mt-6 px-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {tabData.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, tabData.length)} of{" "}
            {tabData.length} students
          </span>
          {selectedCount > 0 && <span className="text-sm text-muted-foreground">({selectedCount} selected)</span>}
          <Select value={rowsPerPage.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
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
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name or student ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Students ({filteredStudents.length})</TabsTrigger>
                <TabsTrigger value="enrolled">Enrolled ({enrolledStudents.length})</TabsTrigger>
                <TabsTrigger value="not-enrolled">Not Enrolled ({notEnrolledStudents.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {renderStudentTable()}
                {renderPagination()}
              </TabsContent>

              <TabsContent value="enrolled" className="mt-4">
                {renderStudentTable()}
                {renderPagination()}
              </TabsContent>

              <TabsContent value="not-enrolled" className="mt-4">
                {renderStudentTable()}
                {renderPagination()}
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
        userRole={userRole}
        guardians={guardians}
      />

      {deleteStudentId && (
        <DeleteStudentDialog
          studentId={deleteStudentId}
          open={!!deleteStudentId}
          onOpenChange={(open) => {
            if (!open) setDeleteStudentId(null)
          }}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          guardians={guardians}
          open={!!editStudent}
          onOpenChange={(open) => {
            if (!open) setEditStudent(null)
          }}
        />
      )}
    </>
  )
}
