"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreditCard, FileText, History } from "lucide-react"

interface InvoiceDetailsDrawerProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: "admin" | "accountant" | "parent"
}

export function InvoiceDetailsDrawer({
  invoiceId,
  open,
  onOpenChange,
  userRole = "admin",
}: InvoiceDetailsDrawerProps) {
  const [invoice, setInvoice] = useState<any>(null)
  const [invoiceItems, setInvoiceItems] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) return

      setLoading(true)
      try {
        // Fetch invoice
        const { data: invoiceData } = await supabase
          .from("invoices")
          .select(`
            *,
            students(first_name, last_name, student_id, current_class:student_enrollments(class_id)),
            guardians(first_name, last_name, phone, email)
          `)
          .eq("id", invoiceId)
          .single()

        // Fetch invoice items
        const { data: itemsData } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoiceId)

        // Fetch payments
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("created_at", { ascending: false })

        setInvoice(invoiceData)
        setInvoiceItems(itemsData || [])
        setPayments(paymentsData || [])
      } catch (error) {
        console.error("[v0] Error fetching invoice details:", error)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchInvoiceDetails()
    }
  }, [invoiceId, open, supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Partial":
        return "bg-blue-100 text-blue-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-2xl overflow-y-auto">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading invoice details...</div>
        ) : invoice ? (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle className="text-2xl">Invoice {invoice.invoice_number}</SheetTitle>
              <SheetDescription>Invoice Details & Payment History</SheetDescription>
            </SheetHeader>

            {/* Invoice Header Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-semibold">
                      {invoice.students?.first_name} {invoice.students?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {invoice.students?.student_id}
                    </p>
                  </div>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold">
                      ₦{Number.parseFloat(invoice.total_amount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-lg font-bold text-green-600">
                      ₦{Number.parseFloat(invoice.amount_paid).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-lg font-bold text-red-600">
                      ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-semibold">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="breakdown" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="breakdown" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Breakdown
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
                <TabsTrigger value="parent" className="flex items-center gap-2">
                  Parent Info
                </TabsTrigger>
              </TabsList>

              {/* Fee Breakdown Tab */}
              <TabsContent value="breakdown" className="space-y-3 mt-4">
                {invoiceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoice items</p>
                ) : (
                  <div className="space-y-2">
                    {invoiceItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-muted">
                        <div>
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.fee_category_id}</p>
                        </div>
                        <p className="font-semibold">
                          ₦{Number.parseFloat(item.amount).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3 flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>₦{Number.parseFloat(invoice.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Payment History Tab */}
              <TabsContent value="history" className="space-y-3 mt-4">
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payment history</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200">
                        <div>
                          <p className="font-medium text-sm">Payment Received</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            ₦{Number.parseFloat(payment.amount).toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Parent Info Tab */}
              <TabsContent value="parent" className="space-y-3 mt-4">
                {invoice.guardians && invoice.guardians.length > 0 ? (
                  <div className="space-y-3">
                    {invoice.guardians.map((guardian: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <p className="font-semibold">
                              {guardian.first_name} {guardian.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{guardian.phone}</p>
                            <p className="text-sm text-muted-foreground">{guardian.email}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No parent information</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Collect Payment Button */}
            {invoice.balance > 0 && (
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" size="lg">
                <CreditCard className="h-4 w-4" />
                Collect Payment (₦{Number.parseFloat(invoice.balance).toLocaleString()})
              </Button>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">Invoice not found</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
