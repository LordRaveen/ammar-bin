"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Trash2, Pencil } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AddTeacherModal } from "@/components/add-teacher-modal"
import { TeacherDetailsSheet } from "@/components/teacher-details-sheet"
import { EditTeacherDialog } from "@/components/edit-teacher-dialog"
import { DeleteTeacherDialog } from "@/components/delete-teacher-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TeachersClientPageProps {
  initialTeachers: any[]
  totalCount: number
}

export function TeachersClientPage({ initialTeachers, totalCount }: TeachersClientPageProps) {
  const [teachers] = useState(initialTeachers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null)
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filteredTeachers = teachers.filter((teacher) => {
    const search = searchTerm.toLowerCase()
    return (
      teacher.first_name?.toLowerCase().includes(search) ||
      teacher.last_name?.toLowerCase().includes(search) ||
      teacher.email?.toLowerCase().includes(search) ||
      teacher.staff_id?.toLowerCase().includes(search)
    )
  })

  const totalPages = Math.ceil(filteredTeachers.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
    setRowSelection({})
  }, [searchTerm])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleRowsPerPageChange = (size: string) => {
    setRowsPerPage(Number.parseInt(size))
    setCurrentPage(1)
  }

  const handleRowClick = (teacherId: string) => {
    setSelectedTeacherId(teacherId)
    setSheetOpen(true)
  }

  const handleSheetClose = () => {
    setSheetOpen(false)
    setSelectedTeacherId(null)
  }

  const handleTeacherUpdated = () => {
    window.location.reload()
  }

  const handleTeacherDeleted = () => {
    window.location.reload()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection: Record<string, boolean> = {}
      paginatedTeachers.forEach((teacher) => {
        newSelection[teacher.id] = true
      })
      setRowSelection(newSelection)
    } else {
      setRowSelection({})
    }
  }

  const handleSelectRow = (teacherId: string, checked: boolean) => {
    setRowSelection((prev) => ({
      ...prev,
      [teacherId]: checked,
    }))
  }

  const allSelected = paginatedTeachers.length > 0 && paginatedTeachers.every((t) => rowSelection[t.id])

  return (
    <>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teachers & Staff</h1>
            <p className="text-muted-foreground">Manage teaching staff and user accounts</p>
          </div>
          <AddTeacherModal />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Teachers</CardTitle>
            <CardDescription>View and search all registered teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, staff ID, or email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {paginatedTeachers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {searchTerm
                  ? "No teachers found matching your search."
                  : "No teachers registered yet. Add your first teacher to get started."}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                      </TableHead>
                      <TableHead className="w-12">SN</TableHead>
                      <TableHead>Staff ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTeachers.map((teacher: any, index: number) => (
                      <TableRow
                        key={teacher.id}
                        onClick={() => handleRowClick(teacher.id)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={rowSelection[teacher.id] || false}
                            onCheckedChange={(checked) => handleSelectRow(teacher.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">{teacher.staff_id}</TableCell>
                        <TableCell>
                          {teacher.first_name} {teacher.last_name}
                        </TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>{teacher.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{teacher.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                            {teacher.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditTeacherId(teacher.id)
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTeacherId(teacher.id)
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredTeachers.length)} of{" "}
                      {filteredTeachers.length} teachers
                    </span>
                    <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
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

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      {"<<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      {"<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {">"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      {">>"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <TeacherDetailsSheet teacherId={selectedTeacherId} open={sheetOpen} onOpenChange={handleSheetClose} />

      {editTeacherId && (
        <EditTeacherDialog
          teacherId={editTeacherId}
          open={!!editTeacherId}
          onOpenChange={(open) => {
            if (!open) setEditTeacherId(null)
          }}
          onSuccess={handleTeacherUpdated}
        />
      )}

      {deleteTeacherId && (
        <DeleteTeacherDialog
          teacherId={deleteTeacherId}
          teacher={teachers.find((t) => t.id === deleteTeacherId)}
          open={!!deleteTeacherId}
          onOpenChange={(open) => {
            if (!open) setDeleteTeacherId(null)
          }}
          onSuccess={handleTeacherDeleted}
        />
      )}
    </>
  )
}
