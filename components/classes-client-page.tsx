"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddClassModal } from "@/components/add-class-modal"
import { ManageSectionsModal } from "@/components/manage-sections-modal"
import {
  IconUsers,
  IconBook,
  IconBuilding,
  IconUserCheck,
  IconArrowUpRight,
  IconSearch,
  IconX,
  IconSchool,
  IconSettings,
  IconUserX,
  IconLoader2
} from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createBrowserClient } from "@/lib/supabase/client"
import { updateClass, deleteClass } from "@/app/(dashboard)/classes/actions"
import { assignSubjectTeacher, removeSubjectTeacher } from "@/app/(dashboard)/classes/[id]/actions"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClassSubjectsChecklistModal } from "./class-subjects-checklist-modal"

interface Class {
  id: string
  name: string
  capacity: number
  is_active: boolean
  section_id: string
  class_teacher_id: string | null
  section: {
    id: string
    name: string
  }
  teacher?: {
    id: string
    first_name: string
    last_name: string
    staff_id?: string
  }
  student_count: number
  subject_count: number
}

interface Section {
  id: string
  name: string
  classes: Class[]
}

interface ClassesClientPageProps {
  sections: Section[]
  sectionsData: any[]
  totalClasses: number
  activeSections: number
  totalCapacity: number
  totalStudents: number
  masterUtilization: number
  classesWithoutTeachers: number
  sessionId: string
}

export function ClassesClientPage({
  sections,
  sectionsData,
  totalClasses,
  activeSections,
  totalCapacity,
  totalStudents,
  masterUtilization,
  classesWithoutTeachers,
  sessionId,
}: ClassesClientPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const supabase = createBrowserClient()

  // Sidepanel state
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false)
  const [sidepanelTab, setSidepanelTab] = useState<"details" | "subjects">("details")
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailedSubjects, setDetailedSubjects] = useState<any[]>([])
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)

  // Edit fields state
  const [editName, setEditName] = useState("")
  const [editCapacity, setEditCapacity] = useState<number>(30)
  const [editSectionId, setEditSectionId] = useState("")
  const [editTeacher, setEditTeacher] = useState<any | null>(null)

  // Deletion / saving progress state
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Teacher picker popover state
  const [teachers, setTeachers] = useState<any[]>([])
  const [teacherSearch, setTeacherSearch] = useState("")
  const [teacherPickerOpen, setTeacherPickerOpen] = useState(false)
  const [teacherPickerTarget, setTeacherPickerTarget] = useState<"class_teacher" | "subject_teacher" | null>(null)
  const [assigningSubjectId, setAssigningSubjectId] = useState<string | null>(null)

  // Fetch teachers for search drawer
  useEffect(() => {
    if (isSidepanelOpen) {
      fetchTeachers()
    }
  }, [isSidepanelOpen])

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, staff_id")
      .ilike("status", "active")
      .order("first_name")
    if (data) setTeachers(data)
  }

  // Fetch dynamic subjects & teacher assignments for the selected class
  const fetchClassSubjectsAndTeachers = async (classId: string) => {
    setLoadingDetails(true)
    try {
      const { data: csData } = await supabase
        .from("class_subjects")
        .select(`
          id,
          subject_id,
          max_score,
          pass_mark,
          subject:subjects(name, code)
        `)
        .eq("class_id", classId)

      const { data: taData } = await supabase
        .from("teacher_subject_assignments")
        .select(`
          subject_id,
          teacher:teachers(id, first_name, last_name)
        `)
        .eq("class_id", classId)
        .eq("session_id", sessionId)

      const mapped = (csData || []).map((cs: any) => {
        const assignment = (taData || []).find((ta: any) => ta.subject_id === cs.subject_id)
        return {
          id: cs.id,
          subjectId: cs.subject_id,
          name: cs.subject?.name || "Unknown",
          code: cs.subject?.code || "",
          teacher: assignment?.teacher || null,
        }
      })

      setDetailedSubjects(mapped)
    } catch (e) {
      console.error("[v0] Error fetching class details:", e)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Open sidepanel and populate state
  const openClassSidepanel = async (classItem: Class) => {
    setSelectedClass(classItem)
    setEditName(classItem.name)
    setEditCapacity(classItem.capacity)
    setEditSectionId(classItem.section_id)
    setEditTeacher(classItem.teacher || null)
    setSidepanelTab("details")
    setIsSidepanelOpen(true)
    
    // Fetch subjects dynamically
    fetchClassSubjectsAndTeachers(classItem.id)
  };

  const handleCardContextMenu = (e: React.MouseEvent, classItem: Class) => {
    e.preventDefault()
    openClassSidepanel(classItem)
  }

  const handleSaveClassDetails = async () => {
    if (!selectedClass) return
    if (!editName.trim()) {
      alert("Class name is required")
      return
    }
    if (!editSectionId) {
      alert("Section is required")
      return
    }
    if (editCapacity <= 0) {
      alert("Capacity must be greater than 0")
      return
    }

    setIsSaving(true)
    try {
      const result = await updateClass(
        selectedClass.id,
        editName,
        editCapacity,
        editTeacher?.id || null,
        editSectionId
      )

      if (result.error) {
        alert(result.error)
        return
      }

      setIsSidepanelOpen(false)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error updating class details:", err)
      alert("Failed to update class details")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedClass) return
    setIsDeleting(true)
    try {
      const result = await deleteClass(selectedClass.id)
      if (result.error) {
        alert(result.error)
        return
      }
      setDeleteConfirmOpen(false)
      setIsSidepanelOpen(false)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error deleting class:", err)
      alert("Failed to delete class")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTeacherSelected = async (teacher: any) => {
    setTeacherPickerOpen(false)
    if (teacherPickerTarget === "class_teacher") {
      setEditTeacher(teacher)
    } else if (teacherPickerTarget === "subject_teacher" && assigningSubjectId && selectedClass) {
      setLoadingDetails(true)
      try {
        if (!sessionId) {
          alert("No active session found. Cannot assign subject teacher.")
          return
        }
        await assignSubjectTeacher(selectedClass.id, teacher.id, assigningSubjectId, sessionId)
        await fetchClassSubjectsAndTeachers(selectedClass.id)
        router.refresh()
      } catch (err) {
        console.error("[v0] Failed to assign subject teacher:", err)
        alert(err instanceof Error ? err.message : "Failed to assign teacher")
      } finally {
        setLoadingDetails(false)
      }
    }
  }

  const handleUnassignSubjectTeacher = async (subjectId: string) => {
    if (!selectedClass) return
    setLoadingDetails(true)
    try {
      if (!sessionId) {
        alert("No active session found. Cannot unassign subject teacher.")
        return
      }
      await removeSubjectTeacher(selectedClass.id, subjectId, sessionId)
      await fetchClassSubjectsAndTeachers(selectedClass.id)
      router.refresh()
    } catch (err) {
      console.error("[v0] Failed to unassign subject teacher:", err)
      alert(err instanceof Error ? err.message : "Failed to unassign teacher")
    } finally {
      setLoadingDetails(false)
    }
  }

  // Filter sections and classes based on searchQuery
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections

    return sections
      .map((section) => {
        const filteredClasses = section.classes.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        return {
          ...section,
          classes: filteredClasses,
        }
      })
      .filter((section) => section.classes.length > 0)
  }, [sections, searchQuery])

  // Get active tab value: default to first matching section, or empty string
  const defaultTab = filteredSections[0]?.id || ""

  const filteredTeachers = teachers.filter((t) => {
    const fullName = `${t.first_name} ${t.last_name}`.toLowerCase()
    const staffId = (t.staff_id || "").toLowerCase()
    const query = teacherSearch.toLowerCase()
    return fullName.includes(query) || staffId.includes(query)
  })

  return (
    <div className="space-y-6 pt-2">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-zinc-100">Classes & Sections</h1>
        </div>
      </div>

      {/* Strategic KPI Row (4 Cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Classes Card - uses IconBuilding */}
        <Card className="border shadow-none bg-white dark:bg-zinc-950 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <IconBuilding size={48} />
          </div>
          <CardContent className="py-0 px-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 leading-none">Total Classes</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black">{totalClasses}</span>
              <span className="text-[10px] text-muted-foreground font-bold mb-1">Active Classes</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold mt-1">
              Across {activeSections} Departments
            </p>
          </CardContent>
        </Card>

        {/* Total Capacity Card */}
        <Card className="border shadow-none bg-white dark:bg-zinc-950 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
            <IconSchool size={48} />
          </div>
          <CardContent className="py-0 m-0 px-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 leading-none">Total Capacity</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black">{totalCapacity}</span>
              <span className="text-[10px] text-muted-foreground font-bold mb-1">Seats Available</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={masterUtilization} className="h-1 flex-1" />
              <span className="text-[10px] font-bold text-blue-600">{masterUtilization}% Filled</span>
            </div>
          </CardContent>
        </Card>

        {/* Student Load Card */}
        <Card className="border shadow-none bg-white dark:bg-zinc-950 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <IconUsers size={48} />
          </div>
          <CardContent className="py-0 px-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 leading-none">Student Load</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black">{totalStudents}</span>
              <span className="text-[10px] text-muted-foreground font-bold mb-1">Active Students</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <IconArrowUpRight size={12} />
              Synced with enrollment
            </p>
          </CardContent>
        </Card>

        {/* Teacher Coverage Card */}
        <Card className="border shadow-none bg-white dark:bg-zinc-950 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <IconUserCheck size={48} />
          </div>
          <CardContent className="py-0 px-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 leading-none">Teacher Coverage</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black">{Math.round(((totalClasses - classesWithoutTeachers) / totalClasses) * 100)}%</span>
              <span className="text-[10px] text-muted-foreground font-bold mb-1">Assigned Rate</span>
            </div>
            {classesWithoutTeachers > 0 ? (
              <p className="text-[11px] text-orange-600 font-bold mt-1 animate-pulse">
                {classesWithoutTeachers} classes still unassigned
              </p>
            ) : (
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Full coverage attained</p>
            )}
          </CardContent>
        </Card>
      </div>

      {filteredSections.length === 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="h-9" />
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-initial sm:w-60 h-9">
                <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-none text-xs font-semibold rounded-lg focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-foreground cursor-pointer"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ManageSectionsModal sections={sectionsData || []} />
                <AddClassModal />
              </div>
            </div>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery
              ? "No classes found matching your search."
              : "No sections available. Create a section first to get started."}
          </div>
        </div>
      ) : (
        <Tabs key={defaultTab} defaultValue={defaultTab} className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            {/* Tabs on the Left */}
            <TabsList className="bg-zinc-100/60 dark:bg-zinc-900/60 p-0.5 h-9 gap-0.5 self-start lg:self-auto border border-zinc-200/50 dark:border-zinc-800/80 rounded-lg">
              {filteredSections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="group px-4 py-1.5 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xs rounded-md border-none h-8 transition-all"
                >
                  {section.name}
                  <Badge variant="outline" className="ml-2 border-none bg-zinc-200/50 dark:bg-zinc-800 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-primary-foreground text-[10px] h-4.5 px-1 font-bold transition-all">
                    {section.classes.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Actions Bar (Search, Manage Sections, Add Class) */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:flex-initial sm:w-60 h-9">
                <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-none text-xs font-semibold rounded-lg focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-foreground cursor-pointer"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>

              {/* Sections & Add Class Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <ManageSectionsModal sections={sectionsData || []} />
                <AddClassModal />
              </div>
            </div>
          </div>

          {filteredSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-6 outline-none">
              {section.classes.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-3xl border-zinc-100 dark:border-zinc-800">
                  <div className="h-16 w-16 bg-zinc-50 dark:bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-800/80">
                    <IconSchool className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                  </div>
                  <h3 className="text-lg font-bold">Empty Department</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px] mx-auto mt-2">
                    There are no classes registered under the <span className="font-bold text-foreground">{section.name}</span> section yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.classes.map((classItem) => {
                    return (
                      <div
                        key={classItem.id}
                        className="group h-full cursor-context-menu"
                        onContextMenu={(e) => handleCardContextMenu(e, classItem)}
                      >
                        <Link href={`/classes/${classItem.id}`} className="block h-full group">
                          <Card className="relative h-full overflow-hidden border shadow-none hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 bg-zinc-50 dark:bg-zinc-950 flex flex-col pt-0">
                            <CardContent className="p-3 flex flex-col flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-black text-sm sm:text-base tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                                      {classItem.name}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {classItem.teacher ? (
                                      <div className="flex items-center gap-1.5">
                                        <Avatar className="h-4.5 w-4.5 border shadow-sm">
                                          <AvatarFallback className="text-[7px] bg-zinc-900 text-white font-bold uppercase">
                                            {classItem.teacher.first_name[0]}{classItem.teacher.last_name[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                          {classItem.teacher.first_name} {classItem.teacher.last_name}
                                        </span>
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="text-[8px] font-black uppercase border-orange-200 bg-orange-50/50 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/40 py-0 px-1.5 h-4.5">
                                        Unassigned
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openClassSidepanel(classItem)
                                    }}
                                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-foreground transition-all cursor-pointer"
                                    title="Manage class details"
                                  >
                                    <IconSettings size={15} />
                                  </button>
                                  <Badge className="bg-zinc-900 dark:bg-white dark:text-black font-black text-[8px] uppercase py-0.5 px-1.5">
                                    {section.name}
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-2">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">Enrollment</span>
                                  <div className="flex items-center gap-1.5">
                                    <IconUsers size={12} className="text-muted-foreground" />
                                    <span className="text-xs font-black italic">{classItem.student_count} <span className="text-foreground font-normal">/ {classItem.capacity}</span></span>
                                  </div>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">Curriculum</span>
                                  <div className="flex items-center gap-1.5">
                                    <IconBook size={12} className="text-zinc-400" />
                                    <span className="text-xs font-black italic">{classItem.subject_count} <span className="text-muted-foreground font-normal">Subjects</span></span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Slide-out Class Details Drawer */}
      <Sheet open={isSidepanelOpen} onOpenChange={setIsSidepanelOpen}>
        <SheetContent className="w-full sm:max-w-md border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 flex flex-col h-full overflow-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="py-0 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-900/10">
            <SheetHeader>
              <SheetTitle className="text-base font-black tracking-tight uppercase text-foreground flex items-center gap-2">
                <span>{selectedClass?.name}</span>
                {selectedClass?.section && (
                  <Badge variant="outline" className="border-none bg-zinc-200 dark:bg-zinc-800 text-[10px] h-5 px-2 font-bold select-none">
                    {selectedClass.section.name}
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Configure classroom capacities, student load, subjects and teachers.
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Tab Switcher Navigation */}
          <div className="px-4 pt-3 border-b border-zinc-100 dark:border-zinc-850 flex gap-4">
            <button
              type="button"
              onClick={() => setSidepanelTab("details")}
              className={cn(
                "pb-2.5 text-[10px] font-black uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer",
                sidepanelTab === "details"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Overview & Settings
            </button>
            <button
              type="button"
              onClick={() => setSidepanelTab("subjects")}
              className={cn(
                "pb-2.5 text-[10px] font-black uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer",
                sidepanelTab === "subjects"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Subjects ({detailedSubjects.length}) & Teachers 
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sidepanelTab === "details" ? (
              <div className="space-y-4">
                {/* Visual Capacity Load Meter */}
                {selectedClass && (
                  <Card className="border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/5 shadow-none">
                    <CardContent className="p-0 px-2.5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Classroom Load</span>
                        <span className="text-xs font-black italic text-foreground">
                          {selectedClass.student_count} <span className="font-normal text-muted-foreground">/ {editCapacity} Students</span>
                        </span>
                      </div>
                      <Progress
                        value={editCapacity > 0 ? Math.round((selectedClass.student_count / editCapacity) * 100) : 0}
                        className="h-1.5"
                      />
                      <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground">
                        <span>{editCapacity - selectedClass.student_count} Seats Available</span>
                        <span>{editCapacity > 0 ? Math.round((selectedClass.student_count / editCapacity) * 100) : 0}% Occupied</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Edit Form Fields */}
                <div className="space-y-4 pt-1">
                  {/* Class Name */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                      Class Name *
                    </Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9 text-xs bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 font-medium"
                      placeholder="e.g., Class 1, Raudah"
                    />
                  </div>

                  {/* Section Toggles */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                      Section *
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {sectionsData.map((section) => {
                        const isSelected = editSectionId === section.id
                        return (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setEditSectionId(section.id)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer select-none",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-zinc-50/50 dark:bg-zinc-900/10 text-muted-foreground border-zinc-200/80 dark:border-zinc-800/80 hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                            )}
                          >
                            {section.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Classroom Capacity */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                      Maximum Capacity *
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(parseInt(e.target.value) || 0)}
                      className="h-9 text-xs bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 font-medium"
                      placeholder="Capacity size"
                    />
                  </div>

                  {/* Form Teacher assignment */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                      Class Form Teacher
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherPickerTarget("class_teacher")
                          setTeacherPickerOpen(true)
                        }}
                        className="flex-1 flex items-center justify-between px-3 h-9 text-xs bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 text-left font-medium transition-all"
                      >
                        <span className={editTeacher ? "text-foreground font-semibold" : "text-muted-foreground"}>
                          {editTeacher
                            ? `${editTeacher.first_name} ${editTeacher.last_name} (${editTeacher.staff_id || "No ID"})`
                            : "Select teacher..."}
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                          {editTeacher ? "Change" : "Browse"}
                        </span>
                      </button>
                      {editTeacher && (
                        <button
                          type="button"
                          onClick={() => setEditTeacher(null)}
                          className="px-3.5 h-9 text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-650 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings footer buttons */}
                <div className="flex justify-between items-center pt-5 border-t border-zinc-100 dark:border-zinc-800/60 mt-8 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="h-9 text-xs font-bold text-red-500 hover:text-red-600 border-red-200 dark:border-red-950/40 bg-red-50/5 hover:bg-red-500/5 hover:border-red-500/20"
                  >
                    Delete Class
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveClassDetails}
                    disabled={isSaving}
                    className="h-9 text-xs font-bold px-5 bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class Curriculum</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsChecklistOpen(true)}
                      className="h-7 text-[10px] font-bold px-2.5 bg-primary text-primary-foreground hover:bg-primary/95 transition-all select-none"
                    >
                      Add Subject
                    </Button>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full select-none">
                      {detailedSubjects.length} Subjects
                    </span>
                  </div>
                </div>

                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <IconLoader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Loading details...</p>
                  </div>
                ) : detailedSubjects.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-2xl border-zinc-200/80 bg-zinc-50/20 dark:bg-zinc-900/10 p-5 flex flex-col items-center justify-center">
                    <IconBook className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs font-bold">No registered subjects</p>
                    <p className="text-[10px] text-muted-foreground mt-1 mb-4">Assign subjects to get started with this classroom.</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsChecklistOpen(true)}
                      className="text-xs font-bold bg-primary text-primary-foreground"
                    >
                      Configure Subjects
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detailedSubjects.map((subject) => {
                      const displayTeacher = subject.teacher || editTeacher || selectedClass?.teacher
                      return (
                        <div
                          key={subject.id}
                          className="p-3 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-zinc-55 dark:bg-zinc-900/10 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground block tracking-tight">
                              {subject.name}
                            </span>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                              {subject.code || "NO CODE"}
                            </span>
                            
                            {displayTeacher ? (
                              <div className="flex items-center gap-1.5 mt-1 bg-zinc-100/50 dark:bg-zinc-900/60 py-0.5 px-1.5 rounded-md self-start w-fit border border-zinc-200/40 dark:border-zinc-800/40">
                                <span className={cn("h-1.5 w-1.5 rounded-full", subject.teacher ? "bg-emerald-500" : "bg-blue-500")} />
                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                                  {displayTeacher.first_name} {displayTeacher.last_name}
                                  {!subject.teacher && " (Default)"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-orange-500 dark:text-orange-400 font-black uppercase tracking-wider block mt-1">
                                No Teacher Assigned
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAssigningSubjectId(subject.subjectId)
                                setTeacherPickerTarget("subject_teacher")
                                setTeacherPickerOpen(true)
                              }}
                              className="h-7 text-[10px] font-bold px-2.5 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                            >
                              {subject.teacher ? "Change" : "Assign"}
                            </Button>
                            {subject.teacher && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnassignSubjectTeacher(subject.subjectId)}
                                className="h-7 w-7 text-red-500 hover:text-red-650 hover:bg-red-500/5"
                                title="Unassign Teacher"
                              >
                                <IconUserX size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {selectedClass && (
        <ClassSubjectsChecklistModal
          open={isChecklistOpen}
          onOpenChange={setIsChecklistOpen}
          classId={selectedClass.id}
          classNameText={selectedClass.name}
          onAssignedSubjectsChanged={() => {
            fetchClassSubjectsAndTeachers(selectedClass.id)
            router.refresh()
          }}
        />
      )}

      {/* Global Searchable Teacher Dialog picker */}
      <Dialog open={teacherPickerOpen} onOpenChange={setTeacherPickerOpen}>
        <DialogContent className="max-w-md p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {teacherPickerTarget === "class_teacher" ? "Assign Class Form Teacher" : "Assign Subject Lead Teacher"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Search and assign a staff member to handle this instruction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search teachers by name..."
                className="pl-9 h-9 text-xs bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[240px] overflow-y-auto border border-zinc-100 dark:border-zinc-800/80 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 bg-background/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredTeachers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">No teachers match your search</p>
              ) : (
                filteredTeachers.map((t) => {
                  const isSelected = 
                    teacherPickerTarget === "class_teacher"
                      ? editTeacher?.id === t.id
                      : false // Subject teacher picker highlights dynamically
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTeacherSelected(t)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-xs flex items-center justify-between hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer",
                        isSelected ? "bg-emerald-500/5 font-bold" : ""
                      )}
                    >
                      <div className="flex flex-col">
                        <span className={isSelected ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-foreground font-medium"}>
                          {t.first_name} {t.last_name}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{t.staff_id || "—"}</span>
                      </div>
                      
                      {isSelected && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-950 text-[9px] px-1.5 py-0 h-4 font-semibold">
                          Selected
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

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground mt-1">
              This will perform a soft-delete on the class <span className="font-bold text-foreground">{selectedClass?.name}</span>.
              The classroom will be disabled and hidden from active views. Active enrollments will remain stored safely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="h-9 text-xs font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="h-9 text-xs font-bold bg-red-650 hover:bg-red-700 text-white border-none"
            >
              {isDeleting ? "Deleting..." : "Delete Class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
