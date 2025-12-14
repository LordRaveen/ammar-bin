import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/get-user"
import { StudentsClientPage } from "@/components/students-client-page"

export const dynamic = "force-dynamic"

export default async function StudentsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  let studentsQuery = supabase
    .from("students")
    .select(`
      *,
      student_enrollments(
        id,
        is_active,
        class:classes(name, section:sections(name))
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (user.role === "teacher") {
    // Get teacher's assigned class IDs
    const { data: teacherData } = await supabase.from("teachers").select("id").eq("user_id", user.id).single()

    if (teacherData) {
      const { data: assignedClasses } = await supabase
        .from("teacher_class_assignments")
        .select("class_id")
        .eq("teacher_id", teacherData.id)

      const classIds = assignedClasses?.map((a) => a.class_id) || []

      if (classIds.length > 0) {
        studentsQuery = supabase
          .from("students")
          .select(`
            *,
            student_enrollments!inner(
              id,
              is_active,
              class_id,
              class:classes(name, section:sections(name))
            )
          `)
          .is("deleted_at", null)
          .in("student_enrollments.class_id", classIds)
          .order("created_at", { ascending: false })
      } else {
        // Teacher has no assigned classes, return empty array
        studentsQuery = supabase.from("students").select("*").eq("id", "00000000-0000-0000-0000-000000000000") // No results
      }
    }
  }

  const [
    { data: studentsData },
    { data: guardiansData },
    { data: sessionsData },
    { data: termsData },
    { data: classesData },
  ] = await Promise.all([
    studentsQuery,
    supabase.from("guardians").select("id, first_name, last_name, phone").order("first_name"),
    supabase.from("sessions").select("*").order("created_at", { ascending: false }),
    supabase.from("terms").select("*").order("term_number"),
    supabase
      .from("classes")
      .select(`
        *,
        section:sections(name)
      `)
      .eq("is_active", true)
      .order("name"),
  ])

  return (
    <StudentsClientPage
      initialStudents={studentsData || []}
      guardians={guardiansData || []}
      sessions={sessionsData || []}
      terms={termsData || []}
      classes={classesData || []}
      userRole={user.role}
    />
  )
}
