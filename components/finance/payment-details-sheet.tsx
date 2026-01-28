"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Printer, RotateCcw, Receipt, User, Calendar, CreditCard, FileText } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PaymentDetailsSheetProps {
  paymentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onReversed?: () => void
  userRole?: "admin" | "accountant" | "parent" | "super_admin"
}

export function PaymentDetailsSheet({
  paymentId,
  open,
  onOpenChange,
  onReversed,
  userRole = "admin",
}: PaymentDetailsSheetProps) {
  const [payment, setPayment] = useState<any>(null)
  const [allocations, setAllocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reversing, setReversing] = useState(false)
  const [reversalReason, setReversalReason] = useState("")
  const [showReversalDialog, setShowReversalDialog] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!open || !paymentId) return

    const fetchPaymentDetails = async () => {
      setLoading(true)
      try {
        // Fetch payment with related data (no student_id needed)
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select(
            `
            *,
            teacher:received_by(first_name, last_name)
          `
          )
          .eq("id", paymentId)
          .single()

        if (paymentError) {
          console.error("[v0] Error fetching payment:", paymentError)
          return
        }

        setPayment(paymentData)

        // Fetch payment allocations
        const { data: allocationData } = await supabase
          .from("payment_allocations")
          .select(
            `
            *,
            invoice_items(
              description,
              amount,
              fee_category_id,
              fee_categories(name)
            ),
            invoices(invoice_number),
            students(first_name, last_name)
          `
          )
          .eq("payment_id", paymentId)

        setAllocations(allocationData || [])
      } catch (error) {
        console.error("[v0] Error fetching payment details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [paymentId, open, supabase])

  const handleReversePayment = async () => {
    if (!reversalReason.trim()) {
      toast.error("Please provide a reason for reversal")
      return
    }

    setReversing(true)
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Create reversal record
      const { error: reversalError } = await supabase.from("payment_reversals").insert({
        payment_id: paymentId,
        reason: reversalReason,
        reversed_by: user?.id,
      })

      if (reversalError) {
        console.error("[v0] Reversal insert error:", reversalError)
        toast.error("Failed to create reversal record")
        return
      }

      // Update payment status
      const { error: updateError } = await supabase
        .from("payments")
        .update({ status: "Reversed" })
        .eq("id", paymentId)

      if (updateError) {
        console.error("[v0] Payment update error:", updateError)
        toast.error("Failed to update payment status")
        return
      }

      // Update invoice balance (restore the amount)
      if (payment?.invoice_id) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("balance, amount_paid")
          .eq("id", payment.invoice_id)
          .single()

        if (invoice) {
          const newBalance = Number(invoice.balance) + Number(payment.amount)
          const newAmountPaid = Number(invoice.amount_paid) - Number(payment.amount)

          await supabase
            .from("invoices")
            .update({
              balance: newBalance,
              amount_paid: Math.max(0, newAmountPaid),
              status: newBalance > 0 ? (newAmountPaid > 0 ? "Partial" : "Pending") : "Paid",
            })
            .eq("id", payment.invoice_id)
        }
      }

      toast.success("Payment reversed successfully")
      setShowReversalDialog(false)
      setReversalReason("")
      onReversed?.()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error reversing payment:", error)
      toast.error("Failed to reverse payment")
    } finally {
      setReversing(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status?.toLowerCase() || ""
    switch (statusLower) {
      case "completed":
      case "success":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "reversed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMethodBadgeColor = (method: string) => {
    const methodLower = method?.toLowerCase() || ""
    switch (methodLower) {
      case "cash":
        return "bg-green-50 text-green-700 border-green-200"
      case "pos":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "transfer":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "online":
        return "bg-teal-50 text-teal-700 border-teal-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getParentInfo = () => {
    const guardians = payment?.invoices?.students?.student_guardians
    if (!guardians) return null
    const primary = guardians.find((sg: any) => sg.is_primary) || guardians[0]
    return primary?.guardian
  }

  const getCollectedByName = () => {
    if (payment?.teacher) {
      return `${payment.teacher.first_name} ${payment.teacher.last_name}`
    }
    return "N/A"
  }

  const canReverse = userRole === "admin" && payment?.status?.toLowerCase() !== "reversed"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Details
          </SheetTitle>
          <SheetDescription>
            {payment?.receipt_number || payment?.reference_number || `PAY-${paymentId.slice(0, 8)}`}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : payment ? (
          <div className="space-y-6  mx-4">
            {/* Payment Summary */}
            <Card className="shadow-none gap-0">
              <CardHeader className="py-0">
                <CardTitle className="text-sm font-medium">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-b-2 gap-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-lg font-mono font-bold text-green-600">
                    ₦{Number.parseFloat(payment.amount).toLocaleString()}
                  </span>
                </div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <Badge
                    variant="outline"
                    className={`${getMethodBadgeColor(payment.payment_method)} capitalize`}
                  >
                    {payment.payment_method || "N/A"}
                  </Badge>
                </div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={`${getStatusBadgeColor(payment.status)} capitalize`}>
                    {payment.status || "N/A"}
                  </Badge>
                </div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm">
                    {formatDate(payment.paid_at || payment.payment_date || payment.created_at)}
                  </span>
                </div>
                {payment.reference_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reference</span>
                    <span className="text-sm font-mono">{payment.reference_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parent/Guardian Info */}
            {getParentInfo() && (
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Paid By
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">
                    {getParentInfo()?.first_name} {getParentInfo()?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{getParentInfo()?.phone || "No phone"}</p>
                </CardContent>
              </Card>
            )}

            {/* Items Paid / Allocations */}
            <Card className="shadow-none gap-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Items Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocations.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      allocations.reduce(
                        (grouped: Record<string, typeof allocations>, allocation) => {
                          const studentName = `${allocation.students?.first_name} ${allocation.students?.last_name}`
                          if (!grouped[studentName]) {
                            grouped[studentName] = []
                          }
                          grouped[studentName].push(allocation)
                          return grouped
                        },
                        {}
                      )
                    ).map(([studentName, studentAllocations]) => (
                      <div key={studentName} className="space-y-2">
                        <p className="text-sm font-semibold">{studentName}</p>
                        <div className="pl-3 space-y-2 border-l">
                          {studentAllocations.map((allocation) => {
                            const itemName =
                              allocation.invoice_items?.fee_categories?.name ||
                              allocation.invoice_items?.description ||
                              "Payment"
                            return (
                              <div key={allocation.id} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{itemName}</span>
                                <span className="font-semibold font-mono">
                                  ₦{Number.parseFloat(allocation.amount).toLocaleString()}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No allocation details available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Linked Invoice */}
            {payment.invoices && (
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Linked Invoice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Invoice No</span>
                    <span className="font-mono text-sm">{payment.invoices.invoice_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Student</span>
                    <span className="text-sm">
                      {payment.invoices.students?.first_name} {payment.invoices.students?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="text-sm">
                      ₦{Number.parseFloat(payment.invoices.total_amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Remaining Balance</span>
                    <span className="text-sm font-semibold text-orange-600">
                      ₦{Number.parseFloat(payment.invoices.balance).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collected By (Staff/Admin) */}
            <Card className="shadow-none border-dashed bg-zinc-50/50 dark:bg-zinc-900/50">
              <CardContent className="pt-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Processed By</p>
                    <p className="text-sm font-medium">{getCollectedByName()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Created</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Method Specific Metadata */}
            {(payment.payment_method === 'pos' || payment.payment_method === 'transfer' || payment.payment_method === 'online') && (
              <Card className="shadow-none gap-0 border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-900/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {payment.payment_method === 'pos' && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Bank</span>
                        <span className="font-semibold">{payment.metadata?.bank_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Card ending in</span>
                        <span className="font-mono font-bold tracking-widest text-blue-600 italic">**** {payment.metadata?.card_last_4 || '****'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Terminal ID</span>
                        <span className="font-mono text-xs">{payment.metadata?.terminal_id || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  {payment.payment_method === 'transfer' && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Sender</span>
                        <span className="font-semibold">{payment.metadata?.sender_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Source Bank</span>
                        <span className="font-semibold">{payment.metadata?.bank_name || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  {payment.payment_method === 'online' && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Gateway</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-none capitalize">
                          {payment.metadata?.gateway || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Gateway Ref</span>
                        <span className="font-mono text-[10px] break-all max-w-[200px] text-right">{payment.metadata?.gateway_reference || 'N/A'}</span>
                      </div>
                      {payment.metadata?.gateway_verified_at && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground italic">Auto-verified at</span>
                          <span className="text-muted-foreground">{new Date(payment.metadata.gateway_verified_at).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 py-4">
              <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>

              {canReverse && (
                <AlertDialog open={showReversalDialog} onOpenChange={setShowReversalDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-transparent"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reverse
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reverse Payment</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reverse the payment of ₦
                        {Number.parseFloat(payment.amount).toLocaleString()} and restore the
                        invoice balance. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="reversal-reason">Reason for reversal</Label>
                      <Textarea
                        id="reversal-reason"
                        placeholder="Enter reason for reversing this payment..."
                        value={reversalReason}
                        onChange={(e) => setReversalReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReversePayment}
                        disabled={reversing || !reversalReason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {reversing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirm Reversal
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {payment.status?.toLowerCase() === "reversed" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">This payment has been reversed</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">Payment not found</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
