import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { ClassesClientPage } from "@/components/classes-client-page"

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

export default async function ClassesPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Run all independent queries in parallel for blazing fast load
  const [
    { data: currentSession },
    { data: sectionsData, error: sectionsError },
    { data: classesData, error: classesError },
    { data: enrollmentsData },
    { data: subjectsData },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("sections")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("classes")
      .select(`
        *,
        section:sections(id, name)
      `)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("student_enrollments")
      .select("class_id")
      .eq("is_active", true),
    supabase
      .from("class_subjects")
      .select("class_id"),
  ])

  if (sectionsError) {
    console.error("Error fetching sections:", sectionsError)
  }
  if (classesError) {
    console.error("Error fetching classes:", classesError)
  }

  const sessionId = currentSession?.id || ""

  // Teachers query depends on classesData, but runs after the parallel batch
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
  enrollmentsData?.forEach((e) => {
    studentCounts.set(e.class_id, (studentCounts.get(e.class_id) || 0) + 1)
  })

  const subjectCounts = new Map<string, number>()
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

  // Strategic Stats Calculation
  const totalClasses = classesData?.length || 0
  const activeSections = sectionsData?.length || 0
  const totalCapacity = classesData?.reduce((acc, curr) => acc + (curr.capacity || 0), 0) || 0
  const totalStudents = Array.from(studentCounts.values()).reduce((acc, curr) => acc + curr, 0)
  const masterUtilization = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0
  const classesWithoutTeachers = classesData?.filter(c => !c.class_teacher_id).length || 0

  return (
    <ClassesClientPage
      sections={sections}
      sectionsData={sectionsData || []}
      totalClasses={totalClasses}
      activeSections={activeSections}
      totalCapacity={totalCapacity}
      totalStudents={totalStudents}
      masterUtilization={masterUtilization}
      classesWithoutTeachers={classesWithoutTeachers}
      sessionId={sessionId}
    />
  )
}
