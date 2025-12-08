import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import AuditTrailClient from "@/components/audit-trail-client"

export const dynamic = "force-dynamic"

export default async function AuditTrailPage() {
  const supabase = await createServerClient()

  // Fetch audit logs with user details
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      `
      *,
      user:performed_by (
        id,
        email
      )
    `,
    )
    .order("performed_at", { ascending: false })
    .limit(500)

  const { data: teachers } = await supabase.from("teachers").select("user_id, first_name, last_name, staff_id")

  const logsWithNames = logs?.map((log) => {
    const teacher = teachers?.find((t) => t.user_id === log.performed_by)
    return {
      ...log,
      performed_by_name: teacher
        ? `${teacher.first_name} ${teacher.last_name} (${teacher.staff_id})`
        : log.user?.email || "System",
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Trail</h1>
        <p className="text-muted-foreground">Complete history of all financial transactions and modifications</p>
      </div>

      <Suspense fallback={<div>Loading audit logs...</div>}>
        <AuditTrailClient logs={logsWithNames || []} />
      </Suspense>
    </div>
  )
}
