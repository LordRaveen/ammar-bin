import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { SecurityTab } from "@/components/settings/security-tab"

export const dynamic = "force-dynamic"

export default async function SecurityPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [
    { data: rawAuditLogs },
    { data: lockouts },
    { data: loginAttempts },
    { data: teachers },
  ] = await Promise.all([
    supabase.from("audit_logs").select("*").order("performed_at", { ascending: false }).limit(1000),
    supabase.from("account_lockouts").select("*").order("locked_until", { ascending: false }),
    supabase.from("login_attempts").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("user_profiles").select("id, first_name, last_name, email"),
  ])

  const teacherMap = new Map((teachers || []).map((t: any) => [t.id, `${t.first_name} ${t.last_name}`]))
  const auditLogs = (rawAuditLogs || []).map((log: any) => ({
    ...log,
    performed_by_name: teacherMap.get(log.performed_by) || "System",
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 max-w-full overflow-hidden">
      <SecurityTab 
        auditLogs={auditLogs} 
        lockouts={lockouts || []} 
        loginAttempts={loginAttempts || []} 
      />
    </div>
  )
}
