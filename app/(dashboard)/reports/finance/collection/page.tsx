import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { PaymentCollectionSummaryClient } from "@/components/payment-collection-summary-client"

export const dynamic = "force-dynamic"

export default async function PaymentCollectionSummaryPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get all sessions
  const { data: sessions } = await supabase.from("sessions").select("*").order("start_date", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Collection Summary</h1>
        <p className="text-muted-foreground">Aggregate payment statistics and trends</p>
      </div>

      <PaymentCollectionSummaryClient sessions={sessions || []} />
    </div>
  )
}
