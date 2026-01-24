'use client'

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface PaymentItem {
  id: string
  studentName: string
  description: string
  amount: number
  originalAmount?: number // The original invoice item amount
  discount?: number
  waiver?: number
}

interface CashPaymentConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: PaymentItem[]
  subtotal: number
  totalDiscount: number
  totalWaiver: number
  totalToPay: number
  paymentMethod: string
  guardianId: string
  onConfirm: () => void
}

export function CashPaymentConfirmModal({
  open,
  onOpenChange,
  items,
  subtotal,
  totalDiscount,
  totalWaiver,
  totalToPay,
  paymentMethod,
  guardianId,
  onConfirm,
}: CashPaymentConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!guardianId) {
      toast.error("Guardian information missing")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/payments/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardian_id: guardianId,
          payment_method: paymentMethod,
          items: items.map((item) => ({
            invoice_item_id: item.id,
            amount: item.amount,
          })),
          total_discount: totalDiscount,
          total_waiver: totalWaiver,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment")
      }

      toast.success("Payment collected successfully!", {
        description: `₦${totalToPay.toLocaleString()} received`,
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      })
      
      onOpenChange(false)
      onConfirm()
    } catch (error: any) {
      console.error("[v0] Payment error:", error)
      toast.error("Payment Failed", {
        description: error.message || "An error occurred while processing the payment",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group items by student for summary
  const itemsByStudent = items.reduce(
    (acc, item) => {
      if (!acc[item.studentName]) {
        acc[item.studentName] = []
      }
      acc[item.studentName].push(item)
      return acc
    },
    {} as Record<string, PaymentItem[]>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Please review the payment summary below. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items Summary by Student */}
          <div className="space-y-3">
            {Object.entries(itemsByStudent).map(([studentName, studentItems]) => (
              <div key={studentName} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">{studentName}</p>
                <div className="pl-2 space-y-1 border-l">
                  {studentItems.map((item) => {
                    const isFullyPaid = !item.originalAmount || item.amount === item.originalAmount
                    const isPartialPaid = item.originalAmount && item.amount < item.originalAmount && item.amount > 0
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{item.description}</span>
                          {isFullyPaid && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Full payment</span>
                          )}
                          {isPartialPaid && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Partial payment</span>
                          )}
                        </div>
                        <span className="font-semibold">₦{item.amount.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-semibold text-red-600">-₦{totalDiscount.toLocaleString()}</span>
              </div>
            )}

            {totalWaiver > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Waiver</span>
                <span className="font-semibold text-red-600">-₦{totalWaiver.toLocaleString()}</span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between text-base font-bold">
              <span>Total to Pay</span>
              <span>₦{totalToPay.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-semibold capitalize">{paymentMethod}</span>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-amber-50 rounded border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              This payment will be recorded immediately and cannot be reversed without explicit action.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
