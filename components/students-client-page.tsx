"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Search,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Printer,
  Users,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  SlidersHorizontal,
  X,
  ChevronDown,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RegisterStudentModal } from "@/components/register-student-modal"
import { StudentDetailsSheet } from "@/components/student-details-sheet"
import { DeleteStudentDialog } from "@/components/delete-student-dialog"
import { EditStudentModal } from "@/components/edit-student-modal"
import { BulkAddStudentsModal } from "@/components/bulk-add-students-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { type DateRange } from "react-day-picker"
import { format } from "date-fns"

interface StudentsClientPageProps {
  initialStudents: any[]
  guardians: any[]
  sessions: any[]
  terms: any[]
  classes: any[]
  sections?: any[]
  userRole: string
}

interface Filters {
  gender: string        // "all" | "Male" | "Female"
  sectionId: string     // "all" | section id
  classId: string       // "all" | class id
  status: string        // "all" | "Active" | "Inactive"
  enrolled: string      // "all" | "enrolled" | "not-enrolled"
  hasGuardian: string   // "all" | "yes" | "no"
  dateRange: DateRange | undefined
  ageMin: string
  ageMax: string
  enrollmentTypes: string[]
}

const DEFAULT_FILTERS: Filters = {
  gender: "all",
  sectionId: "all",
  classId: "all",
  status: "all",
  enrolled: "all",
  hasGuardian: "all",
  dateRange: undefined,
  ageMin: "",
  ageMax: "",
  enrollmentTypes: ["islamiyya", "tahfeez", "combined"],
}

function countActiveFilters(filters: Filters): number {
  return Object.entries(filters).filter(([k, v]) => {
    if (k === "dateRange") return v !== undefined
    if (k === "enrollmentTypes") return (v as string[]).length < 3
    return v !== "all" && v !== ""
  }).length
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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [editStudent, setEditStudent] = useState<any | null>(null)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  // Derive unique sections/classes from the passed classes prop
  const uniqueSections = sections
  const filteredClassesBySection = useMemo(() => {
    if (filters.sectionId === "all") return classes
    return classes.filter((c) => c.section_id === filters.sectionId)
  }, [classes, filters.sectionId])

  // KPI Calculations
  const totalStudents = students.length
  const enrolledCount = students.filter((s) => s.student_enrollments?.some((e: any) => e.is_active)).length
  const maleCount = students.filter((s) => s.gender?.toLowerCase() === "male").length
  const femaleCount = students.filter((s) => s.gender?.toLowerCase() === "female").length
  const activeCount = students.filter((s) => s.status === "Active").length

  const activeFilterCount = countActiveFilters(filters)

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const search = searchTerm.toLowerCase()

      // Search
      const matchesSearch =
        !searchTerm ||
        student.first_name?.toLowerCase().includes(search) ||
        student.last_name?.toLowerCase().includes(search) ||
        student.student_id?.toLowerCase().includes(search) ||
        student.student_enrollments?.some((e: any) => e.class?.name?.toLowerCase().includes(search))

      // Quick tab (all / enrolled / not-enrolled)
      let matchesTab = true
      if (filterTab === "enrolled") {
        matchesTab = student.student_enrollments?.some((e: any) => e.is_active)
      } else if (filterTab === "not-enrolled") {
        matchesTab = !student.student_enrollments || !student.student_enrollments.some((e: any) => e.is_active)
      }

      // Gender filter
      const matchesGender =
        filters.gender === "all" || student.gender?.toLowerCase() === filters.gender.toLowerCase()

      // Status filter
      const matchesStatus =
        filters.status === "all" || student.status === filters.status

      // Enrolled filter (from popover)
      let matchesEnrolled = true
      if (filters.enrolled === "enrolled") {
        matchesEnrolled = student.student_enrollments?.some((e: any) => e.is_active)
      } else if (filters.enrolled === "not-enrolled") {
        matchesEnrolled =
          !student.student_enrollments || !student.student_enrollments.some((e: any) => e.is_active)
      }

      // Section filter — find if ANY active enrollment matches the section
      const matchesSection =
        filters.sectionId === "all" ||
        (student.student_enrollments?.some((e: any) => e.is_active && e.class?.section_id === filters.sectionId) ?? false)

      // Class filter — find if ANY active enrollment matches the class
      const matchesClass =
        filters.classId === "all" ||
        (student.student_enrollments?.some((e: any) => e.is_active && e.class_id === filters.classId) ?? false)

      // Guardian filter
      const hasGuardian =
        student.guardians && student.guardians.length > 0
      const matchesGuardian =
        filters.hasGuardian === "all" ||
        (filters.hasGuardian === "yes" && hasGuardian) ||
        (filters.hasGuardian === "no" && !hasGuardian)

      // Date added range
      let matchesDateAdded = true
      if (filters.dateRange && student.created_at) {
        const created = new Date(student.created_at)
        const from = filters.dateRange.from ? new Date(filters.dateRange.from) : null
        const to = filters.dateRange.to ? new Date(filters.dateRange.to) : null

        if (from) {
          from.setHours(0, 0, 0, 0)
          if (created < from) matchesDateAdded = false
        }
        if (to) {
          to.setHours(23, 59, 59, 999)
          if (created > to) matchesDateAdded = false
        }
      }

      // Age range
      let matchesAge = true
      if ((filters.ageMin || filters.ageMax) && student.date_of_birth) {
        const dob = new Date(student.date_of_birth)
        const now = new Date()
        const ageYears = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        if (filters.ageMin && ageYears < Number(filters.ageMin)) matchesAge = false
        if (filters.ageMax && ageYears > Number(filters.ageMax)) matchesAge = false
      }

      // Enrollment type match
      const matchesEnrollmentType = filters.enrollmentTypes.includes(student.enrollment_type || "islamiyya")

      return (
        matchesSearch &&
        matchesTab &&
        matchesGender &&
        matchesStatus &&
        matchesEnrolled &&
        matchesSection &&
        matchesClass &&
        matchesGuardian &&
        matchesDateAdded &&
        matchesAge &&
        matchesEnrollmentType
      )
    })
  }, [students, searchTerm, filterTab, filters])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
    setRowSelection({})
  }, [searchTerm, filterTab, filters])

  // If section changes in filter, reset class
  const handleSectionChange = (sectionId: string) => {
    setFilters((prev) => ({ ...prev, sectionId, classId: "all" }))
  }

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

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
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

        {/* KPI Row */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="p-3 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Total Students
              </span>
              <p className="text-xl font-bold mt-0.5">{totalStudents}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground/40" />
          </div>

          <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Enrolled
              </span>
              <p className="text-xl font-bold mt-0.5 text-emerald-700 dark:text-emerald-300">{enrolledCount}</p>
            </div>
            <GraduationCap className="h-5 w-5 text-emerald-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-blue-500/5 border-blue-500/20 text-blue-950 dark:text-blue-100 flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                Male
              </span>
              <p className="text-xl font-bold mt-0.5 text-blue-700 dark:text-blue-300">{maleCount}</p>
            </div>
            <UserCheck className="h-5 w-5 text-blue-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-purple-500/5 border-purple-500/20 text-purple-950 dark:text-purple-100 flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                Female
              </span>
              <p className="text-xl font-bold mt-0.5 text-purple-700 dark:text-purple-300">{femaleCount}</p>
            </div>
            <UserCheck className="h-5 w-5 text-purple-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-sky-500/5 border-sky-500/20 text-sky-950 dark:text-sky-100 flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
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
              {/* Quick Tabs */}
              <div className="flex h-9 items-center rounded-lg border bg-muted/40 p-1 gap-1">
                {[
                  { id: "all", label: `All (${students.length})` },
                  { id: "enrolled", label: `Enrolled (${enrolledCount})` },
                  { id: "not-enrolled", label: `Not Enrolled (${totalStudents - enrolledCount})` },
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

              {/* Right controls: search + filter */}
              <div className="flex items-center gap-2">
                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search name, ID, class..."
                    className="pl-8 h-9 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filter Popover */}
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 gap-1.5 text-xs font-medium relative",
                        activeFilterCount > 0 && "border-primary text-primary"
                      )}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {activeFilterCount}
                        </span>
                      )}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 flex flex-col" style={{ maxHeight: "min(90vh, 580px)" }} align="end">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                      <span className="text-sm font-semibold">Filter Students</span>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                      {/* Gender */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Gender</Label>
                        <div className="flex gap-2 flex-wrap">
                          {["all", "Male", "Female"].map((g) => (
                            <button
                              key={g}
                              onClick={() => setFilters((prev) => ({ ...prev, gender: g }))}
                              className={cn(
                                "px-3 py-1 text-xs rounded-full border font-medium transition-all",
                                filters.gender === g
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                              )}
                            >
                              {g === "all" ? "All" : g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Shift / Student Type */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Shift / Student Type</Label>
                        <div className="flex flex-col gap-1.5 pl-0.5">
                          {[
                            { id: "islamiyya", label: "Islamiyya" },
                            { id: "tahfeez", label: "Tahfeez" },
                            { id: "combined", label: "Combined (Dual)" },
                          ].map((t) => {
                            const isChecked = filters.enrollmentTypes.includes(t.id)
                            return (
                              <label key={t.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    setFilters((prev) => {
                                      const nextTypes = checked
                                        ? [...prev.enrollmentTypes, t.id]
                                        : prev.enrollmentTypes.filter((x) => x !== t.id)
                                      return { ...prev, enrollmentTypes: nextTypes }
                                    })
                                  }}
                                  className="h-3.5 w-3.5 data-[state=checked]:bg-emerald-650 data-[state=checked]:border-emerald-650"
                                />
                                {t.label}
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Section */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Section</Label>
                        <Select value={filters.sectionId} onValueChange={handleSectionChange}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All sections" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs">All Sections</SelectItem>
                            {uniqueSections.map((sec) => (
                              <SelectItem key={sec.id} value={sec.id} className="text-xs">
                                {sec.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Class */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Class</Label>
                        <Select
                          value={filters.classId}
                          onValueChange={(v) => setFilters((prev) => ({ ...prev, classId: v }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs">All Classes</SelectItem>
                            {filteredClassesBySection.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id} className="text-xs">
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Status */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Status</Label>
                        <div className="flex gap-2 flex-wrap">
                          {["all", "Active", "Inactive"].map((s) => (
                            <button
                              key={s}
                              onClick={() => setFilters((prev) => ({ ...prev, status: s }))}
                              className={cn(
                                "px-3 py-1 text-xs rounded-full border font-medium transition-all",
                                filters.status === s
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                              )}
                            >
                              {s === "all" ? "All" : s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Enrollment */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Enrollment</Label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { id: "all", label: "All" },
                            { id: "enrolled", label: "Enrolled" },
                            { id: "not-enrolled", label: "Not Enrolled" },
                          ].map((e) => (
                            <button
                              key={e.id}
                              onClick={() => setFilters((prev) => ({ ...prev, enrolled: e.id }))}
                              className={cn(
                                "px-3 py-1 text-xs rounded-full border font-medium transition-all",
                                filters.enrolled === e.id
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                              )}
                            >
                              {e.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Has Guardian */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Guardian Assigned</Label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { id: "all", label: "All" },
                            { id: "yes", label: "Has Guardian" },
                            { id: "no", label: "No Guardian" },
                          ].map((g) => (
                            <button
                              key={g.id}
                              onClick={() => setFilters((prev) => ({ ...prev, hasGuardian: g.id }))}
                              className={cn(
                                "px-3 py-1 text-xs rounded-full border font-medium transition-all",
                                filters.hasGuardian === g.id
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                              )}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Date Added */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground block">Date Added</Label>
                        <DateRangePicker
                          date={filters.dateRange}
                          setDate={(date) => setFilters((prev) => ({ ...prev, dateRange: date }))}
                        />
                      </div>

                      <Separator />

                      {/* Age Range */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Age Range (years)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="Min"
                            value={filters.ageMin}
                            onChange={(e) => setFilters((prev) => ({ ...prev, ageMin: e.target.value }))}
                            className="h-8 text-xs w-full"
                          />
                          <span className="text-muted-foreground text-xs shrink-0">to</span>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="Max"
                            value={filters.ageMax}
                            onChange={(e) => setFilters((prev) => ({ ...prev, ageMax: e.target.value }))}
                            className="h-8 text-xs w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer — sticky at bottom */}
                    <div className="px-4 py-3 border-t bg-muted/30 shrink-0">
                      <p className="text-[11px] text-muted-foreground text-center">
                        Showing <strong className="text-foreground">{filteredStudents.length}</strong> of {totalStudents} students
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filters.gender !== "all" && (
                  <FilterChip label={`Gender: ${filters.gender}`} onRemove={() => setFilters((p) => ({ ...p, gender: "all" }))} />
                )}
                {filters.sectionId !== "all" && (
                  <FilterChip
                    label={`Section: ${uniqueSections.find((s) => s.id === filters.sectionId)?.name ?? filters.sectionId}`}
                    onRemove={() => setFilters((p) => ({ ...p, sectionId: "all", classId: "all" }))}
                  />
                )}
                {filters.classId !== "all" && (
                  <FilterChip
                    label={`Class: ${classes.find((c) => c.id === filters.classId)?.name ?? filters.classId}`}
                    onRemove={() => setFilters((p) => ({ ...p, classId: "all" }))}
                  />
                )}
                {filters.status !== "all" && (
                  <FilterChip label={`Status: ${filters.status}`} onRemove={() => setFilters((p) => ({ ...p, status: "all" }))} />
                )}
                {filters.enrolled !== "all" && (
                  <FilterChip
                    label={filters.enrolled === "enrolled" ? "Enrolled" : "Not Enrolled"}
                    onRemove={() => setFilters((p) => ({ ...p, enrolled: "all" }))}
                  />
                )}
                {filters.hasGuardian !== "all" && (
                  <FilterChip
                    label={filters.hasGuardian === "yes" ? "Has Guardian" : "No Guardian"}
                    onRemove={() => setFilters((p) => ({ ...p, hasGuardian: "all" }))}
                  />
                )}
                {filters.dateRange && (
                  <FilterChip
                    label={`Added: ${
                      filters.dateRange.from
                        ? filters.dateRange.to
                          ? `${format(filters.dateRange.from, "LLL dd, y")} - ${format(filters.dateRange.to, "LLL dd, y")}`
                          : format(filters.dateRange.from, "LLL dd, y")
                        : "Any time"
                    }`}
                    onRemove={() => setFilters((p) => ({ ...p, dateRange: undefined }))}
                  />
                )}
                {(filters.ageMin || filters.ageMax) && (
                  <FilterChip
                    label={`Age: ${filters.ageMin || "0"}–${filters.ageMax || "∞"} yrs`}
                    onRemove={() => setFilters((p) => ({ ...p, ageMin: "", ageMax: "" }))}
                  />
                )}
              </div>
            )}

            {/* High-Density Compact Table */}
            {paginatedStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {searchTerm || filterTab !== "all" || activeFilterCount > 0
                  ? "No students found matching your criteria."
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
                            <TableCell className="px-2 py-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] h-5 py-0 font-normal",
                                  student.gender?.toLowerCase() === "female"
                                    ? "bg-pink-500/10 text-pink-700 border-pink-300 dark:text-pink-300 dark:border-pink-800"
                                    : "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-800"
                                )}
                              >
                                {student.gender || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2 py-1 font-medium">
                              {student.student_enrollments && student.student_enrollments.filter((e: any) => e.is_active).length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {student.student_enrollments
                                    .filter((e: any) => e.is_active)
                                    .map((ae: any) => (
                                      <Badge key={ae.id} variant="outline" className="text-[10px] h-5 py-0 font-normal">
                                        {ae.class?.name} ({ae.class?.section?.name?.[0] || ""})
                                      </Badge>
                                    ))}
                                </div>
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

                {/* Pagination Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="hidden sm:inline">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of{" "}
                      {filteredStudents.length} students
                    </span>
                    {selectedCount > 0 && (
                      <span className="font-semibold text-foreground">({selectedCount} selected)</span>
                    )}
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
          window.location.reload()
        }}
      />
    </>
  )
}

// Small reusable filter chip component
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-primary/70 transition-colors ml-0.5">
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  )
}
