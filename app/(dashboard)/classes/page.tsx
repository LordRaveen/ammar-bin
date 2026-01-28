import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddClassModal } from "@/components/add-class-modal"
import { AddSectionModal } from "@/components/add-section-modal"
import { ManageSectionsModal } from "@/components/manage-sections-modal"
import { AssignTeacherClientWrapper } from "@/components/assign-teacher-modal-client"
import {
  IconUsers,
  IconBook,
  IconLayoutDashboard,
  IconSchool,
  IconUserCheck,
  IconArrowUpRight,
  IconSearch
} from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const dynamic = "force-dynamic"

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
  }
  student_count: number
  subject_count: number
}

interface Section {
  id: string
  name: string
  classes: Class[]
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; section?: string }>
}) {
  await requireAdmin()
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  const { data: currentSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const sessionId = currentSession?.id || ""

  const { data: sectionsData, error: sectionsError } = await supabase
    .from("sections")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (sectionsError) {
    console.error("Error fetching sections:", sectionsError)
  }

  const { data: classesData, error: classesError } = await supabase
    .from("classes")
    .select(`
      *,
      section:sections(id, name)
    `)
    .eq("is_active", true)
    .order("name")

  if (classesError) {
    console.error("Error fetching classes:", classesError)
  }

  const teacherIds = (classesData?.map((c) => c.class_teacher_id).filter(Boolean) as string[]) || []

  const teachersMap = new Map()
  if (teacherIds.length > 0) {
    const { data: teachersData } = await supabase
      .from("teachers")
      .select("id, first_name, last_name")
      .in("id", teacherIds)

    teachersData?.forEach((t) => teachersMap.set(t.id, t))
  }

  const studentCounts = new Map<string, number>()
  const { data: enrollmentsData } = await supabase.from("student_enrollments").select("class_id").eq("is_active", true)

  enrollmentsData?.forEach((e) => {
    studentCounts.set(e.class_id, (studentCounts.get(e.class_id) || 0) + 1)
  })

  const subjectCounts = new Map<string, number>()
  const { data: subjectsData } = await supabase.from("class_subjects").select("class_id")

  subjectsData?.forEach((s) => {
    subjectCounts.set(s.class_id, (subjectCounts.get(s.class_id) || 0) + 1)
  })

  const sections: Section[] =
    sectionsData?.map((section) => ({
      ...section,
      classes:
        classesData
          ?.filter((c) => c.section_id === section.id)
          .map((c) => ({
            ...c,
            teacher: c.class_teacher_id ? teachersMap.get(c.class_teacher_id) : undefined,
            student_count: studentCounts.get(c.id) || 0,
            subject_count: subjectCounts.get(c.id) || 0,
          })) || [],
    })) || []

  const filteredSections = resolvedSearchParams.search
    ? sections
      .map((section) => ({
        ...section,
        classes: section.classes.filter((c) => c.name.toLowerCase().includes(resolvedSearchParams.search!.toLowerCase())),
      }))
      .filter((section) => section.classes.length > 0)
    : sections

  const defaultSection = resolvedSearchParams.section || filteredSections[0]?.id || ""

  const { data: teachersDataForModal } = await supabase
    .from("teachers")
    .select("id, first_name, middle_name, last_name, email")
    .eq("status", "Active")
    .order("first_name")

  // Strategic Stats Calculation
  const totalClasses = classesData?.length || 0
  const activeSections = sectionsData?.length || 0
  const totalCapacity = classesData?.reduce((acc, curr) => acc + (curr.capacity || 0), 0) || 0
  const totalStudents = Array.from(studentCounts.values()).reduce((acc, curr) => acc + curr, 0)
  const masterUtilization = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0
  const classesWithoutTeachers = classesData?.filter(c => !c.class_teacher_id).length || 0

  return (
    <div className="space-y-8 pt-4">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Academic Structure</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-zinc-100">Classes & Sections</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Managing <span className="text-foreground font-bold">{totalClasses} active classes</span> across {activeSections} academic departments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ManageSectionsModal sections={sectionsData || []} />
          <AddSectionModal />
          <AddClassModal />
        </div>
      </div>

      {/* Strategic KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border  shadow-none bg-white dark:bg-zinc-950 overflow-hidden relative group">
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

        <div className="flex flex-col gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-0.4 tranzinc-y-1/2 h-4 w-4 text-muted-foreground" />
            <form>
              <Input
                name="search"
                placeholder="Instant search..."
                defaultValue={resolvedSearchParams.search}
                className="w-full h-full pl-10 bg-zinc-50 dark:bg-zinc-900 border-none shadow-none text-sm font-semibold rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </form>
          </div>
          <div className="h-1/3 bg-blue-600 rounded-xl flex items-center justify-center p-2">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Current Term Dashboard</span>
          </div>
        </div>
      </div>

      {filteredSections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {resolvedSearchParams.search
            ? "No classes found matching your search."
            : "No sections available. Create a section first to get started."}
        </div>
      ) : (
        <Tabs defaultValue={defaultSection} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 h-auto gap-1">
              {filteredSections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg border-none"
                >
                  {section.name}
                  <Badge variant="outline" className="ml-2 border-none bg-zinc-200/50 dark:bg-zinc-800 text-[10px]">
                    {section.classes.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {filteredSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-6 outline-none">
              {section.classes.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-3xl border-zinc-100 dark:border-zinc-800">
                  <div className="h-16 w-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-800">
                    <IconSchool className="h-8 w-8 text-zinc-300" />
                  </div>
                  <h3 className="text-lg font-bold">Empty Department</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px] mx-auto mt-2">
                    There are no classes registered under the <span className="font-bold text-foreground">{section.name}</span> section yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {section.classes.map((classItem) => {
                    const occupancy = classItem.capacity > 0 ? Math.round((classItem.student_count / classItem.capacity) * 100) : 0

                    return (
                      <div key={classItem.id} className="group h-full">
                        <Link href={`/classes/${classItem.id}`} className="block h-full group">
                          <Card className="relative h-full overflow-hidden border shadow-none hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 bg-zinc-50 dark:bg-zinc-950 flex flex-col pt-0">
                            {/* Decorative Top Accent */}
                            <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 absolute top-0 left-0">
                              <div
                                className="h-full bg-blue-600 transition-all duration-1000"
                                style={{ width: `${occupancy}%` }}
                              />
                            </div>

                            <CardContent className="px-4 py-1 pt-6 flex flex-col flex-1">
                              <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-black text-xl tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                                      {classItem.name}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {classItem.teacher ? (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 border shadow-sm">
                                          <AvatarFallback className="text-[8px] bg-zinc-900 text-white font-bold uppercase">
                                            {classItem.teacher.first_name[0]}{classItem.teacher.last_name[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                          {classItem.teacher.first_name} {classItem.teacher.last_name}
                                        </span>
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="text-[9px] font-bold uppercase border-orange-200 bg-orange-50/50 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/40">
                                        Unassigned
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge className="bg-zinc-900 dark:bg-white dark:text-black font-black text-[9px] uppercase py-0.5 px-2">
                                  {section.name}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Enrollment</span>
                                  <div className="flex items-center gap-2">
                                    <IconUsers size={14} className="text-muted-foreground" />
                                    <span className="text-sm font-black italic">{classItem.student_count} <span className="text-foreground font-normal">/ {classItem.capacity}</span></span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Curriculum</span>
                                  <div className="flex items-center gap-2">
                                    <IconBook size={14} className="text-zinc-400" />
                                    <span className="text-sm font-black italic">{classItem.subject_count} <span className="text-muted-foreground font-normal">Subjects</span></span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>

                            {!classItem.teacher && (
                              <div className="px-6 pb-0 mt-1 relative z-20">
                                <AssignTeacherClientWrapper
                                  classId={classItem.id}
                                  sessionId={sessionId}
                                  teachers={teachersDataForModal || []}
                                />
                              </div>
                            )}
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
    </div>
  )
}
