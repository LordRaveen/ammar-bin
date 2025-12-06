import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import DailyReconciliationClient from "@/components/daily-reconciliation-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CalendarDays } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ReconciliationPage() {
  await requireAuth(["super_admin", "admin", "accountant", "cashier"])
  const supabase = await createServerClient()

  const today = new Date().toISOString().split("T")[0]

  // Get today's expected totals
  const { data: expectedData } = await supabase.rpc("get_expected_totals_for_date", {
    target_date: today,
  })

  const expectedTotals = expectedData?.[0] || { cash: 0, pos: 0, transfer: 0, total: 0 }

  // Get today's reconciliation if exists
  const { data: todaysReconciliation } = await supabase
    .from("daily_reconciliations")
    .select(
      `
      *,
      reconciled_by_user:teachers!daily_reconciliations_reconciled_by_fkey(first_name, last_name, staff_id),
      approved_by_user:teachers!daily_reconciliations_approved_by_fkey(first_name, last_name, staff_id)
    `,
    )
    .eq("reconciliation_date", today)
    .maybeSingle()

  // Get recent reconciliations
  const { data: recentReconciliations } = await supabase
    .from("daily_reconciliations")
    .select(
      `
      *,
      reconciled_by_user:teachers!daily_reconciliations_reconciled_by_fkey(first_name, last_name, staff_id)
    `,
    )
    .order("reconciliation_date", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">End-of-Day Reconciliation</h1>
          <p className="text-muted-foreground">Reconcile daily cash and payment collections</p>
        </div>
        <CalendarDays className="h-8 w-8 text-muted-foreground" />
      </div>

      <DailyReconciliationClient
        expectedTotals={expectedTotals}
        todaysReconciliation={todaysReconciliation}
        recentReconciliations={recentReconciliations || []}
        today={today}
      />
    </div>
  )
}
