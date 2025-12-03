import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Receipt, TrendingUp, Users, FileText, AlertCircle, CreditCard, Wallet } from "lucide-react"
import Link from "next/link"
import { QuickPaymentEntry } from "@/components/quick-payment-entry"

export const dynamic = "force-dynamic"

export default async function CashierDashboardPage() {
  const user = await requireAuth(["accountant", "cashier"])
  const supabase = await createServerClient()

  // Get staff record
  const { data: staff } = await supabase
    .from("teachers")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle()

  // Get active session and term
  const { data: activeSession } = await supabase
    .from("sessions")
    .select("*, terms(*)")
    .eq("is_active", true)
    .maybeSingle()

  const activeTerm = activeSession?.terms?.find((t: any) => t.is_active)

  // Today's date for filtering
  const today = new Date().toISOString().split("T")[0]

  // Get today's payments
  const { data: todaysPayments } = await supabase
    .from("payments")
    .select("*")
    .gte("payment_date", today)
    .lte("payment_date", today)

  const todaysTotal = todaysPayments?.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0
  const todaysCash =
    todaysPayments
      ?.filter((p) => p.payment_method === "Cash")
      .reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0
  const todaysTransfer =
    todaysPayments
      ?.filter((p) => p.payment_method === "Bank Transfer")
      .reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0
  const todaysPOS =
    todaysPayments
      ?.filter((p) => p.payment_method === "POS")
      .reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0

  // Get all invoices stats
  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("session_id", activeSession?.id)
    .eq("term_id", activeTerm?.id)

  const pendingInvoices = allInvoices?.filter((i) => i.status === "Pending").length || 0
  const overdueInvoices =
    allInvoices?.filter((i) => {
      if (i.status === "Pending" && i.due_date) {
        return new Date(i.due_date) < new Date()
      }
      return false
    }).length || 0

  const totalOutstanding = allInvoices?.reduce((sum, i) => sum + Number.parseFloat(i.balance || "0"), 0) || 0

  // Get recent payments
  const { data: recentPayments } = await supabase
    .from("payments")
    .select(`
      id,
      receipt_number,
      amount,
      payment_method,
      payment_date,
      students (
        first_name,
        last_name,
        student_id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  // Collection rate
  const paidInvoices = allInvoices?.filter((i) => i.status === "Paid").length || 0
  const collectionRate = allInvoices?.length ? ((paidInvoices / allInvoices.length) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {staff?.first_name || "Cashier"}</h1>
        <p className="text-muted-foreground">Here's an overview of today's financial activities</p>
      </div>

      {activeSession && activeTerm && (
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Active Session</CardTitle>
            <CardDescription className="text-primary-foreground/80">Current academic period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{activeSession.name}</p>
              <p className="text-lg">{activeTerm.name}</p>
              <p className="text-sm text-primary-foreground/80">
                {new Date(activeTerm.start_date).toLocaleDateString()} -{" "}
                {new Date(activeTerm.end_date).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <QuickPaymentEntry />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{todaysTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{todaysPayments?.length || 0} payment(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Students</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices} of {allInvoices?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cash Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Wallet className="h-8 w-8 text-green-600" />
              <div className="text-right">
                <p className="text-2xl font-bold">₦{todaysCash.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bank Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div className="text-right">
                <p className="text-2xl font-bold">₦{todaysTransfer.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">POS Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div className="text-right">
                <p className="text-2xl font-bold">₦{todaysPOS.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/finance/payments/record">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <Receipt className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Record Payment</p>
                    <p className="text-xs text-muted-foreground">Enter new payment and print receipt</p>
                  </div>
                </div>
              </Link>

              <Link href="/students">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Search Student</p>
                    <p className="text-xs text-muted-foreground">Find student fee status</p>
                  </div>
                </div>
              </Link>

              <Link href="/finance/invoices">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">View Invoices</p>
                    <p className="text-xs text-muted-foreground">Check pending and paid invoices</p>
                  </div>
                </div>
              </Link>

              <Link href="/reports">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Generate Reports</p>
                    <p className="text-xs text-muted-foreground">Daily cash and debtors report</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments && recentPayments.length > 0 ? (
                recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {payment.students?.first_name} {payment.students?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.receipt_number} - {payment.payment_method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₦{Number.parseFloat(payment.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent payments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {overdueInvoices > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Attention Required
            </CardTitle>
            <CardDescription>Students with overdue payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                There are <span className="font-bold text-destructive">{overdueInvoices}</span> overdue invoices
                totaling <span className="font-bold">₦{totalOutstanding.toLocaleString()}</span>
              </p>
              <Link href="/finance/invoices?filter=overdue">
                <div className="text-sm text-primary hover:underline cursor-pointer">View debtors list →</div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
