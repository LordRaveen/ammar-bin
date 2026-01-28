import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

export interface PaymentFulfillmentData {
    student_id: string
    amount: number
    payment_method: string
    reference_number: string
    payment_date?: string
    remarks?: string
    metadata?: any
    items: {
        invoice_item_id: string
        amount: number
    }[]
    received_by?: string // Optional for online payments, might be a system user ID
}

export async function fulfillPayment(data: PaymentFulfillmentData) {
    const supabase = await createClient()
    const {
        student_id,
        amount,
        payment_method,
        reference_number,
        payment_date,
        remarks,
        metadata,
        items,
        received_by
    } = data

    console.log(`[PaymentFulfillment] Fulfilling payment ${reference_number} for amount ${amount}`)

    // 1. Check if payment already exists to prevent duplicates
    const { data: existingPayment } = await supabase
        .from("payments")
        .select("id, status")
        .eq("reference_number", reference_number)
        .maybeSingle()

    if (existingPayment && existingPayment.status === "completed") {
        console.log(`[PaymentFulfillment] Payment ${reference_number} already completed.`)
        return { success: true, payment_id: existingPayment.id, already_completed: true }
    }

    // 2. Fetch invoice items and invoices for validation and calculation
    const { data: invoiceItems, error: itemsError } = await supabase
        .from("invoice_items")
        .select(`
      id,
      amount,
      status,
      invoice_id,
      invoices(id, invoice_number, status, balance, total_amount, amount_paid, student_id)
    `)
        .in("id", items.map((i) => i.invoice_item_id))

    if (itemsError || !invoiceItems || invoiceItems.length === 0) {
        throw new Error(`Failed to fetch invoice items: ${itemsError?.message || "Not found"}`)
    }

    // 3. Status/Balance Logic
    const receiptNumber = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${nanoid(6).toUpperCase()}`
    const paymentDateObj = payment_date ? new Date(payment_date) : new Date()

    // 4. Create or Update Payment Record
    let paymentId: string

    if (existingPayment) {
        // Update pending to completed
        const { data: updatedPayment, error: updateError } = await supabase
            .from("payments")
            .update({
                status: "completed",
                paid_at: paymentDateObj.toISOString(),
                receipt_number: receiptNumber,
                metadata: metadata || {},
                remarks: remarks
            })
            .eq("id", existingPayment.id)
            .select()
            .single()

        if (updateError) throw new Error(`Failed to update payment: ${updateError.message}`)
        paymentId = updatedPayment.id
    } else {
        // Insert new payment
        const { data: newPayment, error: insertError } = await supabase
            .from("payments")
            .insert({
                reference_number,
                receipt_number: receiptNumber,
                amount,
                payment_method,
                status: "completed",
                paid_at: paymentDateObj.toISOString(),
                student_id,
                received_by: received_by || null, // System can be null or a specific service account ID
                payment_date: payment_date || new Date().toISOString().split('T')[0],
                remarks,
                metadata: metadata || {},
            })
            .select()
            .single()

        if (insertError) throw new Error(`Failed to create payment: ${insertError.message}`)
        paymentId = newPayment.id
    }

    // 5. Create Payment Allocations
    const allocations = items.map((item) => {
        const invoiceItem = invoiceItems.find((ii) => ii.id === item.invoice_item_id)
        return {
            payment_id: paymentId,
            invoice_item_id: item.invoice_item_id,
            invoice_id: invoiceItem?.invoice_id,
            student_id,
            amount: item.amount,
        }
    })

    const { error: allocError } = await supabase.from("payment_allocations").insert(allocations)
    if (allocError) throw new Error(`Failed to allocate payment: ${allocError.message}`)

    // 6. Update Invoice Items Statuses
    for (const item of items) {
        const invoiceItem = invoiceItems.find((ii) => ii.id === item.invoice_item_id)
        if (!invoiceItem) continue

        const newItemBalance = invoiceItem.amount - item.amount
        const itemStatus = newItemBalance === 0 ? "Paid" : newItemBalance < invoiceItem.amount ? "Partial" : "Unpaid"

        const { error: itemUpdateError } = await supabase
            .from("invoice_items")
            .update({ status: itemStatus })
            .eq("id", item.invoice_item_id)

        if (itemUpdateError) throw new Error("Failed to update item status")
    }

    // 7. Update Invoices Balances and Statuses
    const invoiceMap = new Map<string, any>()
    invoiceItems.forEach((item) => {
        if (!invoiceMap.has(item.invoice_id)) {
            invoiceMap.set(item.invoice_id, {
                invoice: item.invoices,
                paidAmount: 0,
            })
        }
        const entry = invoiceMap.get(item.invoice_id)!
        const paymentItem = items.find((i) => i.invoice_item_id === item.id)
        if (paymentItem) entry.paidAmount += paymentItem.amount
    })

    for (const [invoiceId, entry] of invoiceMap.entries()) {
        const invoice = entry.invoice
        const newBalance = Math.max(0, (invoice?.balance || 0) - entry.paidAmount)
        const newAmountPaid = (invoice?.amount_paid || 0) + entry.paidAmount

        let newStatus: "Paid" | "Partial" | "Unpaid" = "Unpaid"
        if (newBalance === 0) newStatus = "Paid"
        else if (newAmountPaid > 0) newStatus = "Partial"

        const { error: invoiceUpdateError } = await supabase
            .from("invoices")
            .update({
                balance: newBalance,
                amount_paid: newAmountPaid,
                status: newStatus,
            })
            .eq("id", invoiceId)

        if (invoiceUpdateError) throw new Error("Failed to update invoice")
    }

    return { success: true, payment_id: paymentId }
}
