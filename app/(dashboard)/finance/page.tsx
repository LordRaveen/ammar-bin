import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DollarSign, FileText, Receipt, TrendingUp, Calendar, Search, Plus, CreditCard, FileCheck, InboxIcon } from "lucide-react"
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

      <Tabs defaultValue="overview" className="w-full py-3">
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
          {/* KPI Cards - 5 columns - Compact */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Card className="border shadow-none py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Collected Today</p>
                  <p className="text-lg font-bold text-green-600">₦{totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </Card>

            <Card className="border shadow-none py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Outstanding Balance</p>
                  <p className="text-lg font-bold text-orange-600">₦{totalPending.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
            </Card>

            <Card className="border shadow-none py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Paid Invoices</p>
                  <p className="text-lg font-bold text-blue-600">{paidInvoices}</p>
                </div>
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
            </Card>

            <Card className="border shadow-none py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Collection Rate</p>
                  <p className="text-lg font-bold text-purple-600">{collectionRate}%</p>
                </div>
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </Card>

            <Card className="border shadow-none py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Invoices Generated Today</p>
                  <p className="text-lg font-bold text-teal-600">{todayInvoices}</p>
                </div>
                <Calendar className="h-4 w-4 text-teal-600" />
              </div>
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
              <Button asChild variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors bg-transparent">
                <Link href="/finance/payments" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Collect payment
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white transition-colors bg-transparent">
                <Link href="/finance/invoices" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Generate Invoice
                </Link>
              </Button>
            </div>
          </div>

          {/* Recent Payments and Due Invoices */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {!payments || payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <InboxIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                    <p className="font-medium text-muted-foreground">No payments yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Payments will appear here as they are recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments?.slice(0, 5).map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors">
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
                )}
              </CardContent>
            </Card>

            {/* Due Invoices with Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Due Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {!invoices || invoices.filter((i: any) => i.status === "Pending").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                    <p className="font-medium text-muted-foreground">No due invoices</p>
                    <p className="text-sm text-muted-foreground mt-1">All invoices are settled</p>
                  </div>
                ) : (
                  <Tabs defaultValue="overdue" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="overdue" className="text-xs">Overdue</TabsTrigger>
                      <TabsTrigger value="today" className="text-xs">Due today</TabsTrigger>
                      <TabsTrigger value="2days" className="text-xs">Due in 2 days</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overdue" className="space-y-3 mt-0">
                      {invoices?.filter((i: any) => i.status === "Pending" && new Date(i.due_date) < new Date()).slice(0, 5).length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No overdue invoices</p>
                      ) : (
                        invoices?.filter((i: any) => i.status === "Pending" && new Date(i.due_date) < new Date()).slice(0, 5).map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-sm">Invoice #{invoice.id?.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">Overdue</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">₦{Number.parseFloat(invoice.balance).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="today" className="space-y-3 mt-0">
                      {invoices?.filter((i: any) => i.status === "Pending" && new Date(i.due_date).toDateString() === new Date().toDateString()).slice(0, 5).length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No invoices due today</p>
                      ) : (
                        invoices?.filter((i: any) => i.status === "Pending" && new Date(i.due_date).toDateString() === new Date().toDateString()).slice(0, 5).map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-sm">Invoice #{invoice.id?.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">Due today</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-yellow-600">₦{Number.parseFloat(invoice.balance).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="2days" className="space-y-3 mt-0">
                      {invoices?.filter((i: any) => {
                        const dueDate = new Date(i.due_date)
                        const twoDaysFromNow = new Date()
                        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
                        return i.status === "Pending" && dueDate > new Date() && dueDate <= twoDaysFromNow
                      }).slice(0, 5).length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No invoices due in 2 days</p>
                      ) : (
                        invoices?.filter((i: any) => {
                          const dueDate = new Date(i.due_date)
                          const twoDaysFromNow = new Date()
                          twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
                          return i.status === "Pending" && dueDate > new Date() && dueDate <= twoDaysFromNow
                        }).slice(0, 5).map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-sm">Invoice #{invoice.id?.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">Due in 2 days</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600">₦{Number.parseFloat(invoice.balance).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                )}
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
