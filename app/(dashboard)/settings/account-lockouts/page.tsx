import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { AccountLockoutsClient } from "@/components/account-lockouts-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AccountLockoutsPage() {
  try {
    const user = await requireAuth()
    const supabase = await createServerClient()

    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()

    console.log("[v0] Account lockouts - User:", user.id, "Role:", userRole?.role, "Error:", roleError)

    // Only allow admin and super_admin to access this page
    if (!userRole || (userRole.role !== "admin" && userRole.role !== "super_admin")) {
      console.log("[v0] Access denied - redirecting to dashboard")
      redirect("/dashboard")
    }

    // Fetch locked accounts
    const { data: lockouts, error: lockoutsError } = await supabase
      .from("account_lockouts")
      .select("*")
      .order("updated_at", { ascending: false })

    if (lockoutsError) {
      console.error("[v0] Error fetching lockouts:", lockoutsError)
    }

    // Fetch recent login attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from("login_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (attemptsError) {
      console.error("[v0] Error fetching attempts:", attemptsError)
    }

    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Lockouts</h1>
          <p className="text-muted-foreground mt-2">Manage locked accounts and view failed login attempts</p>
        </div>

        <AccountLockoutsClient initialLockouts={lockouts || []} initialAttempts={attempts || []} />
      </div>
    )
  } catch (error) {
    console.error("[v0] Account lockouts page error:", error)
    redirect("/auth/signin")
  }
}
