import { Suspense } from "react"
import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { ResultFinalizationInterface } from "@/components/result-finalization-interface"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default async function TeacherResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; term?: string; class?: string }>
}) {
  const user = await requireAuth(["teacher"])
  const params = await searchParams
  const supabase = await createServerClient()

  // Fetch teacher profile
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .single()

  if (!teacher) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto text-center py-8">
          <CardContent className="space-y-3">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
            <h2 className="text-base font-bold">Teacher Profile Not Found</h2>
            <p className="text-xs text-muted-foreground">
              Your teacher profile is not set up yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch active session if not provided
  const { data: activeSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("is_active", true)
    .single()

  const sessionId = params.session || activeSession?.id

  // Fetch active term if not provided
  const { data: activeTerm } = await supabase
    .from("terms")
    .select("id")
    .eq("session_id", sessionId)
    .eq("is_active", true)
    .single()

  const termId = params.term || activeTerm?.id

  // Fetch teacher's assigned classes from teacher_class_assignments AND lead class_teacher_id
  const [{ data: classAssignments }, { data: leadClasses }] = await Promise.all([
    supabase
      .from("teacher_class_assignments")
      .select(`
        classes (
          id,
          name,
          class_teacher_id,
          section:sections(name)
        )
      `)
      .eq("teacher_id", teacher.id)
      .eq("session_id", sessionId),

    supabase
      .from("classes")
      .select("id, name, class_teacher_id, section:sections(name)")
      .eq("class_teacher_id", teacher.id)
  ])

  // Combine & deduplicate assigned classes
  const assignedMap = new Map<string, any>()
  classAssignments?.forEach((a: any) => {
    if (a.classes?.id) assignedMap.set(a.classes.id, a.classes)
  })
  leadClasses?.forEach((c: any) => {
    if (c.id) assignedMap.set(c.id, c)
  })

  const teacherClasses = Array.from(assignedMap.values())

  // If teacher has NO assigned classes, show clear message
  if (teacherClasses.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center py-8 shadow-xs border border-amber-500/20 bg-amber-500/5">
          <CardContent className="space-y-3">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto animate-pulse" />
            <h2 className="text-lg font-bold text-foreground">No Class Assigned</h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-4">
              You are currently not assigned as a class teacher or subject teacher for any class in this academic period.
            </p>
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Please contact your administrator to assign you a class.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Auto-select primary assigned class if no class param specified
  const selectedClassId = params.class && teacherClasses.some((c) => c.id === params.class)
    ? params.class
    : teacherClasses[0].id

  // Fetch all necessary data for the auto-selected class
  const [
    { data: sessions },
    { data: terms },
    { data: classData },
    { data: enrollmentsData },
    { data: classSubjects },
    { data: school },
    { data: teachers },
  ] = await Promise.all([
    supabase.from("sessions").select("*").order("name", { ascending: false }),
    supabase.from("terms").select("*").order("term_number", { ascending: true }),
    supabase.from("classes").select("id, name, class_teacher_id, section:sections(name)").eq("id", selectedClassId).single(),
    supabase
      .from("student_enrollments")
      .select(`
        student:students(
          id,
          student_id,
          first_name,
          middle_name,
          last_name,
          photo_url,
          date_of_birth,
          gender
        )
      `)
      .eq("class_id", selectedClassId)
      .eq("session_id", sessionId)
      .eq("is_active", true),
    supabase
      .from("class_subjects")
      .select("subject:subjects(id, name, code)")
      .eq("class_id", selectedClassId),
    supabase.from("school_settings").select("*").maybeSingle(),
    supabase.from("user_profiles").select("id, first_name, last_name"),
  ])

  const teachersMap = new Map(
    teachers?.map((t) => [t.id, `${t.first_name || ""} ${t.last_name || ""}`.trim()]) || []
  )

  const enrichedClassData = classData
    ? {
        ...classData,
        class_teacher: classData.class_teacher_id ? teachersMap.get(classData.class_teacher_id) || "—" : "—",
      }
    : null

  const enrichedClasses = teacherClasses.map((c) => ({
    ...c,
    class_teacher: c.class_teacher_id ? teachersMap.get(c.class_teacher_id) || "—" : "—",
  }))

  const subjects = classSubjects?.map((cs: any) => cs.subject).filter(Boolean) || []

  const studentMap = new Map<string, any>()
  enrollmentsData?.forEach((e: any) => {
    if (e.student && e.student.id && !studentMap.has(e.student.id)) {
      studentMap.set(e.student.id, e.student)
    }
  })
  const uniqueStudents = Array.from(studentMap.values())

  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <ResultFinalizationInterface
          sessions={sessions || []}
          terms={terms || []}
          classData={enrichedClassData}
          classes={enrichedClasses}
          students={uniqueStudents}
          subjects={subjects}
          initialClassId={selectedClassId}
          initialSessionId={sessionId}
          initialTermId={termId}
          schoolSettings={school}
        />
      </Suspense>
    </div>
  )
}
