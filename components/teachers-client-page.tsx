"use client"

import { useState } from "react"
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

interface TeachersClientPageProps {
  initialTeachers: any[]
}

export function TeachersClientPage({ initialTeachers }: TeachersClientPageProps) {
  const [teachers, setTeachers] = useState(initialTeachers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null)
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null)

  const handleViewTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId)
    setSheetOpen(true)
  }

  const handleSheetClose = () => {
    setSheetOpen(false)
    setSelectedTeacherId(null)
  }

  const handleTeacherUpdated = (updatedTeacher: any) => {
    setTeachers((prev) => prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)))
  }

  const handleTeacherDeleted = (teacherId: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId))
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      teacher.first_name?.toLowerCase().includes(searchLower) ||
      teacher.last_name?.toLowerCase().includes(searchLower) ||
      teacher.staff_id?.toLowerCase().includes(searchLower) ||
      teacher.email?.toLowerCase().includes(searchLower)
    )
  })

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
                        <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>{teacher.status}</Badge>
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
