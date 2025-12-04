import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { RevenueReportClient } from "@/components/revenue-report-client"

export const dynamic = "force-dynamic"

export default async function RevenueReportPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get all sessions
  const { data: sessions } = await supabase.from("sessions").select("*").order("start_date", { ascending: false })

  // Get all fee categories
  const { data: feeCategories } = await supabase.from("fee_categories").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue Report</h1>
        <p className="text-muted-foreground">Income summary by session, term, and fee category</p>
      </div>

      <RevenueReportClient sessions={sessions || []} feeCategories={feeCategories || []} />
    </div>
  )
}
