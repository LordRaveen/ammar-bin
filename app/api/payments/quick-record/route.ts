import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { devLog } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { student_id, invoice_id, amount, payment_method, reference_number, payment_date } = body

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Generate receipt number
    const { count } = await supabase.from("payments").select("*", { count: "exact", head: true })

    const receiptNumber = `RCP/${new Date().getFullYear()}/${String((count || 0) + 1).padStart(3, "0")}`

    devLog("Recording quick payment:", { invoice_id, amount, receiptNumber })

    // Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        receipt_number: receiptNumber,
        invoice_id,
        student_id,
        amount,
        payment_method,
        payment_date,
        reference_number,
        received_by: user.id,
      })
      .select()
      .single()

    if (paymentError) {
      devLog("Error recording payment:", paymentError)
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
    }

    // Update invoice
    const newAmountPaid = Number.parseFloat(invoice.amount_paid) + Number.parseFloat(amount)
    const newBalance = Number.parseFloat(invoice.total_amount) - newAmountPaid

    let newStatus = "Pending"
    if (newBalance <= 0) {
      newStatus = "Paid"
    } else if (newAmountPaid > 0) {
      newStatus = "Partial"
    }

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      })
      .eq("id", invoice_id)

    if (updateError) {
      devLog("Error updating invoice:", updateError)
      return NextResponse.json({ error: "Payment recorded but invoice update failed" }, { status: 500 })
    }

    devLog("Payment recorded successfully")

    return NextResponse.json({
      success: true,
      receipt_number: receiptNumber,
      payment_id: payment.id,
    })
  } catch (error) {
    console.error("[v0] Quick payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
