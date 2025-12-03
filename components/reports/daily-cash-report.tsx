"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DailyCashReportProps {
  schoolSettings: any
}

export function DailyCashReport({ schoolSettings }: DailyCashReportProps) {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  const handleGenerateReport = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        students (first_name, last_name, student_id),
        received_by_user:teachers!received_by (first_name, last_name, staff_id)
      `)
      .eq("payment_date", reportDate)
      .order("created_at")

    if (error) {
      toast.error("Failed to generate report")
      console.error(error)
      setLoading(false)
      return
    }

    // Calculate totals by payment method
    const cash = payments?.filter((p) => p.payment_method === "Cash") || []
    const transfer = payments?.filter((p) => p.payment_method === "Bank Transfer") || []
    const pos = payments?.filter((p) => p.payment_method === "POS") || []

    const cashTotal = cash.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0)
    const transferTotal = transfer.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0)
    const posTotal = pos.reduce((sum, p) => sum + Number.parseFloat(p.amount), 0)
    const grandTotal = cashTotal + transferTotal + posTotal

    setReportData({
      payments,
      cash,
      transfer,
      pos,
      cashTotal,
      transferTotal,
      posTotal,
      grandTotal,
    })

    setLoading(false)
    toast.success("Report generated successfully")
  }

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="report-date">Select Date</Label>
          <Input id="report-date" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
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
              Print Report
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Report Content */}
          <div className="border rounded-lg p-6 print:border-0">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">{schoolSettings?.school_name}</h2>
              <p className="text-muted-foreground">{schoolSettings?.address}</p>
              <h3 className="text-xl font-semibold mt-4">Daily Cash Report</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(reportDate).toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Cash Payments</p>
                <p className="text-2xl font-bold">₦{reportData.cashTotal.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{reportData.cash.length} transaction(s)</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Bank Transfer</p>
                <p className="text-2xl font-bold">₦{reportData.transferTotal.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{reportData.transfer.length} transaction(s)</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">POS Payments</p>
                <p className="text-2xl font-bold">₦{reportData.posTotal.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{reportData.pos.length} transaction(s)</p>
              </div>
              <div className="border rounded-lg p-4 bg-primary/10">
                <p className="text-sm text-muted-foreground mb-1">Grand Total</p>
                <p className="text-2xl font-bold text-primary">₦{reportData.grandTotal.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{reportData.payments.length} transaction(s)</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            {["Cash", "Bank Transfer", "POS"].map((method) => {
              const methodPayments =
                method === "Cash" ? reportData.cash : method === "Bank Transfer" ? reportData.transfer : reportData.pos

              if (methodPayments.length === 0) return null

              return (
                <div key={method} className="mb-8">
                  <h4 className="font-semibold mb-4">{method} Payments</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 text-sm">Receipt No.</th>
                          <th className="text-left p-2 text-sm">Student</th>
                          <th className="text-left p-2 text-sm">Received By</th>
                          {method !== "Cash" && <th className="text-left p-2 text-sm">Reference</th>}
                          <th className="text-right p-2 text-sm">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {methodPayments.map((payment: any) => (
                          <tr key={payment.id} className="border-t">
                            <td className="p-2 text-sm">{payment.receipt_number}</td>
                            <td className="p-2 text-sm">
                              {payment.students.first_name} {payment.students.last_name}
                              <br />
                              <span className="text-xs text-muted-foreground">{payment.students.student_id}</span>
                            </td>
                            <td className="p-2 text-sm">
                              {payment.received_by_user?.first_name} {payment.received_by_user?.last_name}
                            </td>
                            {method !== "Cash" && <td className="p-2 text-sm">{payment.reference_number || "-"}</td>}
                            <td className="p-2 text-sm text-right font-medium">
                              ₦{Number.parseFloat(payment.amount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 font-semibold bg-muted/50">
                          <td colSpan={method === "Cash" ? 3 : 4} className="p-2 text-sm">
                            Subtotal
                          </td>
                          <td className="p-2 text-sm text-right">
                            ₦
                            {methodPayments
                              .reduce((sum: number, p: any) => sum + Number.parseFloat(p.amount), 0)
                              .toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
