"use client"

import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReceiptViewer from "@/components/receipt-viewer"

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth(["super_admin", "admin", "accountant", "cashier"])
  const { id } = await params
  const supabase = await createServerClient()

  // Get payment details with all related information
  const { data: payment } = await supabase
    .from("payments")
    .select(
      `
      *,
      students (
        student_id,
        first_name,
        middle_name,
        last_name,
        student_enrollments!inner (
          classes (name)
        )
      ),
      invoices (
        invoice_number,
        total_amount,
        amount_paid,
        balance
      ),
      received_by_user:teachers!payments_received_by_fkey (
        first_name,
        last_name,
        staff_id
      )
    `,
    )
    .eq("id", id)
    .single()

  if (!payment) {
    notFound()
  }

  // Get school settings
  const { data: schoolSettings } = await supabase.from("school_settings").select("*").single()

  const receiptData = {
    receiptNumber: payment.receipt_number,
    paymentDate: new Date(payment.payment_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    studentName:
      `${payment.students.first_name} ${payment.students.middle_name || ""} ${payment.students.last_name}`.trim(),
    studentId: payment.students.student_id,
    className: payment.students.student_enrollments[0]?.classes?.name || "N/A",
    amount: Number.parseFloat(payment.amount),
    paymentMethod: payment.payment_method,
    referenceNumber: payment.reference_number || undefined,
    receivedBy: payment.received_by_user
      ? `${payment.received_by_user.first_name} ${payment.received_by_user.last_name} (${payment.received_by_user.staff_id})`
      : "System",
    invoiceNumber: payment.invoices?.invoice_number || "N/A",
    remarks: payment.remarks || undefined,
    schoolName: schoolSettings?.school_name || "Ammar Bin Yasir Institute",
    schoolNameArabic: schoolSettings?.school_name_arabic || "معهد عمار بن ياسر",
    schoolAddress: schoolSettings?.address || "",
    schoolPhone: schoolSettings?.phone_primary || "",
    schoolEmail: schoolSettings?.email || "",
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/finance/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Payment Receipt</h1>
          <p className="text-muted-foreground">{receiptData.receiptNumber}</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <ReceiptViewer data={receiptData} />
    </div>
  )
}
