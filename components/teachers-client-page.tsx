"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  CalendarRange,
  Plus,
  UserCheck,
  UserX,
  Loader2,
  XCircle,
  Settings,
  BookOpen,
  Check,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { TeacherDetailsSheet } from "@/components/teacher-details-sheet"
import { EditTeacherDialog } from "@/components/edit-teacher-dialog"
import { DeleteTeacherDialog } from "@/components/delete-teacher-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddStaffModal } from "@/components/add-staff-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  assignClassTeacher,
  unassignClassTeacher,
  assignSubjectTeacher,
  removeSubjectTeacher,
  addSubjectToClass,
  removeSubjectFromClass,
} from "@/app/(dashboard)/classes/[id]/actions"

interface TeachersClientPageProps {
  initialTeachers: any[]
  totalCount: number
  classes: any[]
  classSubjects: any[]
  allSubjects: any[]
  classAssignments: any[]
  subjectAssignments: any[]
  sessionId: string
}

export function TeachersClientPage({
  initialTeachers,
  totalCount,
  classes,
  classSubjects,
  allSubjects,
  classAssignments,
  subjectAssignments,
  sessionId,
}: TeachersClientPageProps) {
  const router = useRouter()
  const [teachers, setTeachers] = useState(initialTeachers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null)
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  // Assignments Tab States
  const [assignmentTeacherSearch, setAssignmentTeacherSearch] = useState("")
  const [activeTeacherFilter, setActiveTeacherFilter] = useState<string | null>(null)
  const [activeSchoolTab, setActiveSchoolTab] = useState<"islamiyya" | "tahfeez">("islamiyya")

  // Teacher Picker Dialog State
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<"class" | "subject">("class")
  const [targetClassId, setTargetClassId] = useState<string | null>(null)
  const [targetSubjectId, setTargetSubjectId] = useState<string | null>(null)
  const [targetCurrentTeacherId, setTargetCurrentTeacherId] = useState<string | null>(null)
  const [pickerSearch, setPickerSearch] = useState("")
  const [pickerLoading, setPickerLoading] = useState(false)

  // Manage Subjects Modal State
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [manageClassId, setManageClassId] = useState<string | null>(null)
  const [manageLoading, setManageLoading] = useState(false)

  // Multi-select Add Subjects Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addSubjectSearch, setAddSubjectSearch] = useState("")
  const [selectedSubjectsToAdd, setSelectedSubjectsToAdd] = useState<Record<string, boolean>>({})
  const [addSubjectsLoading, setAddSubjectsLoading] = useState(false)

  // Directory KPI Calculations
  const totalTeachersCount = teachers.length
  const activeCount = teachers.filter((u) => u.status === "Active").length
  const inactiveCount = teachers.filter((u) => u.status === "Inactive").length
  const leaveCount = teachers.filter((u) => u.status === "On Leave").length

  // Filter teachers for Directory
  const filteredTeachers = teachers.filter((teacher) => {
    const search = searchTerm.toLowerCase()
    return (
      teacher.first_name?.toLowerCase().includes(search) ||
      teacher.last_name?.toLowerCase().includes(search) ||
      teacher.staff_id?.toLowerCase().includes(search) ||
      teacher.email?.toLowerCase().includes(search) ||
      teacher.phone?.toLowerCase().includes(search)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
    setRowSelection({})
  }, [searchTerm])

  useEffect(() => {
    setTeachers(initialTeachers)
  }, [initialTeachers])

  const handleSheetClose = () => {
    setSelectedTeacherId(null)
  }

  const handleTeacherDeleted = (teacherId: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId))
    setDeleteTeacherId(null)
  }

  const handleRowClick = (teacherId: string) => {
    setSelectedTeacherId(teacherId)
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

  const handleRowsPerPageChange = (size: string) => {
    setRowsPerPage(Number.parseInt(size))
    setCurrentPage(1)
  }

  const allSelected = paginatedTeachers.length > 0 && paginatedTeachers.every((u) => rowSelection[u.id])

  // Map assignments for direct lookup
  const subjectTeachersMap = useMemo(() => {
    const map = new Map<string, string>() // `${classId}-${subjectId}` -> teacherId
    subjectAssignments.forEach((sa) => {
      map.set(`${sa.class_id}-${sa.subject_id}`, sa.teacher_id)
    })
    return map
  }, [subjectAssignments])

  // Teacher Workload statistics & Section tags mapping
  const teacherStats = useMemo(() => {
    const statsMap = new Map<string, { workload: number; sections: Set<string> }>()

    teachers.forEach((t) => {
      statsMap.set(t.id, { workload: 0, sections: new Set<string>() })
    })

    classes.forEach((c) => {
      if (c.class_teacher_id && statsMap.has(c.class_teacher_id)) {
        const stats = statsMap.get(c.class_teacher_id)!
        stats.workload += 1
        const sectionName = c.section?.name?.toLowerCase() || ""
        if (sectionName.includes("islamiyya") || sectionName.includes("combined")) {
          stats.sections.add("Islamiyya")
        }
        if (sectionName.includes("tahfeez") || sectionName.includes("combined")) {
          stats.sections.add("Tahfeez")
        }
      }
    })

    subjectAssignments.forEach((sa) => {
      if (sa.teacher_id && statsMap.has(sa.teacher_id)) {
        const stats = statsMap.get(sa.teacher_id)!
        stats.workload += 1
        const cls = classes.find((c) => c.id === sa.class_id)
        if (cls) {
          const sectionName = cls.section?.name?.toLowerCase() || ""
          if (sectionName.includes("islamiyya") || sectionName.includes("combined")) {
            stats.sections.add("Islamiyya")
          }
          if (sectionName.includes("tahfeez") || sectionName.includes("combined")) {
            stats.sections.add("Tahfeez")
          }
        }
      }
    })

    return statsMap
  }, [teachers, classes, subjectAssignments])

  // Sidebar teacher search
  const assignmentSidebarTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const search = assignmentTeacherSearch.toLowerCase()
      return (
        t.first_name?.toLowerCase().includes(search) ||
        t.last_name?.toLowerCase().includes(search) ||
        t.staff_id?.toLowerCase().includes(search)
      )
    })
  }, [teachers, assignmentTeacherSearch])

  // Classes list filtered by shift tab & active teacher filter
  const filteredClasses = useMemo(() => {
    let list = classes.filter((cls) => {
      const sectionName = cls.section?.name?.toLowerCase() || ""
      if (activeSchoolTab === "islamiyya") {
        return sectionName.includes("islamiyya") && !sectionName.includes("combined")
      } else {
        return sectionName.includes("tahfeez") && !sectionName.includes("combined")
      }
    })

    if (activeTeacherFilter) {
      list = list.filter((cls) => {
        if (cls.class_teacher_id === activeTeacherFilter) return true
        return subjectAssignments.some(
          (sa) => sa.class_id === cls.id && sa.teacher_id === activeTeacherFilter
        )
      })
    }

    return list
  }, [classes, activeSchoolTab, activeTeacherFilter, subjectAssignments])

  // Helper to open teacher picker
  const openTeacherPicker = (
    mode: "class" | "subject",
    classId: string,
    subjectId: string | null = null,
    currentTeacherId: string | null = null
  ) => {
    setPickerMode(mode)
    setTargetClassId(classId)
    setTargetSubjectId(subjectId)
    setTargetCurrentTeacherId(currentTeacherId)
    setPickerSearch("")
    setPickerOpen(true)
  }

  // Assign/Unassign class or subject teacher
  const handleAssignTeacher = async (teacherId: string | null) => {
    if (!targetClassId) return

    setPickerLoading(true)
    try {
      if (pickerMode === "class") {
        if (teacherId === null) {
          if (targetCurrentTeacherId) {
            await unassignClassTeacher(targetClassId, targetCurrentTeacherId)
            toast.success("Class teacher unassigned")
          }
        } else {
          await assignClassTeacher(targetClassId, teacherId, sessionId)
          toast.success("Class teacher assigned")
        }
      } else {
        if (targetSubjectId) {
          if (teacherId === null) {
            await removeSubjectTeacher(targetClassId, targetSubjectId, sessionId)
            toast.success("Reset to Class Teacher fallback")
          } else {
            await assignSubjectTeacher(targetClassId, teacherId, targetSubjectId, sessionId)
            toast.success("Subject teacher assigned")
          }
        }
      }
      setPickerOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update assignment")
    } finally {
      setPickerLoading(false)
    }
  }

  // Manage subjects modal handlers
  const openManageSubjectsModal = (classId: string) => {
    setManageClassId(classId)
    setManageModalOpen(true)
  }

  const handleRemoveSubjectFromClass = async (classSubjectId: string) => {
    if (!manageClassId) return
    setManageLoading(true)
    try {
      await removeSubjectFromClass(classSubjectId, manageClassId)
      toast.success("Subject removed from class")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove subject")
    } finally {
      setManageLoading(false)
    }
  }

  // Open multi-select modal
  const openAddSubjectsModal = () => {
    setSelectedSubjectsToAdd({})
    setAddSubjectSearch("")
    setAddModalOpen(true)
  }

  // Execute multi-select add subjects to class
  const handleAddSelectedSubjects = async () => {
    if (!manageClassId) return
    const idsToAdd = Object.keys(selectedSubjectsToAdd).filter((id) => selectedSubjectsToAdd[id])
    if (idsToAdd.length === 0) {
      toast.error("Please select at least one subject to add")
      return
    }

    setAddSubjectsLoading(true)
    try {
      await Promise.all(
        idsToAdd.map((subId) => addSubjectToClass(manageClassId, subId, 100, 40))
      )
      toast.success(`Successfully added ${idsToAdd.length} ${idsToAdd.length === 1 ? "subject" : "subjects"} to class`)
      setAddModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to add selected subjects")
    } finally {
      setAddSubjectsLoading(false)
    }
  }

  // Filtered teachers list inside picker
  const filteredPickerTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const search = pickerSearch.toLowerCase()
      return (
        t.first_name?.toLowerCase().includes(search) ||
        t.last_name?.toLowerCase().includes(search) ||
        t.staff_id?.toLowerCase().includes(search)
      )
    })
  }, [teachers, pickerSearch])

  // Get teacher full name helper
  const getTeacherName = (id: string | null) => {
    if (!id) return null
    const t = teachers.find((x) => x.id === id)
    return t ? `${t.first_name} ${t.last_name}` : null
  }

  // Get subjects assigned to manageClassId
  const currentManagedClassSubjects = useMemo(() => {
    if (!manageClassId) return []
    return classSubjects.filter((cs) => cs.class_id === manageClassId)
  }, [manageClassId, classSubjects])

  // Get unassigned master subjects available to add to manageClassId
  const availableMasterSubjectsToAdd = useMemo(() => {
    if (!manageClassId) return []
    const existingSubjectIds = new Set(
      currentManagedClassSubjects.map((cs) => cs.subject?.id).filter(Boolean)
    )
    return allSubjects.filter((s) => !existingSubjectIds.has(s.id))
  }, [manageClassId, currentManagedClassSubjects, allSubjects])

  // Filter available master subjects by search
  const filteredMasterSubjectsToAdd = useMemo(() => {
    return availableMasterSubjectsToAdd.filter((s) => {
      const search = addSubjectSearch.toLowerCase()
      return s.name.toLowerCase().includes(search) || s.code?.toLowerCase().includes(search)
    })
  }, [availableMasterSubjectsToAdd, addSubjectSearch])

  const currentManagedClass = classes.find((c) => c.id === manageClassId)

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden -mb-4 pb-0">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1">
        <div>
          <h1 className="text-xl font-black tracking-tight">Teachers Management</h1>
          <p className="text-xs text-muted-foreground">Manage teacher profiles, classroom assignments, and teaching schedules</p>
        </div>
        <AddStaffModal />
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="directory" className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] shrink-0 mb-3">
          <TabsTrigger value="directory" className="font-semibold text-xs">Teachers Directory</TabsTrigger>
          <TabsTrigger value="assignments" className="font-semibold text-xs">Class & Subject Assignments</TabsTrigger>
        </TabsList>

        {/* TAB 1: DIRECTORY */}
        <TabsContent value="directory" className="flex-1 overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border bg-card text-card-foreground shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Total Teachers</span>
                <p className="text-xl font-bold mt-0.5">{totalTeachersCount}</p>
              </div>
              <GraduationCap className="h-5 w-5 text-muted-foreground/40" />
            </div>

            <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Active</span>
                <p className="text-xl font-bold mt-0.5 text-emerald-700 dark:text-emerald-300">{activeCount}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500/40" />
            </div>

            <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">On Leave</span>
                <p className="text-xl font-bold mt-0.5 text-amber-700 dark:text-amber-300">{leaveCount}</p>
              </div>
              <CalendarRange className="h-5 w-5 text-amber-500/40" />
            </div>

            <div className="p-3 rounded-xl border bg-zinc-500/5 border-zinc-500/20 text-zinc-950 dark:text-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Inactive</span>
                <p className="text-xl font-bold mt-0.5 text-muted-foreground">{inactiveCount}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-zinc-500/40" />
            </div>
          </div>

          {/* Directory Card */}
          <Card className="shadow-none border">
            <CardContent className="p-3.5 space-y-3">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search teachers, email, phone..."
                    className="pl-8 h-9 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Table */}
              {paginatedTeachers.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  {searchTerm ? "No teachers found matching your criteria." : "No teachers registered yet."}
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
                          <TableHead className="h-8 text-[11px] font-bold px-2">Status</TableHead>
                          <TableHead className="h-8 text-[11px] font-bold text-right px-2">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTeachers.map((teacher: any, index: number) => (
                          <TableRow
                            key={teacher.id}
                            onClick={() => handleRowClick(teacher.id)}
                            className="h-9 cursor-pointer hover:bg-muted/50 text-xs transition-colors"
                          >
                            <TableCell className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={rowSelection[teacher.id] || false}
                                onCheckedChange={(checked) => handleSelectRow(teacher.id, checked as boolean)}
                                className="h-3.5 w-3.5"
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1 font-mono text-[11px] text-muted-foreground">{startIndex + index + 1}</TableCell>
                            <TableCell className="px-2 py-1 font-semibold text-xs">{teacher.staff_id || "-"}</TableCell>
                            <TableCell className="px-2 py-1 font-bold min-w-40">
                              {teacher.first_name} {teacher.last_name}
                            </TableCell>
                            <TableCell className="px-2 py-1 text-muted-foreground text-xs">{teacher.phone || "-"}</TableCell>
                            <TableCell className="px-2 py-1 text-muted-foreground text-xs max-w-[180px] truncate">{teacher.email || "-"}</TableCell>
                            <TableCell className="px-2 py-1">
                              <Badge variant={teacher.status === "Active" ? "default" : "secondary"} className="text-[10px] h-5 py-0">
                                {teacher.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2 py-1 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditTeacherId(teacher.id)
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
                                    setDeleteTeacherId(teacher.id)
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
                        Showing {filteredTeachers.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredTeachers.length)} of{" "}
                        {filteredTeachers.length} teachers
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
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                      </Button>
                      <span className="text-muted-foreground min-w-[60px] text-center">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ASSIGNMENTS (NON-SCROLLING PARENT + INDIVIDUAL SLEEK SCROLLBARS) */}
        <TabsContent value="assignments" className="flex-1 min-h-0 overflow-hidden pt-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full items-stretch overflow-hidden">
            
            {/* Sidebar: Teacher Load Cards (Individual Scroll & Light Bg) */}
            <div className="md:col-span-1 flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 p-3 rounded-t-xl rounded-b-none border border-b-0 h-full overflow-hidden">
              <div className="space-y-1 shrink-0 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Search Teachers</span>
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name..."
                    className="pl-7 h-8 text-[11px]"
                    value={assignmentTeacherSearch}
                    onChange={(e) => setAssignmentTeacherSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                {assignmentSidebarTeachers.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-4">No teachers found</p>
                ) : (
                  assignmentSidebarTeachers.map((t) => {
                    const stats = teacherStats.get(t.id) || { workload: 0, sections: new Set<string>() }
                    const isActive = activeTeacherFilter === t.id

                    return (
                      <div
                        key={t.id}
                        onClick={() => setActiveTeacherFilter(isActive ? null : t.id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          isActive
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-xs"
                            : "bg-background/80 hover:bg-muted/50 text-foreground border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <p className={`text-xs font-bold ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                          {t.first_name} {t.last_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {stats.workload} {stats.workload === 1 ? "assignment" : "assignments"}
                        </p>

                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {Array.from(stats.sections).map((sec) => (
                            <Badge
                              key={sec}
                              variant="secondary"
                              className={`text-[9px] px-1.5 py-0 h-4 font-semibold ${
                                sec === "Islamiyya"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-950"
                                  : "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-950"
                              }`}
                            >
                              {sec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Main Board: Classes Grid (Individual Scroll & Sleek Muted Bg) */}
            <div className="md:col-span-3 flex flex-col bg-zinc-50/40 dark:bg-zinc-950/20 p-3 rounded-t-xl rounded-b-none border border-b-0 h-full overflow-hidden">
              <div className="shrink-0 space-y-2 pb-2">
                {/* Filter notification bar */}
                {activeTeacherFilter && (
                  <div className="flex items-center justify-between p-2 px-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4" />
                      Filtering classes taught by: {getTeacherName(activeTeacherFilter)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTeacherFilter(null)}
                      className="h-6 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Clear Filter
                    </Button>
                  </div>
                )}

                {/* Class Tabs Selector */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex bg-muted/60 p-0.5 rounded-lg border gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSchoolTab("islamiyya")}
                      className={`h-7 px-3 text-[11px] font-bold rounded-md ${
                        activeSchoolTab === "islamiyya" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Islamiyya Classes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSchoolTab("tahfeez")}
                      className={`h-7 px-3 text-[11px] font-bold rounded-md ${
                        activeSchoolTab === "tahfeez" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Tahfeez Classes
                    </Button>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Showing {filteredClasses.length} {filteredClasses.length === 1 ? "class" : "classes"}
                  </span>
                </div>
              </div>

              {/* Class Cards Grid Scroll Area */}
              <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                {filteredClasses.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-xl bg-card">
                    <XCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3.5" />
                    <h4 className="text-sm font-bold text-foreground">No Classes Found</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                      {activeTeacherFilter ? (
                        <>
                          The selected teacher has no assignments under the <span className="capitalize font-semibold">{activeSchoolTab}</span> shift.
                          {teacherStats.get(activeTeacherFilter)?.sections.has(activeSchoolTab === "islamiyya" ? "Tahfeez" : "Islamiyya") && (
                            <span className="block mt-2 font-semibold text-emerald-600 dark:text-emerald-400">
                              👉 Click on <button onClick={() => setActiveSchoolTab(activeSchoolTab === "islamiyya" ? "tahfeez" : "islamiyya")} className="underline font-bold hover:text-emerald-700">{activeSchoolTab === "islamiyya" ? "Tahfeez Classes" : "Islamiyya Classes"}</button> tab above to view their assigned classes.
                            </span>
                          )}
                        </>
                      ) : (
                        "No active classes have been registered under this school shift."
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
                  {filteredClasses.map((cls) => {
                    const classTeacherName = getTeacherName(cls.class_teacher_id)

                    const offeredSubjects = classSubjects
                      .filter((cs) => cs.class_id === cls.id)
                      .map((cs) => cs.subject)
                      .filter(Boolean)
                      .filter((sub) => {
                        const type = sub.school_type?.toLowerCase() || ""
                        if (activeSchoolTab === "islamiyya") {
                          return type === "islamiyya" || type === ""
                        } else {
                          return type === "tahfeez"
                        }
                      })

                    return (
                      <Card key={cls.id} className="shadow-sm border flex flex-col justify-between bg-white dark:bg-zinc-900">
                        <div>
                          {/* Class Header */}
                          <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                            <span className="font-bold text-xs">{cls.name}</span>
                            <Badge
                              className={`text-[9px] px-1.5 py-0 h-4 font-semibold ${
                                cls.section?.name?.toLowerCase().includes("combined")
                                  ? "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-950"
                                  : cls.section?.name?.toLowerCase().includes("tahfeez")
                                    ? "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-950"
                                    : "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-950"
                              }`}
                            >
                              {cls.section?.name || "School"}
                            </Badge>
                          </div>

                          {/* Class Teacher Card Block */}
                          <div className="p-3">
                            <div className="p-2.5 rounded-lg border bg-background/50 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                                Class Teacher
                              </span>
                              {classTeacherName ? (
                                <button
                                  onClick={() => openTeacherPicker("class", cls.id, null, cls.class_teacher_id)}
                                  className="w-full text-left text-xs font-bold text-foreground hover:text-emerald-500 transition-colors flex items-center justify-between"
                                >
                                  {classTeacherName}
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => openTeacherPicker("class", cls.id, null, null)}
                                  className="w-full text-left text-[11px] font-semibold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Assign Class Teacher
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Subjects Section with Manage Button */}
                          <div className="px-3 pb-3 space-y-2 flex-1">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground pb-1">
                              <div className="flex items-center gap-2">
                                <span>Subjects</span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => openManageSubjectsModal(cls.id)}
                                  className="h-auto p-0 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                                >
                                  Manage
                                </Button>
                              </div>
                              <span>{offeredSubjects.length} Lessons</span>
                            </div>

                            {offeredSubjects.length === 0 ? (
                              <div className="text-center py-4 border border-dashed rounded-lg bg-muted/20">
                                <p className="text-[10px] text-muted-foreground italic mb-2">
                                  No subjects mapped under this shift.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openManageSubjectsModal(cls.id)}
                                  className="h-6 text-[10px] px-2 font-semibold"
                                >
                                  + Add Subjects
                                </Button>
                              </div>
                            ) : (
                              /* SUBJECTS LIST (MAX 5 ITEMS THEN SLEEK SCROLL) */
                              <div className="space-y-1.5 max-h-[195px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                                {offeredSubjects.map((sub) => {
                                  const customTeacherId = subjectTeachersMap.get(`${cls.id}-${sub.id}`) || null
                                  const subjectTeacherName = getTeacherName(customTeacherId)

                                  let displayName = "Unassigned"
                                  let isFallback = false

                                  if (subjectTeacherName) {
                                    displayName = subjectTeacherName
                                  } else if (classTeacherName) {
                                    displayName = classTeacherName
                                    isFallback = true
                                  }

                                  return (
                                    <div
                                      key={sub.id}
                                      onClick={() => openTeacherPicker("subject", cls.id, sub.id, customTeacherId || null)}
                                      className="flex items-center justify-between p-2 rounded-lg border bg-background/30 hover:bg-muted/30 cursor-pointer transition-all text-xs"
                                    >
                                      <span className="font-medium text-muted-foreground text-[11px]">
                                        {sub.name}
                                      </span>
                                      
                                      {displayName === "Unassigned" ? (
                                        <span className="text-[10px] font-semibold text-red-500 bg-red-500/5 px-1.5 py-0.5 rounded border border-dashed border-red-500/20">
                                          Unassigned
                                        </span>
                                      ) : (
                                        <span
                                          className={`text-[11px] font-bold flex items-center gap-1 ${
                                            isFallback ? "text-muted-foreground font-semibold" : "text-emerald-600 dark:text-emerald-400"
                                          }`}
                                        >
                                          {displayName}
                                          {isFallback && <span className="text-[9px] font-normal text-zinc-400 dark:text-zinc-600">(Class Teacher)</span>}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Directory Dialogs */}
      <TeacherDetailsSheet
        teacherId={selectedTeacherId}
        open={selectedTeacherId !== null}
        onOpenChange={(open) => !open && setSelectedTeacherId(null)}
      />

      <EditTeacherDialog
        teacherId={editTeacherId || ""}
        open={editTeacherId !== null}
        onOpenChange={(open) => !open && setEditTeacherId(null)}
        onSuccess={() => router.refresh()}
      />

      <DeleteTeacherDialog
        teacherId={deleteTeacherId || ""}
        teacher={teachers.find((t) => t.id === deleteTeacherId)}
        open={deleteTeacherId !== null}
        onOpenChange={(open) => !open && setDeleteTeacherId(null)}
        onSuccess={handleTeacherDeleted}
      />

      {/* REUSABLE SELECT_TEACHER DIALOG */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {pickerMode === "class" ? "Assign Class Teacher" : "Assign Subject Teacher"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {pickerMode === "class"
                ? "Assign a teacher to lead this classroom"
                : "Assign a teacher to lead this subject"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search teachers by name..."
                  className="pl-7 h-8 text-[11px]"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                />
              </div>
              
              {pickerMode === "subject" && targetCurrentTeacherId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-red-500 hover:text-red-600 flex items-center gap-1 border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                  onClick={() => handleAssignTeacher(null)}
                  disabled={pickerLoading}
                >
                  {pickerLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserX className="h-3.5 w-3.5" /> Use Class Teacher
                    </>
                  )}
                </Button>
              )}

              {pickerMode === "class" && targetCurrentTeacherId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-red-500 hover:text-red-600 flex items-center gap-1 border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                  onClick={() => handleAssignTeacher(null)}
                  disabled={pickerLoading}
                >
                  {pickerLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserX className="h-3.5 w-3.5" /> Unassign
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 bg-background/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredPickerTeachers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">No teachers match your search</p>
              ) : (
                filteredPickerTeachers.map((t) => {
                  const isCurrent = targetCurrentTeacherId === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleAssignTeacher(t.id)}
                      disabled={pickerLoading}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-muted/40 transition-colors ${
                        isCurrent ? "bg-emerald-500/5 font-bold" : ""
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}>
                          {t.first_name} {t.last_name}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{t.staff_id || "-"}</span>
                      </div>
                      
                      {isCurrent && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-950 text-[9px] px-1.5 py-0 h-4 font-semibold">
                          Current
                        </Badge>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MANAGE CLASS SUBJECTS MODAL */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="max-w-lg p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center justify-between">
              <span>Manage Subjects — {currentManagedClass?.name}</span>
              <Button
                variant="default"
                size="sm"
                onClick={openAddSubjectsModal}
                className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Subjects
              </Button>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add or remove subjects offered by this class.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="max-h-[320px] overflow-y-auto border rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 bg-background/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              {currentManagedClassSubjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No subjects assigned to this class yet. Click <strong>+ Add Subjects</strong> above to attach subjects.
                </div>
              ) : (
                currentManagedClassSubjects.map((cs) => (
                  <div key={cs.id} className="p-2.5 flex items-center justify-between hover:bg-muted/30 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{cs.subject?.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Code: {cs.subject?.code || "-"} · Shift: <span className="capitalize">{cs.subject?.school_type || "Islamiyya"}</span>
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSubjectFromClass(cs.id)}
                      disabled={manageLoading}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MULTI-SELECT ADD SUBJECTS MODAL */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Add Subjects to Class</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select multiple subjects to attach to {currentManagedClass?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search master subjects..."
                className="pl-8 h-8 text-xs"
                value={addSubjectSearch}
                onChange={(e) => setAddSubjectSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[280px] overflow-y-auto border rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 bg-background/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredMasterSubjectsToAdd.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">
                  {addSubjectSearch ? "No matching subjects found" : "All available system subjects are already added to this class."}
                </p>
              ) : (
                filteredMasterSubjectsToAdd.map((sub) => {
                  const isChecked = !!selectedSubjectsToAdd[sub.id]
                  return (
                    <div
                      key={sub.id}
                      onClick={() =>
                        setSelectedSubjectsToAdd((prev) => ({
                          ...prev,
                          [sub.id]: !prev[sub.id],
                        }))
                      }
                      className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Checkbox checked={isChecked} className="h-3.5 w-3.5" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{sub.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {sub.code || "-"} · Shift: <span className="capitalize">{sub.school_type || "Islamiyya"}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground font-semibold">
              {Object.values(selectedSubjectsToAdd).filter(Boolean).length} selected
            </span>
            <Button
              variant="default"
              size="sm"
              onClick={handleAddSelectedSubjects}
              disabled={addSubjectsLoading || Object.values(selectedSubjectsToAdd).filter(Boolean).length === 0}
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              {addSubjectsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Add Selected Subjects
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
