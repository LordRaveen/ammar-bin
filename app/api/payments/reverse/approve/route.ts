import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const supabase = await createServerClient()
    const { data: teacher } = await supabase.from("teachers").select("role").eq("user_id", user.id).single()

    if (!teacher || !["super_admin", "admin"].includes(teacher.role)) {
      return NextResponse.json({ error: "Only admins can approve reversals" }, { status: 403 })
    }

    const { reversalId } = await request.json()

    if (!reversalId) {
      return NextResponse.json({ error: "Reversal ID is required" }, { status: 400 })
    }

    // Get reversal details with payment and invoice info
    const { data: reversal, error: reversalError } = await supabase
      .from("payment_reversals")
      .select(`
        *,
        payments (
          id,
          amount,
          invoice_id,
          invoices (
            id,
            balance,
            amount_paid,
            status
          )
        )
      `)
      .eq("id", reversalId)
      .single()

    if (reversalError || !reversal) {
      return NextResponse.json({ error: "Reversal request not found" }, { status: 404 })
    }

    if (reversal.approved_by) {
      return NextResponse.json({ error: "Reversal already approved" }, { status: 400 })
    }

    const payment = reversal.payments
    const invoice = payment.invoices

    // Calculate new invoice balance after reversal
    const newBalance = Number.parseFloat(invoice.balance) + Number.parseFloat(payment.amount)
    const newAmountPaid = Number.parseFloat(invoice.amount_paid) - Number.parseFloat(payment.amount)

    // Determine new invoice status
    let newStatus = "Pending"
    if (newBalance <= 0) {
      newStatus = "Paid"
    } else if (newAmountPaid > 0) {
      newStatus = "Partial"
    }

    // Update reversal to approved
    const { error: updateReversalError } = await supabase
      .from("payment_reversals")
      .update({ approved_by: user.id })
      .eq("id", reversalId)

    if (updateReversalError) {
      console.error("Reversal update error:", updateReversalError)
      return NextResponse.json({ error: "Failed to approve reversal" }, { status: 500 })
    }

    // Update invoice balance and status
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        balance: newBalance,
        amount_paid: newAmountPaid,
        status: newStatus,
      })
      .eq("id", invoice.id)

    if (invoiceError) {
      console.error("Invoice update error:", invoiceError)
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
    }

    // Delete the payment record
    const { error: deleteError } = await supabase.from("payments").delete().eq("id", payment.id)

    if (deleteError) {
      console.error("Payment deletion error:", deleteError)
      return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Payment reversed successfully",
    })
  } catch (error) {
    console.error("Reversal approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
