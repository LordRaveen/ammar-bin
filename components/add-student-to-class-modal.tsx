"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addStudentsToClass } from "@/app/(dashboard)/classes/[id]/actions"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Search, Loader2, X, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface Student {
  id: string
  student_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  gender: string
  created_at: string
  student_enrollments: Array<{
    id: string
    class_id: string
    session_id: string
    term_id: string
    class: {
      id: string
      name: string
      section_id: string
      section: {
        id: string
        name: string
      }
    }
  }>
}

interface AddStudentToClassModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  sessionId: string
  termId: string
  unenrolledStudents?: any[]
}

function GenderIcon({ gender }: { gender: string }) {
  const isMale = gender?.toLowerCase() === "male"
  const isFemale = gender?.toLowerCase() === "female"

  if (isMale) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center text-blue-500 dark:text-blue-400 hover:opacity-80 cursor-default">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <circle cx="10" cy="14" r="5" />
              <line x1="19" y1="5" x2="13.6" y2="10.4" />
              <polyline points="15 5 19 5 19 9" />
            </svg>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-[10px] font-semibold">Male</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  if (isFemale) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center text-rose-500 dark:text-rose-400 hover:opacity-80 cursor-default">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <circle cx="12" cy="9" r="5" />
              <line x1="12" y1="14" x2="12" y2="21" />
              <line x1="9" y1="18" x2="15" y2="18" />
            </svg>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-[10px] font-semibold">Female</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return null
}

const DEFAULT_FILTERS = {
  enrollmentStatus: "not-enrolled", // Default: Not Enrolled in Session
  gender: "all",
  classId: "all",
  sectionId: "all",
  dateFilter: "all",
}

export function AddStudentToClassModal({
  open,
  onOpenChange,
  classId,
  sessionId,
  termId,
}: AddStudentToClassModalProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  // Data Loading States
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Selection & Action States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  // Load students, classes, and sections on open
  useEffect(() => {
    if (!open) return

    async function loadData() {
      setLoadingData(true)
      try {
        const [studentsRes, classesRes, sectionsRes] = await Promise.all([
          supabase
            .from("students")
            .select(`
              id,
              student_id,
              first_name,
              middle_name,
              last_name,
              gender,
              created_at,
              student_enrollments(
                id,
                class_id,
                session_id,
                term_id,
                class:classes(id, name, section_id, section:sections(id, name))
              )
            `)
            .eq("status", "Active")
            .is("deleted_at", null),
          supabase
            .from("classes")
            .select("id, name, section_id")
            .eq("is_active", true)
            .order("name"),
          supabase
            .from("sections")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),
        ])

        if (studentsRes.error) throw studentsRes.error
        if (classesRes.error) throw classesRes.error
        if (sectionsRes.error) throw sectionsRes.error

        setStudents(studentsRes.data || [])
        setClasses(classesRes.data || [])
        setSections(sectionsRes.data || [])
      } catch (err) {
        console.error("Failed to load students list:", err)
        toast.error("Error loading students list")
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [open, sessionId, termId])

  const isFiltered = useMemo(() => {
    return (
      filters.enrollmentStatus !== "not-enrolled" ||
      filters.classId !== "all" ||
      filters.sectionId !== "all" ||
      filters.gender !== "all" ||
      filters.dateFilter !== "all" ||
      searchQuery.trim() !== ""
    )
  }, [filters, searchQuery])

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchQuery("")
  }

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. Search Query
      const fullName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.toLowerCase()
      const studentId = (student.student_id || "").toLowerCase()
      const queryLower = searchQuery.toLowerCase().trim()

      const searchMatches =
        !queryLower ||
        fullName.includes(queryLower) ||
        studentId.includes(queryLower)

      if (!searchMatches) return false

      // Find enrollment in current session/term
      const currentEnrollment = student.student_enrollments?.find(
        (e: any) => e.session_id === sessionId && e.term_id === termId
      )

      // 2. Enrollment Status Filter
      if (filters.enrollmentStatus === "not-enrolled") {
        if (currentEnrollment) return false
      } else if (filters.enrollmentStatus === "enrolled-other") {
        if (!currentEnrollment) return false
        if (currentEnrollment.class_id === classId) return false
      } else if (filters.enrollmentStatus === "all") {
        if (currentEnrollment && currentEnrollment.class_id === classId) return false
      }

      // 3. Gender Filter
      if (filters.gender !== "all" && student.gender !== filters.gender) {
        return false
      }

      // 4. Class Filter (only relevant if enrolled somewhere else)
      if (filters.classId !== "all") {
        if (!currentEnrollment || currentEnrollment.class_id !== filters.classId) {
          return false
        }
      }

      // 5. Section Filter (only relevant if enrolled somewhere else)
      if (filters.sectionId !== "all") {
        if (!currentEnrollment || currentEnrollment.class?.section_id !== filters.sectionId) {
          return false
        }
      }

      // 6. Registered Date Filter
      if (filters.dateFilter !== "all" && student.created_at) {
        const regDate = new Date(student.created_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - regDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (filters.dateFilter === "today" && diffDays > 1) return false
        if (filters.dateFilter === "week" && diffDays > 7) return false
        if (filters.dateFilter === "month" && diffDays > 30) return false
        if (filters.dateFilter === "year" && diffDays > 365) return false
      }

      return true
    })
  }, [students, searchQuery, filters, classId, sessionId, termId])

  // Handle master toggle checkbox (checks/unchecks all filtered items)
  const isAllSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false
    return filteredStudents.every((s) => selectedIds.has(s.id))
  }, [filteredStudents, selectedIds])

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedIds)
    filteredStudents.forEach((s) => {
      if (checked) {
        newSelected.add(s.id)
      } else {
        newSelected.delete(s.id)
      }
    })
    setSelectedIds(newSelected)
  }

  const handleSelectStudent = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  // Handle modal submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.size === 0) return

    setLoading(true)
    try {
      const idsArray = Array.from(selectedIds)
      await addStudentsToClass(idsArray, classId, sessionId, termId)
      
      toast.success("Students Added!", {
        description: `Successfully enrolled ${idsArray.length} student(s) into this class.`,
      })
      
      onOpenChange(false)
      setSelectedIds(new Set())
      router.refresh()
    } catch (error: any) {
      console.error("Failed to add students:", error)
      toast.error("Failed to add students to class", {
        description: error?.message || "An unexpected error occurred.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl w-full p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-black uppercase">Add Students to Class</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search, filter, and multiselect students to enroll them in this class.
          </DialogDescription>
        </DialogHeader>

        {/* Single-Row Filters Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1 min-w-[170px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Name, Admission Id"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-[125px]">
            <Select
              value={filters.enrollmentStatus}
              onValueChange={(val: any) => {
                setFilters((prev) => ({
                  ...prev,
                  enrollmentStatus: val,
                  classId: val === "not-enrolled" ? "all" : prev.classId,
                  sectionId: val === "not-enrolled" ? "all" : prev.sectionId,
                }))
              }}
            >
              <SelectTrigger className="h-8 text-[11px] font-medium rounded-xl border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-enrolled">Not Enrolled</SelectItem>
                <SelectItem value="enrolled-other">Enrolled</SelectItem>
                <SelectItem value="all">All Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Class Dropdown */}
          <div className="w-[120px]">
            <Select
              value={filters.classId}
              onValueChange={(val: any) => setFilters((prev) => ({ ...prev, classId: val }))}
              disabled={filters.enrollmentStatus === "not-enrolled"}
            >
              <SelectTrigger className="h-8 text-[11px] font-medium rounded-xl border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Dropdown */}
          <div className="w-[115px]">
            <Select
              value={filters.sectionId}
              onValueChange={(val: any) => setFilters((prev) => ({ ...prev, sectionId: val }))}
              disabled={filters.enrollmentStatus === "not-enrolled"}
            >
              <SelectTrigger className="h-8 text-[11px] font-medium rounded-xl border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gender Dropdown */}
          <div className="w-[105px]">
            <Select
              value={filters.gender}
              onValueChange={(val: any) => setFilters((prev) => ({ ...prev, gender: val }))}
            >
              <SelectTrigger className="h-8 text-[11px] font-medium rounded-xl border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Added Dropdown */}
          <div className="w-[110px]">
            <Select
              value={filters.dateFilter}
              onValueChange={(val: any) => setFilters((prev) => ({ ...prev, dateFilter: val }))}
            >
              <SelectTrigger className="h-8 text-[11px] font-medium rounded-xl border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              title="Reset all filters"
              className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Selection Banner */}
        {selectedIds.size > 0 && (
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-primary">{selectedIds.size} student(s) selected</span>
              <span className="text-muted-foreground text-[10px]">(selections persist across searches & filters)</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-6 text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {/* Compact Students Table */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto bg-card">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-xs border-b border-zinc-200 dark:border-zinc-800">
              <TableRow className="h-9 hover:bg-transparent">
                <TableHead className="w-10 text-center px-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="w-12 text-center text-[11px] font-bold text-muted-foreground px-2">
                  SN
                </TableHead>
                <TableHead className="text-[11px] font-bold px-3">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-bold px-3 w-32">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-bold px-3 w-28">
                  Date added
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingData ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground font-semibold">Loading student database...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground">
                    No matching students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => {
                  const currentEnrollment = student.student_enrollments?.find(
                    (e: any) => e.session_id === sessionId && e.term_id === termId
                  )
                  const isSelected = selectedIds.has(student.id)

                  return (
                    <TableRow 
                      key={student.id}
                      className={`h-11 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors ${
                        isSelected ? "bg-primary/5 dark:bg-primary/10" : ""
                      }`}
                    >
                      <TableCell className="text-center px-2 py-1.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold text-muted-foreground px-2 py-1.5">
                        {index + 1}
                      </TableCell>
                      <TableCell className="px-3 py-1.5">
                        <div className="flex flex-col justify-center">
                          <span className="text-xs font-bold text-foreground leading-tight">
                            {student.first_name} {student.middle_name || ""} {student.last_name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground font-medium">
                              {student.student_id}
                            </span>
                            <GenderIcon gender={student.gender} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-1.5 text-xs">
                        {currentEnrollment ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200/50">
                            {currentEnrollment.class?.name || "Enrolled"}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200/50">
                            Not Enrolled
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-1.5 text-[11px] text-muted-foreground font-medium">
                        {student.created_at ? format(new Date(student.created_at), "dd MMM yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal Actions */}
        <form onSubmit={handleSubmit} className="flex items-center justify-between gap-2 mt-1">
          <span className="text-xs text-muted-foreground font-medium">
            {filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"} total
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 rounded-xl text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedIds.size === 0} className="h-9 rounded-xl text-xs font-bold">
              {loading ? "Adding..." : `Add Selected Students (${selectedIds.size})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
