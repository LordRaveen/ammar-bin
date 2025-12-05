import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, Receipt, TrendingUp } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get financial stats
  const { data: invoices } = await supabase.from("invoices").select("*")

  const { data: payments } = await supabase.from("payments").select("*")

  const totalRevenue = payments?.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0
  const totalPending = invoices?.reduce((sum, i) => sum + Number.parseFloat(i.balance), 0) || 0
  const paidInvoices = invoices?.filter((i) => i.status === "Paid").length || 0
  const pendingInvoices = invoices?.filter((i) => i.status === "Pending").length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
        <p className="text-muted-foreground">Manage fees, invoices, and payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {payments?.length || 0} payment(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {pendingInvoices} invoice(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
            <p className="text-xs text-muted-foreground">Total: {invoices?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices?.length ? ((paidInvoices / invoices.length) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices} of {invoices?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/finance/students/search">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Student Fee Search
              </CardTitle>
              <CardDescription>Search and view student fee status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View complete fee history, invoices, and payment status</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/invoices">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoices
              </CardTitle>
              <CardDescription>Generate and manage student invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View all invoices and generate new ones</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/payments">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payments
              </CardTitle>
              <CardDescription>Record and track payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Record new payments and print receipts</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
