import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { DefaultersReportClient } from "@/components/defaulters-report-client"

export const dynamic = "force-dynamic"

export default async function DefaultersReportPage() {
  await requireAuth(["super_admin", "admin", "accountant", "cashier"])
  const supabase = await createServerClient()

  // Get active session and term
  const { data: activeSession } = await supabase.from("sessions").select("*").eq("is_active", true).maybeSingle()

  const { data: activeTerm } = await supabase.from("terms").select("*").eq("is_active", true).maybeSingle()

  // Get all classes for filter
  const { data: classes } = await supabase.from("classes").select("id, name").eq("is_active", true).order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Defaulters List</h1>
        <p className="text-muted-foreground">Students with overdue fee payments</p>
      </div>

      <DefaultersReportClient classes={classes || []} activeSession={activeSession} activeTerm={activeTerm} />
    </div>
  )
}
