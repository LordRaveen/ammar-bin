import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { TeachersClientPage } from "@/components/teachers-client-page"

export const dynamic = "force-dynamic"

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()

  const params = await searchParams
  const search = params.search || ""

  // 1. Fetch active session
  const { data: activeSession } = await supabase
    .from("sessions")
    .select("*")
    .eq("is_active", true)
    .single()

  const sessionId = activeSession?.id || ""

  // 2. Fetch all teachers from primary 'teachers' table where role is strictly 'Teacher'
  const teachersQuery = supabase
    .from("teachers")
    .select("*")
    .ilike("role", "teacher")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  // 3. Fetch all active classes
  const classesQuery = supabase
    .from("classes")
    .select(`
      id,
      name,
      class_teacher_id,
      section:sections (
        id,
        name
      )
    `)
    .eq("is_active", true)
    .order("name")

  // 4. Fetch all class subject mappings
  const classSubjectsQuery = supabase
    .from("class_subjects")
    .select(`
      id,
      class_id,
      subject:subjects (
        id,
        name,
        code,
        school_type
      )
    `)

  // 5. Fetch master list of all subjects (for multi-select add modal)
  const allSubjectsQuery = supabase
    .from("subjects")
    .select("*")
    .order("name")

  // 6. Fetch class teachers assignments
  const classAssignmentsQuery = supabase
    .from("teacher_class_assignments")
    .select("*")

  // 7. Fetch subject teachers assignments
  const subjectAssignmentsQuery = supabase
    .from("teacher_subject_assignments")
    .select("*")

  const [
    { data: teachers },
    { data: classes },
    { data: classSubjects },
    { data: allSubjects },
    { data: classAssignments },
    { data: subjectAssignments },
  ] = await Promise.all([
    teachersQuery,
    classesQuery,
    classSubjectsQuery,
    allSubjectsQuery,
    classAssignmentsQuery,
    subjectAssignmentsQuery,
  ])

  // Count teachers in 'teachers' table where role is strictly 'Teacher'
  const { count: teacherCount } = await supabase
    .from("teachers")
    .select("*", { count: "exact", head: true })
    .ilike("role", "teacher")
    .is("deleted_at", null)

  return (
    <TeachersClientPage
      initialTeachers={teachers || []}
      totalCount={teacherCount || 0}
      classes={classes || []}
      classSubjects={classSubjects || []}
      allSubjects={allSubjects || []}
      classAssignments={classAssignments || []}
      subjectAssignments={subjectAssignments || []}
      sessionId={sessionId}
    />
  )
}
