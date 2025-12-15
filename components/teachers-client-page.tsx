"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Pencil, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AddTeacherModal } from "@/components/add-teacher-modal"
import { TeacherDetailsSheet } from "@/components/teacher-details-sheet"
import { EditTeacherDialog } from "@/components/edit-teacher-dialog"
import { DeleteTeacherDialog } from "@/components/delete-teacher-dialog"
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

interface TeachersClientPageProps {
  initialTeachers: any[]
  totalCount: number
  currentPage: number
  pageSize: number
}

export function TeachersClientPage({ initialTeachers, totalCount, currentPage, pageSize }: TeachersClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teachers = initialTeachers
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null)
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const handlePageSizeChange = (size: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pageSize", size)
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const handleViewTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId)
    setSheetOpen(true)
  }

  const handleSheetClose = () => {
    setSheetOpen(false)
    setSelectedTeacherId(null)
  }

  const handleTeacherUpdated = (updatedTeacher: any) => {
    window.location.reload()
  }

  const handleTeacherDeleted = (teacherId: string) => {
    window.location.reload()
  }

  const filteredTeachers = teachers

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
            teachers
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

            {filteredTeachers.length === 0 ? (
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
                    {filteredTeachers.map((teacher: any) => (
                      <TableRow key={teacher.id}>
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
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewTeacher(teacher.id)}>
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditTeacherId(teacher.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTeacherId(teacher.id)}
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
                {renderPagination()}
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
