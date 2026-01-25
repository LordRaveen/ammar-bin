"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, FileText, History, Trash2, User, Plus, ChevronRight, Phone, Mail } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StudentDetailsSheet } from "@/components/student-details-sheet"
import { PaymentDetailsSheet } from "@/components/finance/payment-details-sheet"
import { GuardianDetailsSheet } from "@/components/guardian-details-sheet"

interface InvoiceDetailsDrawerProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: "admin" | "accountant" | "parent"
}

export function InvoiceDetailsDrawer({
  invoiceId,
  open,
  onOpenChange,
  userRole = "admin",
}: InvoiceDetailsDrawerProps) {
  const [invoice, setInvoice] = useState<any>(null)
  const [invoiceItems, setInvoiceItems] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [itemPaymentStatus, setItemPaymentStatus] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentDetailsOpen, setStudentDetailsOpen] = useState(false)
  const [addFeeDialogOpen, setAddFeeDialogOpen] = useState(false)
  const [availableFees, setAvailableFees] = useState<any[]>([])
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [selectedGuardianId, setSelectedGuardianId] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) return

      setLoading(true)
      try {
        // Fetch invoice
        const { data: invoiceData } = await supabase
          .from("invoices")
          .select(`
            *,
            students(
              first_name, 
              last_name, 
              student_id,
              student_guardians(
                relationship,
                is_primary,
                guardian:guardians(
                  id,
                  first_name,
                  last_name,
                  phone,
                  email
                )
              )
            )
          `)
          .eq("id", invoiceId)
          .single()

        // Fetch invoice items
        const { data: itemsData } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoiceId)

        // Fetch allocations for this invoice directly (not via payments.invoice_id which can be null)
        const { data: allocationsData } = await supabase
          .from("payment_allocations")
          .select(`
            id,
            payment_id,
            invoice_item_id,
            amount,
            payments(
              id,
              amount,
              payment_date,
              payment_method,
              status,
              receipt_number
            )
          `)
          .eq("invoice_id", invoiceId)

        // Build payment status map for each item using direct allocations
        const statusMap: Record<string, any> = {}
        itemsData?.forEach((item) => {
          const itemAllocations = allocationsData?.filter(a => a.invoice_item_id === item.id) || []
          const totalAllocated = itemAllocations.reduce((sum: number, a: any) => sum + Number(a.amount), 0)
          const itemAmount = Number(item.amount)

          statusMap[item.id] = {
            totalAllocated,
            isFullyPaid: totalAllocated >= itemAmount,
            isPartiallyPaid: totalAllocated > 0 && totalAllocated < itemAmount,
            allocations: itemAllocations,
          }
        })

        // Build unique payments list from allocations for the History tab
        const paymentIds = new Set<string>()
        const uniquePayments: any[] = []
        allocationsData?.forEach(allocation => {
          if (allocation.payments && !paymentIds.has(allocation.payment_id)) {
            paymentIds.add(allocation.payment_id)
            uniquePayments.push(allocation.payments)
          }
        })
        // Sort by payment_date descending
        uniquePayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())

        setInvoice(invoiceData)
        setInvoiceItems(itemsData || [])
        setPayments(uniquePayments)
        setItemPaymentStatus(statusMap)
      } catch (error) {
        console.error("[v0] Error fetching invoice details:", error)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchInvoiceDetails()
    }
  }, [invoiceId, open, supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Partial":
        return "bg-blue-100 text-blue-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDeleteInvoice = async () => {
    if (!invoice) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", invoice.id)

      if (error) {
        toast.error("Failed to delete invoice")
        console.error("[v0] Delete error:", error)
        return
      }

      toast.success("Invoice deleted successfully")
      setDeleteDialogOpen(false)
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error deleting invoice:", error)
      toast.error("Error deleting invoice")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteInvoiceItem = async (itemId: string) => {
    setDeletingItemId(itemId)
    try {
      const { error } = await supabase
        .from("invoice_items")
        .delete()
        .eq("id", itemId)

      if (error) {
        toast.error("Failed to remove fee")
        return
      }

      const itemToDelete = invoiceItems.find(i => i.id === itemId)
      const newTotal = Number(invoice.total_amount) - Number(itemToDelete?.amount || 0)
      const newBalance = Number(invoice.balance) - Number(itemToDelete?.amount || 0)

      // Update invoice totals
      await supabase
        .from("invoices")
        .update({
          total_amount: newTotal,
          balance: newBalance,
        })
        .eq("id", invoice.id)

      // Refresh invoice items
      const { data: items } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id)

      setInvoiceItems(items || [])

      // Update invoice display
      setInvoice({
        ...invoice,
        total_amount: newTotal,
        balance: newBalance,
      })

      toast.success("Fee removed successfully")
    } catch (error) {
      console.error("[v0] Error deleting invoice item:", error)
      toast.error("Error removing fee")
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleOpenAddFeeDialog = async () => {
    if (!invoice) return

    try {
      // Get the student's current active enrollment to find their class
      const { data: enrollment } = await supabase
        .from("student_enrollments")
        .select("class_id")
        .eq("student_id", invoice.student_id)
        .eq("is_active", true)
        .single()

      const studentClassId = enrollment?.class_id

      if (!studentClassId) {
        toast.error("Could not determine student's class. Please ensure the student is enrolled.")
        return
      }

      // Get all fee structures for this class/term/session
      const { data: allFees } = await supabase
        .from("fee_structures")
        .select("*, fee_categories(name)")
        .eq("session_id", invoice.session_id)
        .eq("term_id", invoice.term_id)
        .eq("class_id", studentClassId)
        .eq("active", true)

      if (!allFees || allFees.length === 0) {
        toast.error("No available fees to add for this class/term")
        return
      }

      // Filter out fees already in this invoice and zero-amount fees
      const addedFeeIds = invoiceItems.map(i => i.fee_category_id)
      const available = allFees.filter(fs =>
        !addedFeeIds.includes(fs.fee_category_id) && Number(fs.amount) > 0
      )

      if (available.length === 0) {
        toast.error("All applicable fees have been added to this invoice")
        return
      }

      setAvailableFees(available)
      setAddFeeDialogOpen(true)
    } catch (error) {
      console.error("[v0] Error fetching available fees:", error)
      toast.error("Error loading available fees")
    }
  }

  const handleAddFee = async (feeStructure: any) => {
    if (!invoice) return

    try {
      // Create new invoice item
      const { data: newItem, error: itemError } = await supabase
        .from("invoice_items")
        .insert({
          invoice_id: invoice.id,
          fee_category_id: feeStructure.fee_category_id,
          description: feeStructure.fee_categories?.name || "Fee Item",
          amount: feeStructure.amount,
        })
        .select()
        .single()

      if (itemError) {
        toast.error("Failed to add fee")
        return
      }

      // Update invoice totals
      const newTotal = Number(invoice.total_amount) + Number(feeStructure.amount)
      const newBalance = Number(invoice.balance) + Number(feeStructure.amount)

      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          total_amount: newTotal,
          balance: newBalance,
        })
        .eq("id", invoice.id)

      if (updateError) {
        toast.error("Failed to update invoice total")
        return
      }

      // Update local state
      setInvoiceItems([...invoiceItems, newItem])
      setInvoice({
        ...invoice,
        total_amount: newTotal,
        balance: newBalance,
      })

      // Remove from available fees
      setAvailableFees(availableFees.filter(f => f.fee_category_id !== feeStructure.fee_category_id))

      toast.success("Fee added successfully")
    } catch (error) {
      console.error("[v0] Error adding fee:", error)
      toast.error("Error adding fee")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto px-6">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading invoice details...</div>
        ) : invoice ? (
          <div className="space-y-6 pb-8">
            <SheetHeader>
              <SheetTitle className="text-2xl">Invoice {invoice.invoice_number}</SheetTitle>
              <SheetDescription>Invoice Details & Payment History</SheetDescription>
            </SheetHeader>

            {/* Invoice Header Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <button
                      onClick={() => setStudentDetailsOpen(true)}
                      className="font-semibold hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                    >
                      {invoice.students?.first_name} {invoice.students?.last_name}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {invoice.students?.student_id}
                    </p>
                  </div>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold">
                      ₦{Number.parseFloat(invoice.total_amount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-lg font-bold text-green-600">
                      ₦{Number.parseFloat(invoice.amount_paid).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-lg font-bold text-red-600">
                      ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-semibold">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="breakdown" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="breakdown" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Breakdown
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
                <TabsTrigger value="parent" className="flex items-center gap-2">
                  Parent Info
                </TabsTrigger>
              </TabsList>

              {/* Fee Breakdown Tab */}
              <TabsContent value="breakdown" className="mt-4">
                {invoiceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoice items</p>
                ) : (
                  <div className="divide-y">
                    {invoiceItems.map((item) => {
                      const status = itemPaymentStatus[item.id] || {}
                      const isFullyPaid = status.isFullyPaid
                      const isPartialPaid = status.isPartiallyPaid
                      const canDelete = !isFullyPaid && !isPartialPaid

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 gap-2"
                        >
                          {/* Description */}
                          <span className="text-sm font-medium truncate flex-shrink min-w-0">
                            {item.description}
                          </span>

                          {/* Badge + Amount + Delete */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isFullyPaid && (
                              <Badge variant="default" className="bg-green-600 text-xs px-1.5 py-0">
                                Paid
                              </Badge>
                            )}
                            {isPartialPaid && (
                              <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs px-1.5 py-0">
                                ₦{Number(status.totalAllocated).toLocaleString()}
                              </Badge>
                            )}

                            <span className="font-semibold text-sm w-20 text-right">
                              ₦{Number.parseFloat(item.amount).toLocaleString()}
                            </span>

                            {userRole === "admin" && canDelete ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteInvoiceItem(item.id)}
                                disabled={deletingItemId === item.id}
                                title="Remove fee"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <div className="w-6" /> /* Spacer to keep alignment */
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Add Fee Button */}
                    {userRole === "admin" && (
                      <Button
                        variant="outline"
                        className="w-full mt-3 gap-2 bg-transparent"
                        onClick={handleOpenAddFeeDialog}
                      >
                        <Plus className="h-4 w-4" />
                        Add Fee
                      </Button>
                    )}

                    <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold text-sm">
                      <span>Total</span>
                      <span className="pr-6">₦{Number.parseFloat(invoice.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Payment History Tab */}
              <TabsContent value="history" className="mt-4">
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payment history</p>
                ) : (
                  <div className="divide-y">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-muted/50 transition-colors -mx-2 px-2 rounded"
                        onClick={() => setSelectedPaymentId(payment.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-600/10 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(payment.payment_date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {payment.payment_method}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">
                            ₦{Number.parseFloat(payment.amount).toLocaleString()}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Parent Info Tab */}
              <TabsContent value="parent" className="mt-4">
                {invoice.students?.student_guardians && invoice.students.student_guardians.length > 0 ? (
                  <div className="divide-y border rounded-lg overflow-hidden">
                    {invoice.students.student_guardians.map((sg: any, idx: number) => {
                      const guardian = sg.guardian
                      if (!guardian) return null

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-muted/30 flex items-center justify-between group hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => guardian.id && setSelectedGuardianId(guardian.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                              {guardian.first_name?.[0]}{guardian.last_name?.[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">
                                  {guardian.first_name} {guardian.last_name}
                                </p>
                                {sg.is_primary && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">Primary</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground capitalize">
                                {sg.relationship || "Guardian"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {guardian.phone && (
                              <a
                                href={`tel:${guardian.phone}`}
                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-green-100 text-muted-foreground hover:text-green-700 transition-colors"
                                title="Call Parent"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                            {guardian.email && (
                              <a
                                href={`mailto:${guardian.email}`}
                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-blue-100 text-muted-foreground hover:text-blue-700 transition-colors"
                                title="Email Parent"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                    <User className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No parent information available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Collect Payment Button */}
            {invoice.balance > 0 && (
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" size="lg">
                <CreditCard className="h-4 w-4" />
                Collect Payment (₦{Number.parseFloat(invoice.balance).toLocaleString()})
              </Button>
            )}

            {/* Delete Invoice Button - Only if no payments made */}
            {userRole === "admin" && Number.parseFloat(invoice.amount_paid) === 0 && (
              <Button
                variant="destructive"
                className="w-full gap-2"
                size="lg"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">Invoice not found</div>
        )}
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteInvoice}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Details Sheet */}
      {invoice?.student_id && (
        <StudentDetailsSheet
          studentId={invoice.student_id}
          open={studentDetailsOpen}
          onOpenChange={setStudentDetailsOpen}
          sessions={[]}
          terms={[]}
          classes={[]}
          userRole={userRole}
        />
      )}

      {/* Add Fee Dialog */}
      <Dialog open={addFeeDialogOpen} onOpenChange={setAddFeeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fee</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableFees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No additional fees available to add
              </p>
            ) : (
              availableFees.map((fee) => (
                <button
                  key={fee.id}
                  onClick={() => {
                    handleAddFee(fee)
                    setAddFeeDialogOpen(false)
                  }}
                  className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{fee.fee_categories?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">₦{Number(fee.amount).toLocaleString()}</p>
                    </div>
                    <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Details Sheet */}
      {selectedPaymentId && (
        <PaymentDetailsSheet
          paymentId={selectedPaymentId}
          open={!!selectedPaymentId}
          onOpenChange={(open) => {
            if (!open) setSelectedPaymentId(null)
          }}
          userRole={userRole}
        />
      )}

      {/* Guardian Details Sheet */}
      {selectedGuardianId && (
        <GuardianDetailsSheet
          guardianId={selectedGuardianId}
          open={!!selectedGuardianId}
          onOpenChange={(open) => {
            if (!open) setSelectedGuardianId(null)
          }}
        />
      )}
    </Sheet>
  )
}
