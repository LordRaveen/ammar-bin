"use client"

import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ReceiptTemplate } from "@/components/receipt-template"
import { Button } from "@/components/ui/button"
import { Printer, Download, Mail } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth(["super_admin", "admin", "accountant"])
  const { id } = await params
  const supabase = await createServerClient()

  // Get payment details with all related information
  const { data: payment, error } = await supabase
    .from("payments")
    .select(`
      *,
      students (
        student_id,
        first_name,
        middle_name,
        last_name,
        gender
      ),
      invoices (
        invoice_number,
        total_amount,
        session_id,
        term_id,
        sessions (
          name
        ),
        terms (
          name
        )
      ),
      received_by_user:teachers!received_by (
        first_name,
        last_name,
        staff_id
      )
    `)
    .eq("id", id)
    .single()

  if (error || !payment) {
    notFound()
  }

  // Get school settings
  const { data: schoolSettings } = await supabase.from("school_settings").select("*").single()

  // Get invoice items
  const { data: invoiceItems } = await supabase
    .from("invoice_items")
    .select(`
      *,
      fee_categories (
        name
      )
    `)
    .eq("invoice_id", payment.invoice_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Receipt</h1>
          <p className="text-muted-foreground">Receipt #{payment.receipt_number}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Email Receipt
          </Button>
        </div>
      </div>

      <ReceiptTemplate payment={payment} schoolSettings={schoolSettings} invoiceItems={invoiceItems} />
    </div>
  )
}
