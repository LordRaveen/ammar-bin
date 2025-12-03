"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertTriangle, Search } from "lucide-react"
import { toast } from "sonner"
import { reversePayment } from "@/app/(dashboard)/finance/payments/reverse/actions"

interface PaymentReversalSystemProps {
  payments: any[]
}

export function PaymentReversalSystem({ payments }: PaymentReversalSystemProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [reversalReason, setReversalReason] = useState("")
  const [loading, setLoading] = useState(false)

  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      payment.receipt_number.toLowerCase().includes(query) ||
      payment.students.first_name.toLowerCase().includes(query) ||
      payment.students.last_name.toLowerCase().includes(query) ||
      payment.students.student_id.toLowerCase().includes(query)
    )
  })

  const handleReversePayment = async () => {
    if (!reversalReason.trim()) {
      toast.error("Please provide a reason for the reversal")
      return
    }

    setLoading(true)

    try {
      const result = await reversePayment({
        paymentId: selectedPayment.id,
        reason: reversalReason,
      })

      if (result.success) {
        toast.success(result.message)
        setSelectedPayment(null)
        setReversalReason("")
        window.location.reload()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to reverse payment")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by receipt number, student name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Payments List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Date</th>
              <th className="text-left p-3 text-sm font-medium">Receipt No.</th>
              <th className="text-left p-3 text-sm font-medium">Student</th>
              <th className="text-left p-3 text-sm font-medium">Method</th>
              <th className="text-right p-3 text-sm font-medium">Amount</th>
              <th className="text-left p-3 text-sm font-medium">Received By</th>
              <th className="text-center p-3 text-sm font-medium">Status</th>
              <th className="text-center p-3 text-sm font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => {
              const isReversed = payment.payment_reversals && payment.payment_reversals.length > 0

              return (
                <tr key={payment.id} className="border-t">
                  <td className="p-3 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td className="p-3 text-sm">{payment.receipt_number}</td>
                  <td className="p-3 text-sm">
                    {payment.students.first_name} {payment.students.last_name}
                    <br />
                    <span className="text-xs text-muted-foreground">{payment.students.student_id}</span>
                  </td>
                  <td className="p-3 text-sm">{payment.payment_method}</td>
                  <td className="p-3 text-sm text-right font-medium">
                    ₦{Number.parseFloat(payment.amount).toLocaleString()}
                  </td>
                  <td className="p-3 text-sm">
                    {payment.received_by_user?.first_name} {payment.received_by_user?.last_name}
                  </td>
                  <td className="p-3 text-center">
                    {isReversed ? (
                      <Badge variant="destructive">Reversed</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {!isReversed && (
                      <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                        Reverse
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Reversal Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reverse Payment
            </DialogTitle>
            <DialogDescription>
              This action will reverse the payment and adjust the invoice balance. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                <p className="text-sm">
                  <span className="font-medium">Receipt:</span> {selectedPayment.receipt_number}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Student:</span> {selectedPayment.students.first_name}{" "}
                  {selectedPayment.students.last_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Amount:</span> ₦
                  {Number.parseFloat(selectedPayment.amount).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Method:</span> {selectedPayment.payment_method}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason for Reversal *</Label>
                <Textarea
                  placeholder="Explain why this payment is being reversed..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPayment(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReversePayment} disabled={loading}>
              {loading ? "Reversing..." : "Confirm Reversal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
