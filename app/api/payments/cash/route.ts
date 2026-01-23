import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      guardian_id,
      payment_method,
      items,
      total_discount = 0,
      total_waiver = 0,
    } = body

    // Validate input
    if (!guardian_id || !payment_method || !items || items.length === 0) {
      return Response.json(
        { error: "Missing required payment information" },
        { status: 400 }
      )
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.invoice_item_id || typeof item.amount !== "number" || item.amount <= 0) {
        return Response.json(
          { error: "Invalid payment item data" },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Get current user for "collected_by"
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Start transaction - fetch all data first for validation
    const { data: invoiceItems, error: itemsError } = await supabase
      .from("invoice_items")
      .select(
        `
        id,
        amount,
        status,
        invoice:invoices(id, invoice_number, status)
      `
      )
      .in(
        "id",
        items.map((i) => i.invoice_item_id)
      )

    if (itemsError) {
      console.error("[v0] Error fetching invoice items:", itemsError)
      return Response.json({ error: "Failed to fetch invoice items" }, { status: 500 })
    }

    // Validate items exist and are not fully paid
    for (const item of invoiceItems) {
      if (item.status === "Paid") {
        return Response.json(
          { error: `Item ${item.id} is already fully paid` },
          { status: 400 }
        )
      }

      const paymentItem = items.find((i) => i.invoice_item_id === item.id)
      if (paymentItem && paymentItem.amount > item.amount) {
        return Response.json(
          { error: `Payment amount exceeds item balance` },
          { status: 400 }
        )
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    // Generate reference number
    const refNumber = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${nanoid(4).toUpperCase()}`

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        reference_number: refNumber,
        amount: totalAmount,
        payment_method,
        status: "completed",
        paid_at: new Date().toISOString(),
        guardian_id,
        received_by: user.id,
        notes: total_discount > 0 || total_waiver > 0 ? `Discount: ₦${total_discount}, Waiver: ₦${total_waiver}` : null,
      })
      .select()
      .single()

    if (paymentError) {
      console.error("[v0] Error creating payment:", paymentError)
      return Response.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    // Create payment allocations for each item
    const allocations = items.map((item) => ({
      payment_id: payment.id,
      invoice_item_id: item.invoice_item_id,
      amount_allocated: item.amount,
    }))

    const { error: allocError } = await supabase
      .from("payment_allocations")
      .insert(allocations)

    if (allocError) {
      console.error("[v0] Error creating allocations:", allocError)
      // Delete payment record to rollback
      await supabase.from("payments").delete().eq("id", payment.id)
      return Response.json({ error: "Failed to allocate payment" }, { status: 500 })
    }

    // Update invoice items - reduce balance and update status
    for (const item of items) {
      const invoiceItem = invoiceItems.find((ii) => ii.id === item.invoice_item_id)
      if (!invoiceItem) continue

      const newBalance = invoiceItem.amount - item.amount
      const newStatus = newBalance === 0 ? "Paid" : "Partial"

      const { error: updateError } = await supabase
        .from("invoice_items")
        .update({
          amount: newBalance,
          status: newStatus,
        })
        .eq("id", item.invoice_item_id)

      if (updateError) {
        console.error("[v0] Error updating invoice item:", updateError)
        // Rollback
        await supabase.from("payments").delete().eq("id", payment.id)
        return Response.json({ error: "Failed to update invoice items" }, { status: 500 })
      }
    }

    // Update invoice statuses based on their items
    const invoiceIds = [...new Set(invoiceItems.map((ii) => ii.invoice?.id))]

    for (const invoiceId of invoiceIds) {
      if (!invoiceId) continue

      // Get all items for this invoice
      const { data: allItems } = await supabase
        .from("invoice_items")
        .select("status, amount")
        .eq("invoice_id", invoiceId)

      if (!allItems || allItems.length === 0) continue

      // Determine invoice status
      const allPaid = allItems.every((item) => item.status === "Paid" && item.amount === 0)
      const somePaid = allItems.some((item) => item.status === "Paid" || item.status === "Partial")
      const invoiceStatus = allPaid ? "Paid" : somePaid ? "Partial" : "Unpaid"

      const { error: invoiceUpdateError } = await supabase
        .from("invoices")
        .update({ status: invoiceStatus })
        .eq("id", invoiceId)

      if (invoiceUpdateError) {
        console.error("[v0] Error updating invoice status:", invoiceUpdateError)
      }
    }

    return Response.json(
      {
        success: true,
        payment_id: payment.id,
        reference_number: refNumber,
        amount: totalAmount,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[v0] Payment API error:", error)
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
