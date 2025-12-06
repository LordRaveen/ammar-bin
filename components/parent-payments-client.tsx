"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DollarSign,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
  ChevronDown,
  ChevronUp,
  Printer,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Props {
  children: any[]
  sessions: any[]
  invoices: any[]
  payments: any[]
  invoiceItems: any[]
}

export function ParentPaymentsClient({ children, sessions, invoices, payments, invoiceItems }: Props) {
  const [selectedChild, setSelectedChild] = useState<string>("all")
  const [selectedSession, setSelectedSession] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedChild !== "all" && inv.student_id !== selectedChild) return false
      if (selectedSession !== "all" && inv.session_id !== selectedSession) return false
      if (selectedStatus !== "all" && inv.status !== selectedStatus) return false
      return true
    })
  }, [invoices, selectedChild, selectedSession, selectedStatus])

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (selectedChild !== "all" && payment.student_id !== selectedChild) return false
      return true
    })
  }, [payments, selectedChild])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const relevantInvoices =
      selectedChild === "all" ? invoices : invoices.filter((inv) => inv.student_id === selectedChild)

    const totalBilled = relevantInvoices.reduce((sum, inv) => sum + Number.parseFloat(inv.total_amount || "0"), 0)
    const totalPaid = relevantInvoices.reduce((sum, inv) => sum + Number.parseFloat(inv.amount_paid || "0"), 0)
    const totalOutstanding = relevantInvoices.reduce((sum, inv) => sum + Number.parseFloat(inv.balance || "0"), 0)

    const now = new Date()
    const overdueCount = relevantInvoices.filter(
      (inv) => inv.status !== "Paid" && Number.parseFloat(inv.balance) > 0 && new Date(inv.due_date) < now,
    ).length

    return {
      totalBilled,
      totalPaid,
      totalOutstanding,
      overdueCount,
      paidCount: relevantInvoices.filter((inv) => inv.status === "Paid").length,
      pendingCount: relevantInvoices.filter((inv) => inv.status === "Pending" || inv.status === "Partial").length,
    }
  }, [invoices, selectedChild])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "default"
      case "Partial":
        return "secondary"
      case "Pending":
        return "outline"
      case "Overdue":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="h-4 w-4" />
      case "Overdue":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getInvoiceItems = (invoiceId: string) => {
    return invoiceItems.filter((item) => item.invoice_id === invoiceId)
  }

  const getInvoicePayments = (invoiceId: string) => {
    return payments.filter((payment) => payment.invoice_id === invoiceId)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Payments</h1>
        <p className="text-muted-foreground">View invoices, payments, and fee history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary.totalBilled.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{summary.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{summary.paidCount} invoice(s) paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₦{summary.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{summary.pendingCount} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              {summary.overdueCount > 0 ? "Requires attention" : "All up to date"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter invoices and payments by child, session, or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Child</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Children</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>{filteredInvoices.length} invoice(s) found</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={invoice.students.photo_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {invoice.students.first_name?.[0]}
                            {invoice.students.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{invoice.invoice_number}</p>
                            <Badge variant={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.students.first_name} {invoice.students.last_name} • {invoice.sessions.name} -{" "}
                            {invoice.terms.name}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              Total: ₦{Number.parseFloat(invoice.total_amount).toLocaleString()}
                            </span>
                            <span className="text-green-600">
                              Paid: ₦{Number.parseFloat(invoice.amount_paid).toLocaleString()}
                            </span>
                            <span className="text-orange-600 font-medium">
                              Balance: ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(invoice)}>
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {expandedInvoice === invoice.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedInvoice === invoice.id && (
                    <div className="border-t p-4 bg-muted/20 space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Fee Breakdown</h4>
                        <div className="space-y-2">
                          {getInvoiceItems(invoice.id).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.fee_categories?.name || item.description}
                              </span>
                              <span className="font-medium">₦{Number.parseFloat(item.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {getInvoicePayments(invoice.id).length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Payment History</h4>
                          <div className="space-y-2">
                            {getInvoicePayments(invoice.id).map((payment) => (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between text-sm p-2 bg-background rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-muted-foreground" />
                                  <span>{payment.receipt_number}</span>
                                  <Badge variant="secondary">{payment.payment_method}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600 font-medium">
                                    ₦{Number.parseFloat(payment.amount).toLocaleString()}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {new Date(payment.payment_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No invoices found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>{filteredPayments.length} payment(s) recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.receipt_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.students.first_name} {payment.students.last_name} • {payment.invoices?.invoice_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ₦{Number.parseFloat(payment.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {payment.payment_method}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No payments found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>Complete invoice breakdown and payment history</DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-lg">{selectedInvoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInvoice.students.first_name} {selectedInvoice.students.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInvoice.sessions.name} - {selectedInvoice.terms.name}
                  </p>
                </div>
                <Badge variant={getStatusColor(selectedInvoice.status)} className="text-sm">
                  {selectedInvoice.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Fee Items</h4>
                <div className="border rounded-lg divide-y">
                  {getInvoiceItems(selectedInvoice.id).map((item) => (
                    <div key={item.id} className="flex justify-between p-3">
                      <div>
                        <p className="font-medium">{item.fee_categories?.name || "Fee"}</p>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      </div>
                      <p className="font-medium">₦{Number.parseFloat(item.amount).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 bg-muted font-semibold">
                    <span>Total Amount</span>
                    <span>₦{Number.parseFloat(selectedInvoice.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Payment Summary</h4>
                <div className="grid gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">
                      ₦{Number.parseFloat(selectedInvoice.total_amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-medium text-green-600">
                      ₦{Number.parseFloat(selectedInvoice.amount_paid).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-medium text-orange-600">
                      ₦{Number.parseFloat(selectedInvoice.balance).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {getInvoicePayments(selectedInvoice.id).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Payment History</h4>
                  <div className="border rounded-lg divide-y">
                    {getInvoicePayments(selectedInvoice.id).map((payment) => (
                      <div key={payment.id} className="flex justify-between p-3">
                        <div>
                          <p className="font-medium">{payment.receipt_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                          </p>
                        </div>
                        <p className="font-medium text-green-600">
                          ₦{Number.parseFloat(payment.amount).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1 bg-transparent" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                <Button className="flex-1 bg-transparent" variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
