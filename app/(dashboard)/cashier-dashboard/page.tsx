import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Receipt, Users, TrendingUp, Calendar, CreditCard, Banknote, AlertCircle } from "lucide-react"
import Link from "next/link"
import { QuickPaymentEntry } from "@/components/quick-payment-entry"
import { RecentPayments } from "@/components/recent-payments"

export const dynamic = "force-dynamic"

export default async function CashierDashboardPage() {
  const user = await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get teacher/staff name
  const { data: teacher } = await supabase
    .from("teachers")
    .select("first_name, last_name")
    .eq("user_id", user.id)
    .single()

  const cashierName = teacher ? `${teacher.first_name} ${teacher.last_name}` : "Cashier"

  // Get today's date
  const today = new Date().toISOString().split("T")[0]

  // Get today's collections
  const { data: todayPayments } = await supabase
    .from("payments")
    .select("amount, payment_method, created_at")
    .gte("payment_date", today)
    .lte("payment_date", today)

  const todayTotal = todayPayments?.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0
  const todayCash =
    todayPayments
      ?.filter((p) => p.payment_method === "Cash")
      .reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0
  const todayTransfer =
    todayPayments
      ?.filter((p) => p.payment_method === "Bank Transfer")
      .reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0
  const todayPOS =
    todayPayments?.filter((p) => p.payment_method === "POS").reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) ||
    0

  // Get this week's collections (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoDate = weekAgo.toISOString().split("T")[0]

  const { data: weekPayments } = await supabase.from("payments").select("amount").gte("payment_date", weekAgoDate)

  const weekTotal = weekPayments?.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0

  // Get this month's collections
  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStartDate = monthStart.toISOString().split("T")[0]

  const { data: monthPayments } = await supabase.from("payments").select("amount").gte("payment_date", monthStartDate)

  const monthTotal = monthPayments?.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0

  // Get invoice stats
  const { data: invoices } = await supabase.from("invoices").select("status, balance, total_amount")

  const pendingInvoices = invoices?.filter((i) => i.status === "Pending" || i.status === "Partial").length || 0
  const overdueInvoices = invoices?.filter((i) => i.status === "Overdue").length || 0
  const totalOutstanding = invoices?.reduce((sum, i) => sum + Number.parseFloat(i.balance), 0) || 0

  const collectionRate = invoices?.length
    ? ((invoices.filter((i) => i.status === "Paid").length / invoices.length) * 100).toFixed(0)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cashier Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {cashierName}</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Badge>
      </div>

      {/* Today's Collections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{todayTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{todayPayments?.length || 0} transaction(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{weekTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{monthTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{monthPayments?.length || 0} payment(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionRate}%</div>
            <p className="text-xs text-muted-foreground">Of total invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown (Today) */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Payment Breakdown</CardTitle>
          <CardDescription>Collections by payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Cash</p>
                <p className="text-2xl font-bold">₦{todayCash.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Bank Transfer</p>
                <p className="text-2xl font-bold">₦{todayTransfer.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">POS</p>
                <p className="text-2xl font-bold">₦{todayPOS.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Fees Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Users className="h-5 w-5" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingInvoices}</div>
            <p className="text-sm text-muted-foreground mt-1">Students with outstanding fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overdueInvoices}</div>
            <p className="text-sm text-muted-foreground mt-1">Invoices past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₦{totalOutstanding.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">Total pending amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Payment Entry */}
        <QuickPaymentEntry />

        {/* Recent Payments */}
        <RecentPayments />
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/finance/payments/record" className="group">
              <div className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <Receipt className="h-6 w-6 mb-2 text-primary" />
                <h3 className="font-semibold mb-1">Record Payment</h3>
                <p className="text-xs text-muted-foreground">Process a new payment</p>
              </div>
            </Link>

            <Link href="/reports/finance/debtors" className="group">
              <div className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <Users className="h-6 w-6 mb-2 text-orange-600" />
                <h3 className="font-semibold mb-1">View Debtors</h3>
                <p className="text-xs text-muted-foreground">Students with outstanding fees</p>
              </div>
            </Link>

            <Link href="/reports/finance/daily-cash" className="group">
              <div className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <DollarSign className="h-6 w-6 mb-2 text-green-600" />
                <h3 className="font-semibold mb-1">Daily Cash Report</h3>
                <p className="text-xs text-muted-foreground">Today's cash summary</p>
              </div>
            </Link>

            <Link href="/finance/invoices" className="group">
              <div className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <AlertCircle className="h-6 w-6 mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">View Invoices</h3>
                <p className="text-xs text-muted-foreground">All student invoices</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
