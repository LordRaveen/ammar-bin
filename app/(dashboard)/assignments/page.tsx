import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/get-user"
import AssignmentsClient from "@/components/assignments-client"

export const dynamic = "force-dynamic"

export default async function AssignmentsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Check if user is a teacher
  const { data: teacher } = await supabase.from("teachers").select("id, role").eq("user_id", user.id).single()

  // Get active session and term
  const { data: activeSession } = await supabase.from("sessions").select("*").eq("is_active", true).single()

  const { data: activeTerm } = await supabase
    .from("terms")
    .select("*")
    .eq("session_id", activeSession?.id)
    .eq("is_active", true)
    .single()

  if (teacher) {
    // Get teacher's assignments
    const { data: assignments } = await supabase
      .from("assignments")
      .select(
        `
        *,
        classes (name),
        subjects (name),
        sessions (name),
        terms (name)
      `,
      )
      .eq("teacher_id", teacher.id)
      .order("due_date", { ascending: false })

    // Get teacher's classes and subjects
    const { data: teacherClasses } = await supabase
      .from("teacher_subject_assignments")
      .select(
        `
        class_id,
        subject_id,
        classes (id, name),
        subjects (id, name)
      `,
      )
      .eq("teacher_id", teacher.id)
      .eq("session_id", activeSession?.id)

    return (
      <AssignmentsClient
        userRole="teacher"
        teacherId={teacher.id}
        assignments={assignments || []}
        teacherClasses={teacherClasses || []}
        activeSession={activeSession}
        activeTerm={activeTerm}
      />
    )
  }

  return <div>Access denied. This page is for teachers only.</div>
}
