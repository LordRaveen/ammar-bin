"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Search, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { format } from "date-fns"

interface Cashier {
  id: string
  first_name: string
  last_name: string
  staff_id: string
}

interface Class {
  id: string
  name: string
}

interface Payment {
  id: string
  receipt_number: string
  payment_date: string
  amount: number
  payment_method: string
  reference_number: string | null
  remarks: string | null
  student: {
    student_id: string
    first_name: string
    last_name: string
  }
  invoice: {
    invoice_number: string
  }
  cashier: {
    first_name: string
    last_name: string
    staff_id: string
  }
}

interface ReportData {
  payments: Payment[]
  summary: {
    totalAmount: number
    totalCount: number
    averagePayment: number
    byMethod: {
      cash: number
      transfer: number
      pos: number
    }
  }
}

export function PaymentHistoryReportClient({
  cashiers,
  classes,
}: {
  cashiers: Cashier[]
  classes: Class[]
}) {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [paymentMethod, setPaymentMethod] = useState("all")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedCashier, setSelectedCashier] = useState("all")
  const [studentSearch, setStudentSearch] = useState("")
  const [groupBy, setGroupBy] = useState<"none" | "day" | "week" | "month">("none")
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        paymentMethod,
        classId: selectedClass,
        cashierId: selectedCashier,
        studentSearch,
        groupBy,
      })

      const response = await fetch(`/api/reports/payment-history?${params}`)
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error("Error fetching payment history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!reportData) return

    const headers = [
      "Receipt #",
      "Date",
      "Student ID",
      "Student Name",
      "Invoice #",
      "Amount",
      "Method",
      "Reference",
      "Received By",
    ]
    const rows = reportData.payments.map((payment) => [
      payment.receipt_number,
      format(new Date(payment.payment_date), "dd/MM/yyyy"),
      payment.student.student_id,
      `${payment.student.first_name} ${payment.student.last_name}`,
      payment.invoice.invoice_number,
      payment.amount.toFixed(2),
      payment.payment_method,
      payment.reference_number || "-",
      `${payment.cashier.first_name} ${payment.cashier.last_name}`,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payment-history-${startDate}-to-${endDate}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Customize your payment history report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier">Cashier</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger id="cashier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cashiers</SelectItem>
                  {cashiers.map((cashier) => (
                    <SelectItem key={cashier.id} value={cashier.id}>
                      {cashier.first_name} {cashier.last_name} ({cashier.staff_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger id="groupBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="studentSearch">Student Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="studentSearch"
                  placeholder="Search by student ID or name..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchReport} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Loading..." : "Generate Report"}
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={!reportData}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!reportData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{reportData.summary.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{reportData.summary.totalCount} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{reportData.summary.averagePayment.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{reportData.summary.byMethod.cash.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((reportData.summary.byMethod.cash / reportData.summary.totalAmount) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transfer + POS</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{(reportData.summary.byMethod.transfer + reportData.summary.byMethod.pos).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {(
                  ((reportData.summary.byMethod.transfer + reportData.summary.byMethod.pos) /
                    reportData.summary.totalAmount) *
                  100
                ).toFixed(1)}
                % of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment History Table */}
      {reportData && (
        <Card>
          <CardHeader className="print:p-6">
            <div className="hidden print:block text-center mb-4">
              <h2 className="text-2xl font-bold">Payment History Report</h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(startDate), "dd/MM/yyyy")} - {format(new Date(endDate), "dd/MM/yyyy")}
              </p>
            </div>
            <CardTitle>Payment Transactions</CardTitle>
            <CardDescription>
              Showing {reportData.payments.length} payments from {format(new Date(startDate), "dd MMM yyyy")} to{" "}
              {format(new Date(endDate), "dd MMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Received By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No payments found for the selected criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.receipt_number}</TableCell>
                        <TableCell>{format(new Date(payment.payment_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {payment.student.first_name} {payment.student.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{payment.student.student_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>{payment.invoice.invoice_number}</TableCell>
                        <TableCell className="text-right font-medium">₦{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.payment_method === "Cash"
                                ? "default"
                                : payment.payment_method === "Bank Transfer"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {payment.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{payment.reference_number || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {payment.cashier.first_name} {payment.cashier.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{payment.cashier.staff_id}</div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {reportData.payments.length > 0 && (
              <div className="mt-4 flex justify-end border-t pt-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">₦{reportData.summary.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Print Footer */}
      <div className="hidden print:block mt-8 space-y-8">
        <div className="grid grid-cols-2 gap-8 pt-8 border-t">
          <div>
            <p className="text-sm font-medium mb-2">Prepared By:</p>
            <div className="border-t border-black pt-1 mt-8">
              <p className="text-sm">Cashier/Accountant Signature</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Verified By:</p>
            <div className="border-t border-black pt-1 mt-8">
              <p className="text-sm">Accountant/Admin Signature</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Generated on {format(new Date(), "dd/MM/yyyy HH:mm")}
        </p>
      </div>
    </div>
  )
}
