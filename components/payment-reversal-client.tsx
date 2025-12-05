"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertCircle, RotateCcw, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { toast } from "sonner"

interface Payment {
  id: string
  receipt_number: string
  payment_date: string
  amount: string
  payment_method: string
  reference_number: string | null
  students: {
    id: string
    student_id: string
    first_name: string
    last_name: string
  }
  invoices: {
    invoice_number: string
    balance: string
  }
  received_by: {
    first_name: string
    last_name: string
  }
}

export default function PaymentReversalClient({ payments }: { payments: Payment[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredPayments = payments.filter(
    (p) =>
      p.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.students.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${p.students.first_name} ${p.students.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleReverse = async () => {
    if (!selectedPayment || !reason.trim()) {
      toast.error("Please provide a reason for reversal")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/payments/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          reason: reason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit reversal request")
      }

      toast.success("Reversal request submitted for admin approval")
      setSelectedPayment(null)
      setReason("")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to submit reversal request")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by receipt number, student ID, or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Payment reversals require admin approval. The invoice balance will be restored after approval.
        </AlertDescription>
      </Alert>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Receipt No.</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Student</th>
              <th className="text-left p-2">Invoice</th>
              <th className="text-right p-2">Amount</th>
              <th className="text-left p-2">Method</th>
              <th className="text-left p-2">Received By</th>
              <th className="text-center p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="p-2 font-medium">{payment.receipt_number}</td>
                  <td className="p-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td className="p-2">
                    <Link href={`/students/${payment.students.id}`} className="hover:underline">
                      {payment.students.first_name} {payment.students.last_name}
                      <br />
                      <span className="text-xs text-muted-foreground">{payment.students.student_id}</span>
                    </Link>
                  </td>
                  <td className="p-2 text-sm">{payment.invoices?.invoice_number}</td>
                  <td className="p-2 text-right font-medium text-red-600">
                    ₦{Number.parseFloat(payment.amount).toLocaleString()}
                  </td>
                  <td className="p-2">
                    <Badge variant="secondary">{payment.payment_method}</Badge>
                  </td>
                  <td className="p-2 text-sm">
                    {payment.received_by.first_name} {payment.received_by.last_name}
                  </td>
                  <td className="p-2 text-center">
                    <Button size="sm" variant="destructive" onClick={() => setSelectedPayment(payment)}>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reverse
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  {searchTerm ? "No payments found matching your search" : "No payments available for reversal"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse Payment</DialogTitle>
            <DialogDescription>This action will submit a reversal request for admin approval.</DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receipt Number:</span>
                  <span className="font-medium">{selectedPayment.receipt_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">
                    {selectedPayment.students.first_name} {selectedPayment.students.last_name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium text-red-600">
                    ₦{Number.parseFloat(selectedPayment.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span className="font-medium">{new Date(selectedPayment.payment_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Reversal *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this payment needs to be reversed..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This reversal requires admin approval. The invoice balance will be restored to ₦
                  {(
                    Number.parseFloat(selectedPayment.invoices?.balance || "0") +
                    Number.parseFloat(selectedPayment.amount)
                  ).toLocaleString()}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPayment(null)
                setReason("")
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReverse} disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? "Submitting..." : "Submit Reversal Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
