import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { AccountLockoutsClient } from "@/components/account-lockouts-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AccountLockoutsPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Check if user is admin
  const { data: teacher } = await supabase.from("teachers").select("role").eq("user_id", user.id).single()

  if (!teacher || (teacher.role !== "admin" && teacher.role !== "super_admin")) {
    redirect("/dashboard")
  }

  // Fetch locked accounts
  const { data: lockouts, error } = await supabase
    .from("account_lockouts")
    .select("*")
    .order("updated_at", { ascending: false })

  // Fetch recent login attempts
  const { data: attempts } = await supabase
    .from("login_attempts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Lockouts</h1>
        <p className="text-muted-foreground mt-2">Manage locked accounts and view failed login attempts</p>
      </div>

      <AccountLockoutsClient initialLockouts={lockouts || []} initialAttempts={attempts || []} />
    </div>
  )
}
