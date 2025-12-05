import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PaymentReversalClient from "@/components/payment-reversal-client"

export const dynamic = "force-dynamic"

export default async function PaymentReversalPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get all payments with student and invoice details
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name
      ),
      invoices (
        invoice_number,
        balance
      ),
      received_by:teachers!payments_received_by_fkey (
        first_name,
        last_name
      )
    `)
    .order("payment_date", { ascending: false })

  // Get existing reversals to check which payments are reversed
  const { data: reversals } = await supabase.from("payment_reversals").select("payment_id")

  const reversedPaymentIds = new Set(reversals?.map((r) => r.payment_id) || [])

  // Filter out already reversed payments
  const availablePayments = payments?.filter((p) => !reversedPaymentIds.has(p.id)) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Payment Reversal</h1>
          <p className="text-muted-foreground">Reverse incorrect payments with admin approval</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Payments</CardTitle>
          <CardDescription>Select a payment to reverse. Requires admin approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentReversalClient payments={availablePayments} />
        </CardContent>
      </Card>
    </div>
  )
}
