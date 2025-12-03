import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BulkReceiptPrint } from "@/components/bulk-receipt-print"

export const dynamic = "force-dynamic"

export default async function BulkReceiptPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get school settings
  const { data: schoolSettings } = await supabase.from("school_settings").select("*").single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Receipt Printing</h1>
        <p className="text-muted-foreground">Print multiple receipts at once</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Receipts</CardTitle>
          <CardDescription>Select date range and payment method to generate receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <BulkReceiptPrint schoolSettings={schoolSettings} />
        </CardContent>
      </Card>
    </div>
  )
}
