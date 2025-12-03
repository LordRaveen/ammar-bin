import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentHistoryReport } from "@/components/reports/payment-history-report"

export const dynamic = "force-dynamic"

export default async function PaymentHistoryReportPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get school settings
  const { data: schoolSettings } = await supabase.from("school_settings").select("*").single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment History Report</h1>
        <p className="text-muted-foreground">View payment transactions by date range</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Payment History</CardTitle>
          <CardDescription>Select date range to view payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentHistoryReport schoolSettings={schoolSettings} />
        </CardContent>
      </Card>
    </div>
  )
}
