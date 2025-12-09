import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/get-user"
import ParentMessagesClient from "@/components/parent-messages-client"

export const dynamic = "force-dynamic"

export default async function ParentMessagesPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get guardian info
  const { data: guardian } = await supabase
    .from("guardians")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .single()

  if (!guardian) {
    return <div>Access denied. Guardian account not found.</div>
  }

  // Get guardian's children
  const { data: children } = await supabase
    .from("guardian_students")
    .select(
      `
      students (
        id,
        student_id,
        first_name,
        last_name,
        student_enrollments!inner (
          classes (
            id,
            name,
            class_teacher_id,
            teachers (
              id,
              first_name,
              last_name,
              user_id
            )
          )
        )
      )
    `,
    )
    .eq("guardian_id", guardian.id)

  const studentsWithTeachers =
    children?.map((item: any) => ({
      id: item.students.id,
      student_id: item.students.student_id,
      name: `${item.students.first_name} ${item.students.last_name}`,
      class: item.students.student_enrollments[0]?.classes,
    })) || []

  // Get all messages (inbox and sent)
  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:sender_id (
        id,
        email
      ),
      recipient:recipient_id (
        id,
        email
      ),
      students (
        first_name,
        last_name
      )
    `,
    )
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false)

  return (
    <ParentMessagesClient
      guardianUserId={user.id}
      students={studentsWithTeachers}
      initialMessages={messages || []}
      unreadCount={unreadCount || 0}
    />
  )
}
