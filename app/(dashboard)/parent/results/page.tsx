import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { ParentResultsClient } from "@/components/parent-results-client"

export const dynamic = "force-dynamic"

export default async function ParentResultsPage() {
  const user = await requireAuth()

  if (user.role !== "parent") {
    return <div>Access Denied</div>
  }

  const supabase = await createClient()

  const { data: guardian } = await supabase.from("guardians").select("*").eq("user_id", user.id).single()

  if (!guardian) {
    return <div>Guardian record not found</div>
  }

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

  const { data: sessions } = await supabase.from("sessions").select("*").order("start_date", { ascending: false })

  const { data: terms } = await supabase.from("terms").select("*").order("start_date", { ascending: false })

  const activeSession = sessions?.find((s) => s.is_active)
  const activeTerm = terms?.find((t) => t.is_active && t.session_id === activeSession?.id)

  const { data: gradingSchemes } = await supabase
    .from("grading_schemes")
    .select("*")
    .order("min_score", { ascending: false })

  return (
    <ParentResultsClient
      children={children}
      sessions={sessions || []}
      terms={terms || []}
      defaultSessionId={activeSession?.id}
      defaultTermId={activeTerm?.id}
      gradingSchemes={gradingSchemes || []}
    />
  )
}
