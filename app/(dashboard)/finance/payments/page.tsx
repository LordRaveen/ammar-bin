import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Download, RotateCcw } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PaymentsPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get all payments with details
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
        invoice_number
      )
    `)
    .order("payment_date", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">View and record student payments</p>
        </div>
        <Link href="/finance/payments/reverse">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reverse Payment
          </Button>
        </Link>
        <Link href="/finance/payments/record">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>{payments?.length || 0} payment(s) recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Receipt No.</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Student</th>
                  <th className="text-left p-2">Invoice</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-left p-2">Method</th>
                  <th className="text-left p-2">Reference</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments && payments.length > 0 ? (
                  payments.map((payment: any) => (
                    <tr key={payment.id} className="border-b">
                      <td className="p-2 font-medium">{payment.receipt_number}</td>
                      <td className="p-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="p-2">
                        <Link href={`/students/${payment.students.id}`} className="hover:underline">
                          {payment.students.first_name} {payment.students.last_name}
                          <br />
                          <span className="text-xs text-muted-foreground">{payment.students.student_id}</span>
                        </Link>
                      </td>
                      <td className="p-2">
                        <Link
                          href={`/finance/invoices/${payment.invoice_id}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {payment.invoices?.invoice_number}
                        </Link>
                      </td>
                      <td className="p-2 text-right font-medium text-green-600">
                        ₦{Number.parseFloat(payment.amount).toLocaleString()}
                      </td>
                      <td className="p-2">
                        <Badge variant="secondary">{payment.payment_method}</Badge>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">{payment.reference_number || "-"}</td>
                      <td className="p-2 text-center">
                        <Link href={`/finance/receipts/${payment.id}`}>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No payments recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
