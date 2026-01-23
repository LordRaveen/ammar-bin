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
    console.log("[v0] Fetching invoice items with IDs:", items.map((i) => i.invoice_item_id))
    
    const { data: invoiceItems, error: itemsError } = await supabase
      .from("invoice_items")
      .select(
        `
        id,
        amount,
        status,
        invoice_id,
        invoices(id, invoice_number, status, balance, total_amount, amount_paid)
      `
      )
      .in(
        "id",
        items.map((i) => i.invoice_item_id)
      )

    console.log("[v0] Invoice items response:", { invoiceItems, itemsError })

    if (itemsError) {
      console.error("[v0] Error fetching invoice items:", itemsError)
      return Response.json(
        { error: `Failed to fetch invoice items: ${itemsError.message}` },
        { status: 500 }
      )
    }

    if (!invoiceItems || invoiceItems.length === 0) {
      console.error("[v0] No invoice items found for IDs:", items.map((i) => i.invoice_item_id))
      return Response.json(
        { error: "No invoice items found" },
        { status: 404 }
      )
    }

    // Validate items exist and their invoices are not fully paid
    for (const item of invoiceItems) {
      const invoice = item.invoices as any
      if (invoice?.status === "Paid") {
        return Response.json(
          { error: `Invoice ${invoice.invoice_number} is already fully paid` },
          { status: 400 }
        )
      }

      if (item.status === "Paid") {
        return Response.json(
          { error: `Item is already fully paid` },
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
        student_id: items[0]?.student_id, // Get student ID from first item
        received_by: user.id,
        payment_date: new Date().toISOString().split('T')[0],
        remarks: total_discount > 0 || total_waiver > 0 ? `Discount: ₦${total_discount}, Waiver: ₦${total_waiver}` : null,
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
      amount: item.amount,
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

    // Update invoice item statuses
    for (const item of items) {
      const invoiceItem = invoiceItems.find((ii) => ii.id === item.invoice_item_id)
      if (!invoiceItem) continue

      const newItemBalance = invoiceItem.amount - item.amount
      const itemStatus = newItemBalance === 0 ? "Paid" : newItemBalance < invoiceItem.amount ? "Partial" : "Unpaid"

      const { error: itemUpdateError } = await supabase
        .from("invoice_items")
        .update({
          status: itemStatus,
        })
        .eq("id", item.invoice_item_id)

      if (itemUpdateError) {
        console.error("[v0] Error updating invoice item status:", itemUpdateError)
        // Rollback
        await supabase.from("payments").delete().eq("id", payment.id)
        return Response.json({ error: "Failed to update item status" }, { status: 500 })
      }
    }

    // Update invoice balances based on items paid
    const invoiceMap = new Map<string, any>()
    invoiceItems.forEach((item) => {
      if (!invoiceMap.has(item.invoice_id)) {
        invoiceMap.set(item.invoice_id, {
          invoice: item.invoices,
          totalItemAmount: 0,
          paidAmount: 0,
        })
      }

      const invoiceEntry = invoiceMap.get(item.invoice_id)!
      invoiceEntry.totalItemAmount += item.amount

      const paymentItem = items.find((i) => i.invoice_item_id === item.id)
      if (paymentItem) {
        invoiceEntry.paidAmount += paymentItem.amount
      }
    })

    // Update invoices with new balance and status
    for (const [invoiceId, invoiceEntry] of invoiceMap.entries()) {
      const invoice = invoiceEntry.invoice
      const newBalance = Math.max(0, (invoice?.balance || 0) - invoiceEntry.paidAmount)
      const newStatus = newBalance === 0 ? "Paid" : newBalance < (invoice?.total_amount || 0) ? "Partial" : "Unpaid"

      const { error: invoiceUpdateError } = await supabase
        .from("invoices")
        .update({
          balance: newBalance,
          amount_paid: (invoice?.amount_paid || 0) + invoiceEntry.paidAmount,
          status: newStatus,
        })
        .eq("id", invoiceId)

      if (invoiceUpdateError) {
        console.error("[v0] Error updating invoice:", invoiceUpdateError)
        // Rollback
        await supabase.from("payments").delete().eq("id", payment.id)
        return Response.json({ error: "Failed to update invoice" }, { status: 500 })
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
