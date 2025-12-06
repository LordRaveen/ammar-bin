import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ParentProfileClient from "@/components/parent-profile-client"

export const dynamic = "force-dynamic"

export default async function ParentProfilePage() {
  const user = await requireAuth()

  // Redirect non-parents
  if (user.role !== "parent") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Get guardian record
  const { data: guardian, error } = await supabase.from("guardians").select("*").eq("user_id", user.id).single()

  if (error || !guardian) {
    return <div>Guardian record not found</div>
  }

  // Get linked children
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
        photo_url,
        status
      )
    `)
    .eq("guardian_id", guardian.id)

  const children =
    studentGuardians?.map((sg: any) => ({
      ...sg.students,
      relationship: sg.relationship,
      is_primary: sg.is_primary,
    })) || []

  return <ParentProfileClient guardian={guardian} children={children} userEmail={user.email} />
}
