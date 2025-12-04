import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { studentIds, sessionId, termId, feeItems } = body

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "Student IDs are required" }, { status: 400 })
    }

    if (!sessionId || !termId) {
      return NextResponse.json({ error: "Session and term are required" }, { status: 400 })
    }

    if (!feeItems || feeItems.length === 0) {
      return NextResponse.json({ error: "Fee items are required" }, { status: 400 })
    }

    // Calculate total amount
    const totalAmount = feeItems.reduce((sum: number, item: any) => {
      return sum + Number.parseFloat(item.amount || 0)
    }, 0)

    // Get term data for due date calculation (30 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const invoicesCreated = []
    const errors = []

    // Generate invoice for each student
    for (const studentId of studentIds) {
      try {
        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from("invoices")
          .select("id")
          .eq("student_id", studentId)
          .eq("session_id", sessionId)
          .eq("term_id", termId)
          .maybeSingle()

        if (existingInvoice) {
          errors.push({
            studentId,
            error: "Invoice already exists for this session/term",
          })
          continue
        }

        // Generate invoice number (format: INV-YYYY-XXXXXX)
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            invoice_number: invoiceNumber,
            student_id: studentId,
            session_id: sessionId,
            term_id: termId,
            total_amount: totalAmount,
            amount_paid: 0,
            balance: totalAmount,
            status: "Pending",
            due_date: dueDate.toISOString().split("T")[0],
            generated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (invoiceError) throw invoiceError

        // Create invoice items
        const invoiceItems = feeItems.map((item: any) => ({
          invoice_id: invoice.id,
          fee_category_id: item.fee_category_id,
          description: item.fee_category_name,
          amount: item.amount,
        }))

        const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)

        if (itemsError) throw itemsError

        invoicesCreated.push(invoice)
      } catch (error: any) {
        console.error(`Error creating invoice for student ${studentId}:`, error)
        errors.push({
          studentId,
          error: error.message || "Failed to create invoice",
        })
      }
    }

    return NextResponse.json({
      success: true,
      count: invoicesCreated.length,
      invoices: invoicesCreated,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("Error generating invoices:", error)
    return NextResponse.json({ error: error.message || "Failed to generate invoices" }, { status: 500 })
  }
}
