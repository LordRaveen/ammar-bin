import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { ResultFinalizationInterface } from "@/components/result-finalization-interface"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default async function ResultFinalizationPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; term?: string; class?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerClient()

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
  const classId = params.class

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
    supabase.from("classes").select("id, name, class_teacher_id, section:sections(name)").order("name"),
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
