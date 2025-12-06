"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type ReconciliationData = {
  id?: string
  reconciliation_date?: string
  status?: string
  expected_cash: number
  expected_pos: number
  expected_transfer: number
  expected_total: number
  actual_cash?: number
  actual_pos?: number
  actual_transfer?: number
  actual_total?: number
  cash_variance?: number
  pos_variance?: number
  transfer_variance?: number
  total_variance?: number
  notes?: string
  reconciled_by_user?: { first_name: string; last_name: string; staff_id: string }
  approved_by_user?: { first_name: string; last_name: string; staff_id: string }
}

export default function DailyReconciliationClient({
  expectedTotals,
  todaysReconciliation,
  recentReconciliations,
  today,
}: {
  expectedTotals: any
  todaysReconciliation: ReconciliationData | null
  recentReconciliations: ReconciliationData[]
  today: string
}) {
  const router = useRouter()
  const [actualCash, setActualCash] = useState(todaysReconciliation?.actual_cash?.toString() || "")
  const [actualPOS, setActualPOS] = useState(todaysReconciliation?.actual_pos?.toString() || "")
  const [actualTransfer, setActualTransfer] = useState(todaysReconciliation?.actual_transfer?.toString() || "")
  const [notes, setNotes] = useState(todaysReconciliation?.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const expectedCash = Number(expectedTotals.cash) || 0
  const expectedPOS = Number(expectedTotals.pos) || 0
  const expectedTransfer = Number(expectedTotals.transfer) || 0
  const expectedTotal = Number(expectedTotals.total) || 0

  const actualCashNum = Number(actualCash) || 0
  const actualPOSNum = Number(actualPOS) || 0
  const actualTransferNum = Number(actualTransfer) || 0
  const actualTotalNum = actualCashNum + actualPOSNum + actualTransferNum

  const cashVariance = actualCashNum - expectedCash
  const posVariance = actualPOSNum - expectedPOS
  const transferVariance = actualTransferNum - expectedTransfer
  const totalVariance = actualTotalNum - expectedTotal

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/finance/reconciliation/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reconciliation_date: today,
          expected_cash: expectedCash,
          expected_pos: expectedPOS,
          expected_transfer: expectedTransfer,
          expected_total: expectedTotal,
          actual_cash: actualCashNum,
          actual_pos: actualPOSNum,
          actual_transfer: actualTransferNum,
          actual_total: actualTotalNum,
          cash_variance: cashVariance,
          pos_variance: posVariance,
          transfer_variance: transferVariance,
          total_variance: totalVariance,
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit reconciliation")
      }

      toast.success("Reconciliation submitted successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusColors = {
    Open: "bg-gray-100 text-gray-800",
    Submitted: "bg-blue-100 text-blue-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  }

  const statusIcons = {
    Open: Clock,
    Submitted: Clock,
    Approved: CheckCircle2,
    Rejected: XCircle,
  }

  const isReadOnly = todaysReconciliation?.status !== "Open" && todaysReconciliation?.status

  return (
    <div className="space-y-6">
      {/* Today's Reconciliation Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today's Reconciliation - {format(new Date(today), "MMMM dd, yyyy")}</CardTitle>
              <CardDescription>Count and verify all payment collections</CardDescription>
            </div>
            {todaysReconciliation?.status && (
              <Badge className={statusColors[todaysReconciliation.status as keyof typeof statusColors]}>
                {todaysReconciliation.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash */}
            <div className="space-y-2">
              <Label>Cash Payments</Label>
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Expected:</span>
                  <span className="font-mono">₦{expectedCash.toLocaleString()}</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  disabled={isReadOnly}
                />
                {actualCash && (
                  <div
                    className={`flex justify-between text-sm ${cashVariance === 0 ? "text-green-600" : cashVariance > 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    <span>Variance:</span>
                    <span className="font-mono font-medium">
                      {cashVariance >= 0 ? "+" : ""}₦{Math.abs(cashVariance).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* POS */}
            <div className="space-y-2">
              <Label>POS Payments</Label>
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Expected:</span>
                  <span className="font-mono">₦{expectedPOS.toLocaleString()}</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={actualPOS}
                  onChange={(e) => setActualPOS(e.target.value)}
                  disabled={isReadOnly}
                />
                {actualPOS && (
                  <div
                    className={`flex justify-between text-sm ${posVariance === 0 ? "text-green-600" : posVariance > 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    <span>Variance:</span>
                    <span className="font-mono font-medium">
                      {posVariance >= 0 ? "+" : ""}₦{Math.abs(posVariance).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="space-y-2">
              <Label>Bank Transfer</Label>
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Expected:</span>
                  <span className="font-mono">₦{expectedTransfer.toLocaleString()}</span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={actualTransfer}
                  onChange={(e) => setActualTransfer(e.target.value)}
                  disabled={isReadOnly}
                />
                {actualTransfer && (
                  <div
                    className={`flex justify-between text-sm ${transferVariance === 0 ? "text-green-600" : transferVariance > 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    <span>Variance:</span>
                    <span className="font-mono font-medium">
                      {transferVariance >= 0 ? "+" : ""}₦{Math.abs(transferVariance).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <Card
            className={`${totalVariance === 0 ? "border-green-500" : totalVariance !== 0 && actualCash ? "border-red-500" : ""}`}
          >
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Expected Total</p>
                  <p className="text-2xl font-bold">₦{expectedTotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Total</p>
                  <p className="text-2xl font-bold">₦{actualTotalNum.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Variance</p>
                  <p
                    className={`text-2xl font-bold ${totalVariance === 0 ? "text-green-600" : totalVariance > 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    {totalVariance >= 0 ? "+" : ""}₦{Math.abs(totalVariance).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes / Remarks (Optional)</Label>
            <Textarea
              placeholder="Add any remarks about today's reconciliation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isReadOnly}
              rows={3}
            />
          </div>

          {totalVariance !== 0 && actualCash && (
            <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Variance Detected</p>
                <p className="text-yellow-700 mt-1">
                  There is a discrepancy of ₦{Math.abs(totalVariance).toLocaleString()} between expected and actual
                  totals. Please verify your counts and provide an explanation in the notes.
                </p>
              </div>
            </div>
          )}

          {!isReadOnly && (
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.refresh()}>
                Reset
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !actualCash}>
                {isSubmitting ? "Submitting..." : "Submit Reconciliation"}
              </Button>
            </div>
          )}

          {isReadOnly && (
            <div className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-md">
              This reconciliation has been {todaysReconciliation?.status?.toLowerCase()}. Contact the administrator for
              changes.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reconciliations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reconciliations</CardTitle>
          <CardDescription>Historical reconciliation records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reconciled By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReconciliations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No reconciliation records yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentReconciliations.map((rec) => {
                    const StatusIcon = statusIcons[rec.status as keyof typeof statusIcons]
                    return (
                      <TableRow key={rec.id}>
                        <TableCell>{format(new Date(rec.reconciliation_date!), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="font-mono">₦{Number(rec.expected_total).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">₦{Number(rec.actual_total).toLocaleString()}</TableCell>
                        <TableCell
                          className={`font-mono font-medium ${Number(rec.total_variance) === 0 ? "text-green-600" : Number(rec.total_variance) > 0 ? "text-blue-600" : "text-red-600"}`}
                        >
                          {Number(rec.total_variance) >= 0 ? "+" : ""}₦
                          {Math.abs(Number(rec.total_variance)).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[rec.status as keyof typeof statusColors]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {rec.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {rec.reconciled_by_user
                            ? `${rec.reconciled_by_user.first_name} ${rec.reconciled_by_user.last_name}`
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
