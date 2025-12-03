"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PaymentHistoryReportProps {
  schoolSettings: any
}

export function PaymentHistoryReport({ schoolSettings }: PaymentHistoryReportProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("all")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates")
      return
    }

    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("payments")
      .select(`
        *,
        students (first_name, last_name, student_id),
        invoices (invoice_number),
        received_by_user:teachers!received_by (first_name, last_name, staff_id)
      `)
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)
      .order("payment_date", { ascending: false })

    if (paymentMethod !== "all") {
      query = query.eq("payment_method", paymentMethod)
    }

    const { data: payments, error } = await query

    if (error) {
      toast.error("Failed to generate report")
      console.error(error)
      setLoading(false)
      return
    }

    const totalAmount = payments?.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0) || 0

    setReportData({ payments, totalAmount })
    setLoading(false)
    toast.success("Report generated successfully")
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-method">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger id="payment-method">
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
        <div className="flex items-end">
          <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <>
          <div className="flex justify-end gap-2 print:hidden">
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>

          <div className="border rounded-lg print:border-0">
            {/* Print Header */}
            <div className="hidden print:block p-6 text-center">
              <h2 className="text-2xl font-bold">{schoolSettings?.school_name}</h2>
              <p className="text-muted-foreground">{schoolSettings?.address}</p>
              <h3 className="text-xl font-semibold mt-4">Payment History Report</h3>
              <p className="text-sm text-muted-foreground">
                Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted border-b">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{reportData.payments?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">₦{reportData.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Date</th>
                    <th className="text-left p-3 text-sm font-medium">Receipt No.</th>
                    <th className="text-left p-3 text-sm font-medium">Student</th>
                    <th className="text-left p-3 text-sm font-medium">Invoice No.</th>
                    <th className="text-left p-3 text-sm font-medium">Method</th>
                    <th className="text-left p-3 text-sm font-medium">Reference</th>
                    <th className="text-left p-3 text-sm font-medium">Received By</th>
                    <th className="text-right p-3 text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.payments?.map((payment: any) => (
                    <tr key={payment.id} className="border-b">
                      <td className="p-3 text-sm">{new Date(payment.payment_date).toLocaleDateString("en-GB")}</td>
                      <td className="p-3 text-sm">{payment.receipt_number}</td>
                      <td className="p-3 text-sm">
                        {payment.students.first_name} {payment.students.last_name}
                        <br />
                        <span className="text-xs text-muted-foreground">{payment.students.student_id}</span>
                      </td>
                      <td className="p-3 text-sm">{payment.invoices?.invoice_number}</td>
                      <td className="p-3 text-sm">{payment.payment_method}</td>
                      <td className="p-3 text-sm">{payment.reference_number || "-"}</td>
                      <td className="p-3 text-sm">
                        {payment.received_by_user?.first_name} {payment.received_by_user?.last_name}
                      </td>
                      <td className="p-3 text-sm text-right font-medium">
                        ₦{Number.parseFloat(payment.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 font-semibold bg-muted">
                  <tr>
                    <td colSpan={7} className="p-3 text-sm">
                      Grand Total
                    </td>
                    <td className="p-3 text-sm text-right text-green-600">
                      ₦{reportData.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
