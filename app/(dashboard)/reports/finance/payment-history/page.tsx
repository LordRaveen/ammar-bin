import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { PaymentHistoryReportClient } from "@/components/payment-history-report-client"

export const dynamic = "force-dynamic"

export default async function PaymentHistoryReportPage() {
  await requireAuth(["super_admin", "admin", "accountant", "cashier"])
  const supabase = await createServerClient()

  // Get all cashiers/accountants for filter
  const { data: cashiers } = await supabase
    .from("teachers")
    .select("id, first_name, last_name, staff_id")
    .in("role", ["cashier", "accountant", "admin"])
    .order("first_name")

  // Get all classes for filter
  const { data: classes } = await supabase.from("classes").select("id, name").eq("is_active", true).order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment History Report</h1>
        <p className="text-muted-foreground">Comprehensive view of all payment transactions with advanced filtering</p>
      </div>

      <PaymentHistoryReportClient cashiers={cashiers || []} classes={classes || []} />
    </div>
  )
}
