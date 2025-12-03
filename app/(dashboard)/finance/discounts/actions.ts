"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface ApplyDiscountInput {
  invoiceId: string
  studentId: string
  discountType: "Percentage" | "Fixed" | "Waiver"
  amount: number
  reason: string
}

export async function applyDiscount(input: ApplyDiscountInput) {
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

    // Get invoice details
    const { data: invoice } = await supabase.from("invoices").select("*").eq("id", input.invoiceId).single()

    if (!invoice) {
      return { success: false, message: "Invoice not found" }
    }

    // Validate discount amount
    if (input.amount > Number.parseFloat(invoice.balance)) {
      return { success: false, message: "Discount amount exceeds invoice balance" }
    }

    // Create discount record
    const { error: discountError } = await supabase.from("discounts").insert({
      invoice_id: input.invoiceId,
      student_id: input.studentId,
      discount_type: input.discountType,
      amount: input.amount,
      reason: input.reason,
      created_by: teacher?.id,
      approved_by: teacher?.id,
      approved_at: new Date().toISOString(),
    })

    if (discountError) {
      console.error("Error creating discount:", discountError)
      return { success: false, message: "Failed to create discount record" }
    }

    // Update invoice balance
    const newBalance = Number.parseFloat(invoice.balance) - input.amount
    const newTotalAmount = Number.parseFloat(invoice.total_amount) - input.amount

    let newStatus = "Pending"
    if (newBalance <= 0) {
      newStatus = "Paid"
    } else if (Number.parseFloat(invoice.amount_paid) > 0) {
      newStatus = "Partial"
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        balance: newBalance,
        total_amount: newTotalAmount,
        status: newStatus,
      })
      .eq("id", input.invoiceId)

    if (invoiceError) {
      console.error("Error updating invoice:", invoiceError)
      return { success: false, message: "Failed to update invoice" }
    }

    revalidatePath("/finance/discounts")
    revalidatePath("/finance/invoices")

    return {
      success: true,
      message: `Discount of ₦${input.amount.toLocaleString()} applied successfully`,
    }
  } catch (error) {
    console.error("Error applying discount:", error)
    return { success: false, message: "An error occurred" }
  }
}
