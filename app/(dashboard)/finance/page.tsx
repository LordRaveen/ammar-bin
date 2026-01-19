import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DollarSign, FileText, Receipt, TrendingUp, Calendar, Search, Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get financial stats
  const { data: invoices } = await supabase.from("invoices").select("*")
  const { data: payments } = await supabase.from("payments").select("*")

  // Calculate stats
  const totalRevenue = payments?.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0
  const totalPending = invoices?.reduce((sum, i) => sum + Number.parseFloat(i.balance), 0) || 0
  const paidInvoices = invoices?.filter((i) => i.status === "Paid").length || 0
  const collectionRate = invoices?.length ? ((paidInvoices / invoices.length) * 100).toFixed(0) : 0
  
  // Get today's invoices
  const today = new Date().toISOString().split("T")[0]
  const todayInvoices = invoices?.filter((i) => i.created_at?.startsWith(today)).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-7 lg:max-w-4xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collect">Collect payment</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reversals">Reversals</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards - 5 columns */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collected Today</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{payments?.length || 0} payment(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{totalPending.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{invoices?.filter((i) => i.status === "Pending").length || 0} pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                <Receipt className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paidInvoices}</div>
                <p className="text-xs text-muted-foreground">Total: {invoices?.length || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collectionRate}%</div>
                <p className="text-xs text-muted-foreground">{paidInvoices} of {invoices?.length || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoices Generated Today</CardTitle>
                <Calendar className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayInvoices}</div>
                <p className="text-xs text-muted-foreground">New invoices today</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Action Buttons */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name / ID"
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Button asChild variant="default" className="bg-green-600 hover:bg-green-700">
                <Link href="/finance/payments">Collect payment</Link>
              </Button>
              <Button asChild variant="default" className="bg-teal-600 hover:bg-teal-700">
                <Link href="/finance/invoices">Generate Invoice</Link>
              </Button>
            </div>
          </div>

          {/* Recent Payments and Due Invoices */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments?.slice(0, 5).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Payment Received</p>
                        <p className="text-xs text-muted-foreground">Just now</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₦{Number.parseFloat(payment.amount).toLocaleString()}</p>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Success</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Due Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices?.filter((i: any) => i.status === "Pending").slice(0, 5).map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Invoice #{invoice.id?.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">Due date</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">₦{Number.parseFloat(invoice.balance).toLocaleString()}</p>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Overdue</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other Tabs */}
        <TabsContent value="collect">
          <Card>
            <CardHeader>
              <CardTitle>Collect Payment</CardTitle>
              <CardDescription>Record and manage student payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Payment collection interface coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Generate and manage student invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Invoice management interface coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>View and search student fee status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Student fee search interface coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Track and manage all payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Payment tracking interface coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reversals">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reversals</CardTitle>
              <CardDescription>Manage and approve payment reversals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Payment reversal interface coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Financial Report</CardTitle>
              <CardDescription>Generate financial reports and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Financial reporting interface coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
