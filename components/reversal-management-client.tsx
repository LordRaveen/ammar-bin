"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Reversal {
  id: string
  payment_id: string
  reason: string
  created_at: string
  approved_by: { first_name: string; last_name: string } | null
  reversed_by: { first_name: string; last_name: string }
  payments: {
    receipt_number: string
    amount: string
    payment_date: string
    payment_method: string
    students: {
      student_id: string
      first_name: string
      last_name: string
    }
    invoices: {
      invoice_number: string
      balance: string
    }
  }
}

export default function ReversalManagementClient({
  pendingReversals,
  approvedReversals,
}: {
  pendingReversals: Reversal[]
  approvedReversals: Reversal[]
}) {
  const [selectedReversal, setSelectedReversal] = useState<Reversal | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async () => {
    if (!selectedReversal) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/payments/reverse/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reversalId: selectedReversal.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve reversal")
      }

      toast.success("Payment reversal approved successfully")
      setSelectedReversal(null)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to approve reversal")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingReversals.length})</TabsTrigger>
          <TabsTrigger value="approved">Processed ({approvedReversals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReversals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Receipt</th>
                    <th className="text-left p-2">Student</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-left p-2">Reason</th>
                    <th className="text-left p-2">Requested By</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReversals.map((reversal) => (
                    <tr key={reversal.id} className="border-b">
                      <td className="p-2 font-medium">{reversal.payments.receipt_number}</td>
                      <td className="p-2">
                        {reversal.payments.students.first_name} {reversal.payments.students.last_name}
                        <br />
                        <span className="text-xs text-muted-foreground">{reversal.payments.students.student_id}</span>
                      </td>
                      <td className="p-2 text-right font-medium text-red-600">
                        ₦{Number.parseFloat(reversal.payments.amount).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm max-w-xs truncate">{reversal.reason}</td>
                      <td className="p-2 text-sm">
                        {reversal.reversed_by.first_name} {reversal.reversed_by.last_name}
                      </td>
                      <td className="p-2 text-sm">{new Date(reversal.created_at).toLocaleDateString()}</td>
                      <td className="p-2 text-center">
                        <Button size="sm" onClick={() => setSelectedReversal(reversal)}>
                          <Check className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">No pending reversal requests</div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedReversals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Receipt</th>
                    <th className="text-left p-2">Student</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-left p-2">Reason</th>
                    <th className="text-left p-2">Approved By</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedReversals.map((reversal) => (
                    <tr key={reversal.id} className="border-b">
                      <td className="p-2 font-medium">{reversal.payments.receipt_number}</td>
                      <td className="p-2">
                        {reversal.payments.students.first_name} {reversal.payments.students.last_name}
                        <br />
                        <span className="text-xs text-muted-foreground">{reversal.payments.students.student_id}</span>
                      </td>
                      <td className="p-2 text-right font-medium text-red-600">
                        ₦{Number.parseFloat(reversal.payments.amount).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm max-w-xs truncate">{reversal.reason}</td>
                      <td className="p-2 text-sm">
                        {reversal.approved_by?.first_name} {reversal.approved_by?.last_name}
                      </td>
                      <td className="p-2 text-sm">{new Date(reversal.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">No processed reversals yet</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedReversal} onOpenChange={() => setSelectedReversal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment Reversal</DialogTitle>
            <DialogDescription>Review the details and approve or reject this reversal request.</DialogDescription>
          </DialogHeader>

          {selectedReversal && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receipt Number:</span>
                  <span className="font-medium">{selectedReversal.payments.receipt_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">
                    {selectedReversal.payments.students.first_name} {selectedReversal.payments.students.last_name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium text-red-600">
                    ₦{Number.parseFloat(selectedReversal.payments.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span className="font-medium">
                    {new Date(selectedReversal.payments.payment_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requested By:</span>
                  <span className="font-medium">
                    {selectedReversal.reversed_by.first_name} {selectedReversal.reversed_by.last_name}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Reason:</p>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded">{selectedReversal.reason}</p>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="font-medium text-yellow-900">Impact:</p>
                <p className="text-yellow-700">
                  Invoice balance will increase by ₦
                  {Number.parseFloat(selectedReversal.payments.amount).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReversal(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve Reversal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
