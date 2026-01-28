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
import { CreditCard, FileText, History, Trash2, User, Plus, ChevronRight, Phone, Mail, Printer } from "lucide-react"
import { usePrint } from "./print-provider"
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
import { Separator } from "@/components/ui/separator"

interface InvoiceDetailsDrawerProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: "admin" | "accountant" | "parent" | "super_admin"
  onCollectPayment?: (studentId: string, invoiceId?: string) => void
}

export function InvoiceDetailsDrawer({
  invoiceId,
  open,
  onOpenChange,
  userRole = "admin",
  onCollectPayment,
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
  const { print } = usePrint()

  const handlePrint = () => {
    if (!invoice) return

    const primaryGuardian = invoice.students?.student_guardians?.find((sg: any) => sg.is_primary)?.guardian

    print("invoice", {
      invoice_number: invoice.invoice_number,
      issue_date: invoice.created_at,
      due_date: invoice.due_date,
      student_name: `${invoice.students?.first_name} ${invoice.students?.last_name}`,
      student_id: invoice.students?.student_id,
      class_name: invoice.classes?.name || "N/A",
      parent_name: primaryGuardian ? `${primaryGuardian.first_name} ${primaryGuardian.last_name}` : undefined,
      parent_phone: primaryGuardian?.phone,
      items: invoiceItems,
      total_amount: Number(invoice.total_amount),
      balance: Number(invoice.balance),
      status: invoice.status,
      term: "Terminal Fee"
    })
  }

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) return

      setLoading(true)
      try {
        const { data: invoiceData } = await supabase
          .from("invoices")
          .select(`
            *,
            classes:class_id(name),
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

        const { data: itemsData } = await supabase
          .from("invoice_items")
          .select("*, fee_categories(name)")
          .eq("invoice_id", invoiceId)

        const { data: allocationsData } = await supabase
          .from("payment_allocations")
          .select(`
            id,
            payment_id,
            invoice_item_id,
            amount,
            payments(*)
          `)
          .eq("invoice_id", invoiceId)

        const statusMap: Record<string, any> = {}
        itemsData?.forEach((item) => {
          const itemAllocations = allocationsData?.filter(a => a.invoice_item_id === item.id) || []
          const totalAllocated = itemAllocations.reduce((sum, a) => sum + Number(a.amount), 0)
          const itemAmount = Number(item.amount)

          statusMap[item.id] = {
            totalAllocated,
            isFullyPaid: totalAllocated >= itemAmount,
            isPartiallyPaid: totalAllocated > 0 && totalAllocated < itemAmount,
          }
        })

        const paymentIds = new Set<string>()
        const uniquePayments: any[] = []
        allocationsData?.forEach(allocation => {
          if (allocation.payments && !paymentIds.has(allocation.payment_id)) {
            paymentIds.add(allocation.payment_id)
            uniquePayments.push(allocation.payments)
          }
        })
        uniquePayments.sort((a, b) => new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime())

        setInvoice(invoiceData)
        setInvoiceItems(itemsData || [])
        setPayments(uniquePayments)
        setItemPaymentStatus(statusMap)
      } catch (error) {
        console.error("Error fetching invoice details:", error)
      } finally {
        setLoading(false)
      }
    }

    if (open) fetchInvoiceDetails()
  }, [invoiceId, open, supabase])

  const handleCollectPaymentClick = () => {
    if (onCollectPayment && invoice?.student_id) {
      onCollectPayment(invoice.student_id, invoice.id)
      onOpenChange(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800"
      case "Pending": return "bg-yellow-100 text-yellow-800"
      case "Partial": return "bg-blue-100 text-blue-800"
      case "Overdue": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleDeleteInvoice = async () => {
    if (!invoice) return
    setDeleting(true)
    try {
      const { error } = await supabase.from("invoices").update({ deleted_at: new Date().toISOString() }).eq("id", invoice.id)
      if (error) throw error
      toast.success("Invoice deleted successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error("Error deleting invoice")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteInvoiceItem = async (itemId: string) => {
    setDeletingItemId(itemId)
    try {
      const { error } = await supabase.from("invoice_items").delete().eq("id", itemId)
      if (error) throw error
      toast.success("Fee removed successfully")
      // Quick refresh logic or refetch
    } catch (error) {
      toast.error("Error removing fee")
    } finally {
      setDeletingItemId(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        {loading ? (
          <div className="py-12 text-center">Loading invoice...</div>
        ) : invoice ? (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle className="text-2xl">Invoice {invoice.invoice_number}</SheetTitle>
              <SheetDescription>Student: {invoice.students?.first_name} {invoice.students?.last_name}</SheetDescription>
            </SheetHeader>

            <Card className="shadow-none border-zinc-200">
              <CardContent className="pt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black">Total Due</p>
                  <p className="text-xl font-black">₦{Number(invoice.total_amount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase font-black">Remaining</p>
                  <p className="text-xl font-black text-red-600">₦{Number(invoice.balance).toLocaleString()}</p>
                </div>
                <Badge className={`mt-2 ${getStatusColor(invoice.status)}`}>{invoice.status}</Badge>
              </CardContent>
            </Card>

            <Tabs defaultValue="breakdown">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="breakdown">Fees</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="parent">Parent</TabsTrigger>
              </TabsList>

              <TabsContent value="breakdown" className="space-y-3 mt-4">
                {invoiceItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <div>
                      <p className="text-sm font-bold">{item.fee_categories?.name || item.description}</p>
                    </div>
                    <p className="text-sm font-mono font-bold">₦{Number(item.amount).toLocaleString()}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="history" className="space-y-3 mt-4">
                {payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payments yet</p>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-zinc-50 cursor-pointer" onClick={() => setSelectedPaymentId(p.id)}>
                      <div>
                        <p className="text-sm font-bold">{new Date(p.payment_date || p.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.payment_method}</p>
                      </div>
                      <p className="text-sm font-bold text-green-600">₦{Number(p.amount).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="parent" className="mt-4">
                {/* Parent info component */}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2 h-12" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              {invoice.balance > 0 && (
                <Button className="flex-[2] gap-2 h-12 bg-green-600 hover:bg-green-700" onClick={handleCollectPaymentClick}>
                  <CreditCard className="h-4 w-4" /> Collect Payment
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">Invoice not found</div>
        )}
      </SheetContent>

      {selectedPaymentId && (
        <PaymentDetailsSheet
          paymentId={selectedPaymentId}
          open={!!selectedPaymentId}
          onOpenChange={(open) => !open && setSelectedPaymentId(null)}
          userRole={userRole}
        />
      )}
    </Sheet>
  )
}
