"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { TeacherDetailsSheet } from "@/components/teacher-details-sheet"
import { EditTeacherDialog } from "@/components/edit-teacher-dialog"
import { DeleteTeacherDialog } from "@/components/delete-teacher-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UsersClientPageProps {
  initialUsers: any[]
  totalCount: number
}

export function UsersClientPage({ initialUsers, totalCount }: UsersClientPageProps) {
  const [users] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase()
    return (
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.staff_id?.toLowerCase().includes(search)
    )
  })

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
    setRowSelection({})
  }, [searchTerm])

  const handleRowClick = (userId: string) => {
    setSelectedUserId(userId)
  }

  const handleSheetClose = () => {
    setSelectedUserId(null)
  }

  const handleUserUpdated = () => {
    window.location.reload()
  }

  const handleUserDeleted = () => {
    window.location.reload()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection: Record<string, boolean> = {}
      paginatedUsers.forEach((user) => {
        newSelection[user.id] = true
      })
      setRowSelection(newSelection)
    } else {
      setRowSelection({})
    }
  }

  const handleSelectRow = (userId: string, checked: boolean) => {
    setRowSelection((prev) => ({
      ...prev,
      [userId]: checked,
    }))
  }

  const handleRowsPerPageChange = (size: string) => {
    setRowsPerPage(Number.parseInt(size))
    setCurrentPage(1)
  }

  const allSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => rowSelection[u.id])
  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between gap-4 mt-6 px-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {filteredUsers.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of{" "}
            {filteredUsers.length} users
          </span>
          {selectedCount > 0 && <span className="text-sm text-muted-foreground">({selectedCount} selected)</span>}
          <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
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
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
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
            <h1 className="text-3xl font-bold tracking-tight">Users & Staff</h1>
            <p className="text-muted-foreground">Manage admin, accounting, cashier, and other staff accounts</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Non-Teaching Staff</CardTitle>
            <CardDescription>View and search all registered admin and support staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name or staff ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {paginatedUsers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {searchTerm
                  ? "No users found matching your search."
                  : "No non-teaching staff registered yet."}
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
                      <TableHead className="min-w-48">Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user: any, index: number) => (
                      <TableRow
                        key={user.id}
                        onClick={() => handleRowClick(user.id)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={rowSelection[user.id] || false}
                            onCheckedChange={(checked) => handleSelectRow(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">{user.staff_id}</TableCell>
                        <TableCell className="min-w-48">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditUserId(user.id)
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
                                setDeleteUserId(user.id)
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
                {renderPagination()}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <TeacherDetailsSheet
        teacherId={selectedUserId}
        open={selectedUserId !== null}
        onOpenChange={(open) => {
          if (!open) handleSheetClose()
        }}
      />

      {editUserId && (
        <EditTeacherDialog
          teacherId={editUserId}
          open={!!editUserId}
          onOpenChange={(open) => {
            if (!open) setEditUserId(null)
          }}
          onSuccess={handleUserUpdated}
        />
      )}

      {deleteUserId && (
        <DeleteTeacherDialog
          teacherId={deleteUserId}
          open={!!deleteUserId}
          onOpenChange={(open) => {
            if (!open) setDeleteUserId(null)
          }}
          onSuccess={handleUserDeleted}
        />
      )}
    </>
  )
}
