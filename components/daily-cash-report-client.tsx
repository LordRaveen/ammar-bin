"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Printer, Search, Banknote, CreditCard, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Payment {
  id: string
  receipt_number: string
  student_id: string
  student_name: string
  amount: number
  payment_method: string
  reference_number: string | null
  payment_date: string
  cashier_name: string
  remarks: string | null
}

interface PaymentSummary {
  cash: number
  transfer: number
  pos: number
  total: number
  cashCount: number
  transferCount: number
  posCount: number
  totalCount: number
}

interface DailyCashReportClientProps {
  cashiers: Array<{
    id: string
    first_name: string
    last_name: string
    staff_id: string
  }>
}

export function DailyCashReportClient({ cashiers }: DailyCashReportClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedCashier, setSelectedCashier] = useState<string>("all")
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        cashier: selectedCashier,
      })

      const response = await fetch(`/api/reports/daily-cash?${params}`)
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments)
        setSummary(data.summary)
      } else {
        console.error("Error fetching report:", data.error)
      }
    } catch (error) {
      console.error("Error fetching report:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ["Receipt No", "Student", "Amount", "Method", "Reference", "Time", "Cashier"]
    const rows = payments.map((p) => [
      p.receipt_number,
      p.student_name,
      p.amount.toFixed(2),
      p.payment_method,
      p.reference_number || "N/A",
      new Date(p.payment_date).toLocaleTimeString(),
      p.cashier_name,
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `daily-cash-report-${selectedDate}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashier">Cashier</Label>
              <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                <SelectTrigger id="cashier">
                  <SelectValue placeholder="All Cashiers" />
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

            <div className="flex items-end">
              <Button onClick={fetchReport} disabled={loading} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{summary.cash.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.cashCount} transaction{summary.cashCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bank Transfer</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{summary.transfer.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.transferCount} transaction{summary.transferCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">POS Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{summary.pos.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.posCount} transaction{summary.posCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₦{summary.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalCount} total transaction{summary.totalCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Print Header (hidden on screen, visible on print) */}
          <div className="hidden print:block space-y-2 mb-6">
            <h1 className="text-2xl font-bold text-center">Daily Cash Report</h1>
            <div className="text-center text-sm">
              <p>
                Date:{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {selectedCashier !== "all" && (
                <p>
                  Cashier: {cashiers.find((c) => c.id === selectedCashier)?.first_name}{" "}
                  {cashiers.find((c) => c.id === selectedCashier)?.last_name}
                </p>
              )}
            </div>
            <div className="border-t-2 border-black mt-4 mb-4" />
          </div>

          {/* Payment Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="print:hidden">Reference</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="print:hidden">Cashier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No payments found for this date
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.receipt_number}</TableCell>
                        <TableCell>{payment.student_name}</TableCell>
                        <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
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
                        <TableCell className="print:hidden">{payment.reference_number || "N/A"}</TableCell>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="print:hidden">{payment.cashier_name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Summary Footer for Print */}
              {payments.length > 0 && (
                <div className="mt-6 space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Cash Payments ({summary.cashCount}):</span>
                    <span className="font-semibold">₦{summary.cash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bank Transfer ({summary.transferCount}):</span>
                    <span className="font-semibold">₦{summary.transfer.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>POS Payments ({summary.posCount}):</span>
                    <span className="font-semibold">₦{summary.pos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Collections ({summary.totalCount}):</span>
                    <span className="text-green-600">₦{summary.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Print Footer */}
          <div className="hidden print:block mt-12 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-sm">Prepared By:</p>
                <div className="border-t border-black pt-1">
                  <p className="text-sm">Cashier Signature & Date</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm">Verified By:</p>
                <div className="border-t border-black pt-1">
                  <p className="text-sm">Accountant Signature & Date</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
