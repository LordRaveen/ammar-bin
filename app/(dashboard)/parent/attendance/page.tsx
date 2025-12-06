import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { ParentAttendanceClient } from "@/components/parent-attendance-client"

export const dynamic = "force-dynamic"

export default async function ParentAttendancePage() {
  const user = await requireAuth()

  // Redirect non-parents
  if (user.role !== "parent") {
    return <div>Access Denied</div>
  }

  const supabase = await createClient()

  // Get guardian record
  const { data: guardian } = await supabase.from("guardians").select("*").eq("user_id", user.id).single()

  if (!guardian) {
    return <div>Guardian record not found</div>
  }

  // Get all children
  const { data: studentGuardians } = await supabase
    .from("student_guardians")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name,
        photo_url
      )
    `)
    .eq("guardian_id", guardian.id)

  const children = studentGuardians?.map((sg: any) => sg.students) || []

  return <ParentAttendanceClient children={children} />
}
