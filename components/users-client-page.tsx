"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, Users, Shield, GraduationCap, Wallet, CheckCircle2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { TeacherDetailsSheet } from "@/components/teacher-details-sheet"
import { EditTeacherDialog } from "@/components/edit-teacher-dialog"
import { DeleteTeacherDialog } from "@/components/delete-teacher-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddStaffModal } from "@/components/add-staff-modal"
import { cn } from "@/lib/utils"

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
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [roleFilter, setRoleFilter] = useState("all")

  // KPI Calculations
  const totalStaff = users.length
  const teacherCount = users.filter((u) => u.role?.toLowerCase() === "teacher").length
  const adminCount = users.filter((u) => ["admin", "super_admin", "administrator"].includes(u.role?.toLowerCase())).length
  const financeCount = users.filter((u) => ["accountant", "cashier"].includes(u.role?.toLowerCase())).length
  const activeCount = users.filter((u) => u.status === "Active").length

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = (
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.staff_id?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search)
    )

    let matchesRole = true
    if (roleFilter === "teachers") {
      matchesRole = user.role?.toLowerCase() === "teacher"
    } else if (roleFilter === "admins") {
      matchesRole = ["admin", "super_admin", "administrator"].includes(user.role?.toLowerCase())
    } else if (roleFilter === "finance") {
      matchesRole = ["accountant", "cashier"].includes(user.role?.toLowerCase())
    } else if (roleFilter === "principals") {
      matchesRole = user.role?.toLowerCase() === "principal"
    }

    return matchesSearch && matchesRole
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
    setRowSelection({})
  }, [searchTerm, roleFilter])

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

  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase()
    if (r === "admin" || r === "administrator" || r === "super_admin") {
      return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[10px] h-5 py-0">Admin</Badge>
    }
    if (r === "teacher") {
      return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] h-5 py-0">Teacher</Badge>
    }
    if (r === "accountant") {
      return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] h-5 py-0">Accountant</Badge>
    }
    if (r === "cashier") {
      return <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 text-[10px] h-5 py-0">Cashier</Badge>
    }
    if (r === "principal") {
      return <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[10px] h-5 py-0">Principal</Badge>
    }
    return <Badge variant="outline" className="text-[10px] h-5 py-0 capitalize">{role}</Badge>
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-3">
        {/* Header & Add Button */}
        <div className="flex mt-3 flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight">Staff & Users Directory</h1>
            <p className="text-xs text-sm text-muted-foreground">Manage all school staff accounts, roles, and system access</p>
          </div>
          <AddStaffModal />
        </div>

        {/* Compact KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Total Staff</span>
              <p className="text-xl font-bold mt-0.5">{totalStaff}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground/40" />
          </div>

          <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Teachers</span>
              <p className="text-xl font-bold mt-0.5 text-emerald-700 dark:text-emerald-300">{teacherCount}</p>
            </div>
            <GraduationCap className="h-5 w-5 text-emerald-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-purple-500/5 border-purple-500/20 text-purple-950 dark:text-purple-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">Admins</span>
              <p className="text-xl font-bold mt-0.5 text-purple-700 dark:text-purple-300">{adminCount}</p>
            </div>
            <Shield className="h-5 w-5 text-purple-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Finance</span>
              <p className="text-xl font-bold mt-0.5 text-amber-700 dark:text-amber-300">{financeCount}</p>
            </div>
            <Wallet className="h-5 w-5 text-amber-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-blue-500/5 border-blue-500/20 text-blue-950 dark:text-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Active Accounts</span>
              <p className="text-xl font-bold mt-0.5 text-blue-700 dark:text-blue-300">{activeCount}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-blue-500/40" />
          </div>
        </div>

        {/* Main Content Area */}
        <Card className="shadow-none border">
          <CardContent className="p-3.5 space-y-3">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Role Segmented Filter */}
              <div className="flex h-9 items-center rounded-lg border bg-muted/40 p-1 gap-1">
                {[
                  { id: "all", label: "All Staff" },
                  { id: "teachers", label: "Teachers" },
                  { id: "admins", label: "Admins" },
                  { id: "finance", label: "Finance" },
                  { id: "principals", label: "Principals" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRoleFilter(item.id)}
                    className={cn(
                      "h-full px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                      roleFilter === item.id
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
                  placeholder="Search staff, email, phone..."
                  className="pl-8 h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* High-Density Compact Table */}
            {paginatedUsers.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {searchTerm || roleFilter !== "all"
                  ? "No staff found matching your criteria."
                  : "No staff registered yet."}
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="h-8 hover:bg-transparent">
                        <TableHead className="w-9 h-8 px-2">
                          <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} className="h-3.5 w-3.5" />
                        </TableHead>
                        <TableHead className="w-10 h-8 text-[11px] font-bold px-2">SN</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Staff ID</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold min-w-40 px-2">Name</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Phone</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Email</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Role</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold px-2">Status</TableHead>
                        <TableHead className="h-8 text-[11px] font-bold text-right px-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user: any, index: number) => (
                        <TableRow
                          key={user.id}
                          onClick={() => handleRowClick(user.id)}
                          className="h-9 cursor-pointer hover:bg-muted/50 text-xs transition-colors"
                        >
                          <TableCell className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={rowSelection[user.id] || false}
                              onCheckedChange={(checked) => handleSelectRow(user.id, checked as boolean)}
                              className="h-3.5 w-3.5"
                            />
                          </TableCell>
                          <TableCell className="px-2 py-1 font-mono text-[11px] text-muted-foreground">{startIndex + index + 1}</TableCell>
                          <TableCell className="px-2 py-1 font-semibold text-xs">{user.staff_id || "-"}</TableCell>
                          <TableCell className="px-2 py-1 font-bold min-w-40">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell className="px-2 py-1 text-muted-foreground text-xs">{user.phone || "-"}</TableCell>
                          <TableCell className="px-2 py-1 text-muted-foreground text-xs max-w-[180px] truncate">{user.email || "-"}</TableCell>
                          <TableCell className="px-2 py-1">{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="px-2 py-1">
                            <Badge variant={user.status === "Active" ? "default" : "secondary"} className="text-[10px] h-5 py-0">
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-1 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditUserId(user.id)
                                }}
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteUserId(user.id)
                                }}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between gap-4 pt-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground whitespace-nowrap">
                      Showing {filteredUsers.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of{" "}
                      {filteredUsers.length} staff
                    </span>
                    <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[15, 30, 50, 100].map((size) => (
                          <SelectItem key={size} value={size.toString()} className="text-xs">
                            {size} / page
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="font-semibold text-xs px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
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
