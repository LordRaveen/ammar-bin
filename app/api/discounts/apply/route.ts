import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { invoiceId, studentId, discountType, amount, reason } = body

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's teacher profile
    const { data: teacher } = await supabase.from("teachers").select("id, role").eq("user_id", user.id).single()

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    // Check if discount requires approval
    const requiresApproval =
      discountType === "Waiver" || (discountType === "Percentage" && Number.parseFloat(amount) > 20)

    // Get invoice details
    const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single()

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Calculate actual discount amount
    let discountAmount = Number.parseFloat(amount)
    if (discountType === "Percentage") {
      discountAmount = (Number.parseFloat(invoice.balance) * discountAmount) / 100
    }

    // Create discount record
    const { data: discount, error: discountError } = await supabase
      .from("discounts")
      .insert({
        invoice_id: invoiceId,
        student_id: studentId,
        discount_type: discountType,
        amount: discountAmount,
        reason,
        created_by: teacher.id,
        approved_by: requiresApproval ? null : teacher.id,
        approved_at: requiresApproval ? null : new Date().toISOString(),
      })
      .select()
      .single()

    if (discountError) {
      console.error("[v0] Discount creation error:", discountError)
      return NextResponse.json({ error: "Failed to create discount" }, { status: 500 })
    }

    // If doesn't require approval, apply immediately
    if (!requiresApproval) {
      const newBalance = Number.parseFloat(invoice.balance) - discountAmount
      const newAmountPaid = Number.parseFloat(invoice.total_amount) - newBalance
      const newStatus =
        newBalance <= 0 ? "Paid" : newBalance < Number.parseFloat(invoice.total_amount) ? "Partial" : "Pending"

      await supabase
        .from("invoices")
        .update({
          amount_paid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        })
        .eq("id", invoiceId)
    }

    return NextResponse.json({
      success: true,
      requiresApproval,
      discount,
    })
  } catch (error) {
    console.error("[v0] Discount application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
