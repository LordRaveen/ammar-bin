"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, FileDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ReceiptTemplate } from "./receipt-template"

interface BulkReceiptPrintProps {
  schoolSettings: any
}

export function BulkReceiptPrint({ schoolSettings }: BulkReceiptPrintProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [receipts, setReceipts] = useState<any[]>([])

  const handleFetchReceipts = async () => {
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
        students (
          student_id,
          first_name,
          middle_name,
          last_name
        ),
        invoices (
          invoice_number,
          total_amount,
          sessions (
            name
          ),
          terms (
            name
          )
        ),
        received_by_user:teachers!received_by (
          first_name,
          last_name,
          staff_id
        )
      `)
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)

    if (paymentMethod !== "all") {
      query = query.eq("payment_method", paymentMethod)
    }

    const { data, error } = await query.order("payment_date", { ascending: false })

    if (error) {
      toast.error("Failed to fetch receipts")
      console.error(error)
    } else {
      setReceipts(data || [])
      toast.success(`Found ${data?.length || 0} receipts`)
    }

    setLoading(false)
  }

  const handlePrintAll = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Filter Form */}
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
          <Button onClick={handleFetchReceipts} disabled={loading} className="w-full">
            {loading ? "Loading..." : "Fetch Receipts"}
          </Button>
        </div>
      </div>

      {/* Results */}
      {receipts.length > 0 && (
        <>
          <div className="flex items-center justify-between print:hidden">
            <p className="text-sm text-muted-foreground">Found {receipts.length} receipt(s)</p>
            <div className="flex gap-2">
              <Button onClick={handlePrintAll}>
                <Printer className="h-4 w-4 mr-2" />
                Print All
              </Button>
              <Button variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Receipt Templates for Printing */}
          <div className="space-y-8 print:space-y-0">
            {receipts.map((payment, index) => (
              <div
                key={payment.id}
                className={`print:break-after-page ${index !== receipts.length - 1 ? "border-b-2 pb-8" : ""}`}
              >
                <ReceiptTemplate payment={payment} schoolSettings={schoolSettings} invoiceItems={[]} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
