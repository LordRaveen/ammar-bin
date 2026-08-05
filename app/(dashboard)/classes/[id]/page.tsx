import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/get-user"
import { ResultFinalizationInterface } from "@/components/result-finalization-interface"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function ClassDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session?: string; term?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const classId = resolvedParams.id

  const user = await requireAuth()
  const supabase = await createServerClient()

  // Fetch active session if not provided
  const { data: activeSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("is_active", true)
    .single()

  const sessionId = resolvedSearchParams.session || activeSession?.id

  // Fetch active term if not provided
  const { data: activeTerm } = await supabase
    .from("terms")
    .select("id")
    .eq("session_id", sessionId)
    .eq("is_active", true)
    .single()

  const termId = resolvedSearchParams.term || activeTerm?.id

  if (!sessionId || !termId || !classId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Please select a session, term, and class to finalize results.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine filtered classes list query if user is a teacher
  let classesQuery = supabase
    .from("classes")
    .select("id, name, class_teacher_id, section:sections(name)")

  if (user.role === "teacher") {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (teacher) {
      // Get classes where the teacher teaches a subject in this session
      const { data: subjectAssignments } = await supabase
        .from("teacher_subject_assignments")
        .select("class_id")
        .eq("teacher_id", teacher.id)
        .eq("session_id", sessionId)

      const subjectClassIds = subjectAssignments?.map((sa) => sa.class_id).filter(Boolean) || []

      if (subjectClassIds.length > 0) {
        classesQuery = classesQuery.or(
          `class_teacher_id.eq.${teacher.id},id.in.(${subjectClassIds.join(",")})`
        )
      } else {
        classesQuery = classesQuery.eq("class_teacher_id", teacher.id)
      }
    } else {
      // Fallback: show nothing if teacher profile doesn't exist
      classesQuery = classesQuery.eq("id", "00000000-0000-0000-0000-000000000000")
    }
  }

  // Fetch all necessary data
  const [
    { data: sessions },
    { data: terms },
    { data: classData },
    { data: classes },
    { data: enrollmentsData },
    { data: classSubjects },
    { data: school },
    { data: teachers },
  ] = await Promise.all([
    supabase.from("sessions").select("*").order("name", { ascending: false }),
    supabase.from("terms").select("*").order("term_number", { ascending: true }),
    supabase.from("classes").select("id, name, class_teacher_id, section:sections(name)").eq("id", classId).single(),
    classesQuery.order("name"),
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
      .eq("class_id", classId)
      .eq("session_id", sessionId)
      .eq("is_active", true),
    supabase
      .from("class_subjects")
      .select("subject:subjects(id, name, code)")
      .eq("class_id", classId),
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

  const enrichedClasses =
    classes?.map((c) => ({
      ...c,
      class_teacher: c.class_teacher_id ? teachersMap.get(c.class_teacher_id) || "—" : "—",
    })) || []

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
          initialClassId={classId}
          initialSessionId={sessionId}
          initialTermId={termId}
          schoolSettings={school}
          showBackButton={true}
          showClassScoresButton={true}
        />
      </Suspense>
    </div>
  )
}
