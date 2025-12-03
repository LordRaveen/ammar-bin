"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface ReversePaymentInput {
  paymentId: string
  reason: string
}

export async function reversePayment(input: ReversePaymentInput) {
  const supabase = await createServerClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: "Unauthorized" }
    }

    // Get teacher ID
    const { data: teacher } = await supabase.from("teachers").select("id").eq("user_id", user.id).single()

    // Get payment details
    const { data: payment } = await supabase
      .from("payments")
      .select("*, invoices(*)")
      .eq("id", input.paymentId)
      .single()

    if (!payment) {
      return { success: false, message: "Payment not found" }
    }

    // Check if already reversed
    const { data: existingReversal } = await supabase
      .from("payment_reversals")
      .select("id")
      .eq("payment_id", input.paymentId)
      .maybeSingle()

    if (existingReversal) {
      return { success: false, message: "Payment has already been reversed" }
    }

    // Create reversal record
    const { error: reversalError } = await supabase.from("payment_reversals").insert({
      payment_id: input.paymentId,
      reason: input.reason,
      reversed_by: teacher?.id,
      approved_by: teacher?.id,
    })

    if (reversalError) {
      console.error("Error creating reversal:", reversalError)
      return { success: false, message: "Failed to create reversal record" }
    }

    // Update invoice - reverse the payment
    const invoice = payment.invoices
    const newAmountPaid = Number.parseFloat(invoice.amount_paid) - Number.parseFloat(payment.amount)
    const newBalance = Number.parseFloat(invoice.balance) + Number.parseFloat(payment.amount)

    let newStatus = "Pending"
    if (newAmountPaid > 0) {
      newStatus = "Partial"
    }
    if (new Date(invoice.due_date) < new Date()) {
      newStatus = "Overdue"
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      })
      .eq("id", payment.invoice_id)

    if (invoiceError) {
      console.error("Error updating invoice:", invoiceError)
      return { success: false, message: "Failed to update invoice" }
    }

    revalidatePath("/finance/payments")
    revalidatePath("/finance/invoices")

    return {
      success: true,
      message: `Payment reversed successfully. Invoice balance updated.`,
    }
  } catch (error) {
    console.error("Error reversing payment:", error)
    return { success: false, message: "An error occurred" }
  }
}
