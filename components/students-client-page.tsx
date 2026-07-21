"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Trash2, Pencil, ChevronLeft, ChevronRight, Printer, Users, GraduationCap, UserCheck, CheckCircle2, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RegisterStudentModal } from "@/components/register-student-modal"
import { StudentDetailsSheet } from "@/components/student-details-sheet"
import { DeleteStudentDialog } from "@/components/delete-student-dialog"
import { EditStudentModal } from "@/components/edit-student-modal"
import { BulkAddStudentsModal } from "@/components/bulk-add-students-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentsClientPageProps {
  initialStudents: any[]
  guardians: any[]
  sessions: any[]
  terms: any[]
  classes: any[]
  sections?: any[]
  userRole: string
}

export function StudentsClientPage({
  initialStudents,
  guardians,
  sessions,
  terms,
  classes,
  sections = [],
  userRole,
}: StudentsClientPageProps) {
  const [students] = useState(initialStudents)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  const activeSession = sessions.find((s) => s.is_active)
  const activeTerm = terms.find((t) => t.is_active && t.session_id === activeSession?.id)
  
  const [filterTab, setFilterTab] = useState<string>("all")
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [editStudent, setEditStudent] = useState<any | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  // KPI Calculations
  const totalStudents = students.length
  const enrolledCount = students.filter((s) => s.student_enrollments?.some((e: any) => e.is_active)).length
  const maleCount = students.filter((s) => s.gender?.toLowerCase() === "male").length
  const femaleCount = students.filter((s) => s.gender?.toLowerCase() === "female").length
  const activeCount = students.filter((s) => s.status === "Active").length

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      student.first_name?.toLowerCase().includes(search) ||
      student.last_name?.toLowerCase().includes(search) ||
      student.student_id?.toLowerCase().includes(search) ||
      student.student_enrollments?.some((e: any) => e.class?.name?.toLowerCase().includes(search))

    let matchesFilter = true
    if (filterTab === "enrolled") {
      matchesFilter = student.student_enrollments?.some((e: any) => e.is_active)
    } else if (filterTab === "not-enrolled") {
      matchesFilter = !student.student_enrollments || !student.student_enrollments.some((e: any) => e.is_active)
    } else if (filterTab === "male") {
      matchesFilter = student.gender?.toLowerCase() === "male"
    } else if (filterTab === "female") {
      matchesFilter = student.gender?.toLowerCase() === "female"
    }

    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
    setRowSelection({})
  }, [searchTerm, filterTab])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection: Record<string, boolean> = {}
      paginatedStudents.forEach((student) => {
        newSelection[student.id] = true
      })
      setRowSelection(newSelection)
    } else {
      setRowSelection({})
    }
  }

  const handleSelectRow = (studentId: string, checked: boolean) => {
    setRowSelection((prev) => ({
      ...prev,
      [studentId]: checked,
    }))
  }

  const handleRowsPerPageChange = (size: string) => {
    setRowsPerPage(Number.parseInt(size))
    setCurrentPage(1)
  }

  const allSelected = paginatedStudents.length > 0 && paginatedStudents.every((s) => rowSelection[s.id])
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  return (
    <>
      <div className="flex flex-1 flex-col gap-3">
        {/* Header & Add Button */}
        <div className="flex mt-3 flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight">Students Directory</h1>
            <p className="text-xs text-muted-foreground">
              {userRole === "teacher"
                ? "View students in your assigned classes"
                : "Manage student records, class enrollments, and academic status"}
            </p>
          </div>
          {userRole !== "teacher" && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setBulkImportOpen(true)}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-medium border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Bulk Import
              </Button>
              <RegisterStudentModal guardians={guardians} />
            </div>
          )}
        </div>

        {/* Compact KPI Row (5 Cards matching Users Page) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Total Students
              </span>
              <p className="text-xl font-bold mt-0.5">{totalStudents}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground/40" />
          </div>

          <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Enrolled
              </span>
              <p className="text-xl font-bold mt-0.5 text-emerald-700 dark:text-emerald-300">{enrolledCount}</p>
            </div>
            <GraduationCap className="h-5 w-5 text-emerald-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-blue-500/5 border-blue-500/20 text-blue-950 dark:text-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                Male
              </span>
              <p className="text-xl font-bold mt-0.5 text-blue-700 dark:text-blue-300">{maleCount}</p>
            </div>
            <UserCheck className="h-5 w-5 text-blue-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-purple-500/5 border-purple-500/20 text-purple-950 dark:text-purple-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                Female
              </span>
              <p className="text-xl font-bold mt-0.5 text-purple-700 dark:text-purple-300">{femaleCount}</p>
            </div>
            <UserCheck className="h-5 w-5 text-purple-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-sky-500/5 border-sky-500/20 text-sky-950 dark:text-sky-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                Active Status
              </span>
              <p className="text-xl font-bold mt-0.5 text-sky-700 dark:text-sky-300">{activeCount}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-sky-500/40" />
          </div>
        </div>

        {/* Main Content Area */}
        <Card className="shadow-none border">
          <CardContent className="p-3.5 space-y-3">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex h-9 items-center rounded-lg border bg-muted/40 p-1 gap-1 overflow-x-auto scrollbar-none">
                {[
                  { id: "all", label: `All (${students.length})` },
                  { id: "enrolled", label: `Enrolled (${enrolledCount})` },
                  { id: "not-enrolled", label: `Not Enrolled (${totalStudents - enrolledCount})` },
                  { id: "male", label: `Male (${maleCount})` },
                  { id: "female", label: `Female (${femaleCount})` },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterTab(item.id)}
                    className={cn(
                      "h-full px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                      filterTab === item.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name, ID, class..."
                  className="pl-8 h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* High-Density Compact Table */}
            {paginatedStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {searchTerm || filterTab !== "all"
                  ? "No students found matching your search criteria."
                  : "No students registered yet."}
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="h-8 hover:bg-transparent">
                        <TableHead className="w-9 h-8 px-2">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                            className="h-3.5 w-3.5"
                          />
                        </TableHead>
                        <TableHead className="w-10 h-8 text-[11px] font-bold px-2">SN</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Student ID</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold min-w-40 px-2">Name</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Gender</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Current Class</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Status</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold text-right px-2">Actions</TableHead>
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
                            className="h-9 cursor-pointer hover:bg-muted/50 text-xs transition-colors"
                            data-state={isSelected && "selected"}
                          >
                            <TableCell className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectRow(student.id, checked as boolean)}
                                className="h-3.5 w-3.5"
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1 font-mono text-[11px] text-muted-foreground">
                              {startIndex + index + 1}
                            </TableCell>
                            <TableCell className="px-2 py-1 font-semibold text-xs">{student.student_id || "-"}</TableCell>
                            <TableCell className="px-2 py-1 font-bold min-w-40">
                              {student.first_name} {student.last_name}
                            </TableCell>
                            <TableCell className="px-2 py-1 text-muted-foreground text-xs">{student.gender || "-"}</TableCell>
                            <TableCell className="px-2 py-1 font-medium">
                              {activeEnrollment?.class?.name ? (
                                <Badge variant="outline" className="text-[10px] h-5 py-0 font-normal">
                                  {activeEnrollment.class.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[11px] italic">Not Enrolled</span>
                              )}
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              <Badge
                                variant={student.status === "Active" ? "default" : "secondary"}
                                className="text-[10px] h-5 py-0"
                              >
                                {student.status || "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2 py-1 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {activeSession && activeTerm && (
                                  <Link
                                    href={`/assessments/results/${student.id}?session=${activeSession.id}&term=${activeTerm.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                      title="Print Report Card"
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                  </Link>
                                )}
                                {(userRole === "admin" || userRole === "super_admin") && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditStudent(student)
                                      }}
                                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                                      title="Edit Student"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteStudentId(student.id)
                                      }}
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                      title="Delete Student"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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
                </div>

                {/* Compact Pagination Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
                    </span>
                    {selectedCount > 0 && <span className="font-semibold text-foreground">({selectedCount} selected)</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-2">
                      <span className="text-muted-foreground">Rows per page:</span>
                      <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                        <SelectTrigger className="h-7 w-16 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 15, 25, 50, 100].map((size) => (
                            <SelectItem key={size} value={size.toString()} className="text-xs">
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>

                    <span className="font-semibold px-1">
                      {currentPage} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
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

      <BulkAddStudentsModal
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        sections={sections}
        existingClasses={classes}
        onSuccess={() => {
          // Window reload or state refresh handled by server action revalidatePath
          window.location.reload()
        }}
      />
    </>
  )
}
