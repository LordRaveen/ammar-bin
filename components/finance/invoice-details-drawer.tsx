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
import { CreditCard, FileText, History, Trash2, User, Plus } from "lucide-react"
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
            students(first_name, last_name, student_id)
          `)
          .eq("id", invoiceId)
          .single()

        // Fetch invoice items
        const { data: itemsData } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoiceId)

        // Fetch payments with allocations
        const { data: paymentsData } = await supabase
          .from("payments")
          .select(`
            *,
            payment_allocations(
              id,
              invoice_item_id,
              amount
            )
          `)
          .eq("invoice_id", invoiceId)
          .order("created_at", { ascending: false })

        // Build payment status map for each item
        const statusMap: Record<string, any> = {}
        itemsData?.forEach((item) => {
          const allocations = paymentsData
            ?.flatMap(p => p.payment_allocations || [])
            .filter(a => a.invoice_item_id === item.id) || []

          const totalAllocated = allocations.reduce((sum: number, a: any) => sum + Number(a.amount), 0)
          const itemAmount = Number(item.amount)
          
          statusMap[item.id] = {
            totalAllocated,
            isFullyPaid: totalAllocated >= itemAmount,
            isPartiallPaid: totalAllocated > 0 && totalAllocated < itemAmount,
            allocations,
          }
        })

        setInvoice(invoiceData)
        setInvoiceItems(itemsData || [])
        setPayments(paymentsData || [])
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
      // Get the student's current class for context
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("id", invoice.student_id)
        .single()

      const studentClassId = studentData?.current_class_id

      if (!studentClassId) {
        toast.error("Could not determine student's class")
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
        toast.error("No available fees to add")
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
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto px-6">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading invoice details...</div>
        ) : invoice ? (
          <div className="space-y-6">
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
              <TabsContent value="breakdown" className="space-y-3 mt-4">
                {invoiceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoice items</p>
                ) : (
                  <div className="space-y-2">
                    {invoiceItems.map((item) => {
                      const status = itemPaymentStatus[item.id] || {}
                      const isPaid = status.isFullyPaid || status.isPartiallPaid
                      
                      return (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-muted group hover:bg-muted/80 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.description}</p>
                            {isPaid && (
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {status.isFullyPaid && (
                                  <Badge variant="default" className="bg-green-600">
                                    Fully Paid: ₦{Number(status.totalAllocated).toLocaleString()}
                                  </Badge>
                                )}
                                {status.isPartiallPaid && (
                                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                                    Partial: ₦{Number(status.totalAllocated).toLocaleString()} / ₦{Number(item.amount).toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold">
                              ₦{Number.parseFloat(item.amount).toLocaleString()}
                            </p>
                            {userRole === "admin" && !isPaid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteInvoiceItem(item.id)}
                                disabled={deletingItemId === item.id}
                                title="Remove fee"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Add Fee Button */}
                    {userRole === "admin" && (
                      <Button
                        variant="outline"
                        className="w-full mt-4 gap-2 bg-transparent"
                        onClick={handleOpenAddFeeDialog}
                      >
                        <Plus className="h-4 w-4" />
                        Add Fee
                      </Button>
                    )}

                    <div className="border-t pt-3 mt-3 flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>₦{Number.parseFloat(invoice.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Payment History Tab */}
              <TabsContent value="history" className="space-y-3 mt-4">
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payment history</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200">
                        <div>
                          <p className="font-medium text-sm">Payment Received</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            ₦{Number.parseFloat(payment.amount).toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Parent Info Tab */}
              <TabsContent value="parent" className="space-y-3 mt-4">
                {invoice.guardians && invoice.guardians.length > 0 ? (
                  <div className="space-y-3">
                    {invoice.guardians.map((guardian: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <p className="font-semibold">
                              {guardian.first_name} {guardian.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{guardian.phone}</p>
                            <p className="text-sm text-muted-foreground">{guardian.email}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No parent information</p>
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
                  className="w-full p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{fee.fee_categories?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Amount: ₦{Number(fee.amount).toLocaleString()}</p>
                    </div>
                    <Plus className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
