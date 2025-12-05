import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ReversalManagementClient from "@/components/reversal-management-client"

export const dynamic = "force-dynamic"

export default async function ReversalManagementPage() {
  await requireAuth(["super_admin", "admin"])
  const supabase = await createServerClient()

  // Get all reversal requests with full details
  const { data: reversals } = await supabase
    .from("payment_reversals")
    .select(`
      *,
      payments (
        receipt_number,
        amount,
        payment_date,
        payment_method,
        students (
          student_id,
          first_name,
          last_name
        ),
        invoices (
          invoice_number,
          balance
        )
      ),
      reversed_by:teachers!payment_reversals_reversed_by_fkey (
        first_name,
        last_name
      ),
      approved_by:teachers!payment_reversals_approved_by_fkey (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })

  const pendingReversals = reversals?.filter((r) => !r.approved_by) || []
  const approvedReversals = reversals?.filter((r) => r.approved_by) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Manage Reversals</h1>
          <p className="text-muted-foreground">Approve or review payment reversal requests</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reversal Requests</CardTitle>
          <CardDescription>
            {pendingReversals.length} pending approval, {approvedReversals.length} processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReversalManagementClient pendingReversals={pendingReversals} approvedReversals={approvedReversals} />
        </CardContent>
      </Card>
    </div>
  )
}
