import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { ScoreEntryWithClassSelector } from "@/components/score-entry-with-class-selector"

export const dynamic = "force-dynamic"

export default async function ScoreEntryPage({
  searchParams,
}: {
  searchParams: { class?: string }
}) {
  const user = await requireAuth(["super_admin", "admin", "teacher"])
  const supabase = await createServerClient()

  // Get active session and term
  const { data: activeSession } = await supabase.from("sessions").select("*, terms(*)").eq("is_active", true).single()

  const activeTerm = activeSession?.terms?.find((t: any) => t.is_active)

  if (!activeSession || !activeTerm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Score Entry</h1>
          <p className="text-muted-foreground">Enter student assessment scores</p>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No active session or term found. Please activate a session and term first.
          </p>
        </div>
      </div>
    )
  }

  let classes

  if (user.role === "teacher") {
    // Get teacher profile
    const { data: teacherProfile } = await supabase.from("teachers").select("id").eq("user_id", user.id).single()

    if (teacherProfile) {
      // Get classes assigned to this teacher
      const { data: assignedClasses } = await supabase
        .from("teacher_class_assignments")
        .select("class_id, classes(id, name, sections(name))")
        .eq("teacher_id", teacherProfile.id)
        .eq("session_id", activeSession.id)

      classes = assignedClasses?.map((ac) => ac.classes).filter(Boolean) || []
    } else {
      classes = []
    }
  } else {
    // Admins see all active classes
    const { data: allClasses } = await supabase
      .from("classes")
      .select("id, name, sections(name)")
      .eq("is_active", true)
      .order("name")

    classes = allClasses || []
  }

  return (
    <ScoreEntryWithClassSelector
      classes={classes}
      sessionId={activeSession.id}
      sessionName={activeSession.name}
      termId={activeTerm.id}
      termName={activeTerm.name}
      initialClassId={searchParams.class}
    />
  )
}
