import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { DailyCashReportClient } from "@/components/daily-cash-report-client"

export const dynamic = "force-dynamic"

export default async function DailyCashReportPage() {
  await requireAuth(["super_admin", "admin", "accountant", "cashier"])
  const supabase = await createServerClient()

  // Get all cashiers/accountants for filter
  const { data: cashiers } = await supabase
    .from("teachers")
    .select("id, first_name, last_name, staff_id")
    .in("role", ["cashier", "accountant", "admin"])
    .order("first_name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Cash Report</h1>
        <p className="text-muted-foreground">View payment collections breakdown by date and payment method</p>
      </div>

      <DailyCashReportClient cashiers={cashiers || []} />
    </div>
  )
}
