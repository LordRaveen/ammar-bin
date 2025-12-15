"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Trash2, Pencil } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RegisterStudentModal } from "@/components/register-student-modal"
import { StudentDetailsSheet } from "@/components/student-details-sheet"
import { DeleteStudentDialog } from "@/components/delete-student-dialog"
import { EditStudentModal } from "@/components/edit-student-modal"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StudentsClientPageProps {
  initialStudents: any[]
  guardians: any[]
  sessions: any[]
  terms: any[]
  classes: any[]
  userRole: string
  totalCount: number
  currentPage: number
  pageSize: number
}

export function StudentsClientPage({
  initialStudents,
  guardians,
  sessions,
  terms,
  classes,
  userRole,
  totalCount,
  currentPage,
  pageSize,
}: StudentsClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [editStudent, setEditStudent] = useState<any | null>(null)
  const allStudents = initialStudents

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const handlePageSizeChange = (size: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pageSize", size)
    params.set("page", "1") // Reset to first page
    router.push(`?${params.toString()}`)
  }

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
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudentId(student.id)}>
                      View
                    </Button>
                    {(userRole === "admin" || userRole === "super_admin") && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditStudent(student)}
                          title="Edit Student"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteStudentId(student.id)}
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
    )
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages = []
      const showEllipsis = totalPages > 7

      if (!showEllipsis) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, "ellipsis", totalPages)
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
        } else {
          pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages)
        }
      }

      return pages
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
            students
          </span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-24">
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

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => handlePageChange(page as number)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
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
                {renderPagination()}
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
        userRole={userRole}
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
