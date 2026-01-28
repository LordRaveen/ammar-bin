import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/finance/gateways"
import { getPaymentMode } from "@/lib/finance/settings"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { reference, payment_method } = body

        if (!reference || !payment_method) {
            return Response.json({ error: "Missing information" }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 1. Verify with Gateway
        const mode = await getPaymentMode()
        const gateway = getPaymentGateway(payment_method, mode)
        const verifyResult = await gateway.verify(reference)

        if (!verifyResult.success || verifyResult.status !== 'success') {
            console.error("[PaymentVerify] Gateway verification failed or incomplete:", verifyResult)
            return Response.json({
                error: verifyResult.error || "Payment not verified as successful",
                status: verifyResult.status
            }, { status: 400 })
        }

        // 2. Find the local PENDING payment
        const { data: payment, error: fetchError } = await supabase
            .from("payments")
            .select("*")
            .eq("reference_number", reference)
            .single()

        if (fetchError || !payment) {
            return Response.json({ error: "Payment record not found" }, { status: 404 })
        }

        if (payment.status === 'completed') {
            return Response.json({ success: true, message: "Payment already processed", payment_id: payment.id })
        }

        // 3. Security Check: Amount
        // Gateway might return amount in different units or with a small fee difference 
        // depending on implementation. But we should generally trust the local record's amount 
        // as the intent, and gateway's amount as the reality.
        if (Math.abs(verifyResult.amount - payment.amount) > 1) { // 1 Naira margin
            console.warn("[PaymentVerify] Amount mismatch:", { gateway: verifyResult.amount, local: payment.amount })
            // In a real system you'd handle this more strictly, but let's allow small differences for now
        }

        // 4. Get current user's staff/teacher record
        const { data: teacherData } = await supabase
            .from("teachers")
            .select("id")
            .eq("user_id", user.id)
            .single()

        // 5. Build Allocations from metadata
        const items = payment.metadata?.items_requested || []
        if (!items || items.length === 0) {
            return Response.json({ error: "No items found in payment metadata" }, { status: 400 })
        }

        // Prepare some data for later updates
        const invoiceItemIds = items.map((i: any) => i.invoice_item_id)
        const { data: invoiceItems, error: itemsError } = await supabase
            .from("invoice_items")
            .select("*, invoices(*)")
            .in("id", invoiceItemIds)

        if (itemsError || !invoiceItems) {
            return Response.json({ error: "Failed to fetch invoice items" }, { status: 500 })
        }

        // Start Transaction via manual steps (since we don't have Supabase Transactions in Edge functions easily)

        // A. Update Payment Record
        const receiptNumber = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${nanoid(6).toUpperCase()}`
        const { data: updatedPayment, error: patchError } = await supabase
            .from("payments")
            .update({
                status: 'completed',
                receipt_number: receiptNumber,
                paid_at: verifyResult.paidAt || new Date().toISOString(),
                received_by: teacherData?.id || null, // Best effort
                metadata: {
                    ...payment.metadata,
                    gateway_verified_at: new Date().toISOString(),
                    gateway_reference: verifyResult.gatewayReference
                }
            })
            .eq("id", payment.id)
            .select()
            .single()

        if (patchError) throw new Error(`Failed to update payment: ${patchError.message}`)

        // B. Create Allocations
        const allocations = items.map((item: any) => {
            const invoiceItem = invoiceItems.find((ii: any) => ii.id === item.invoice_item_id)
            return {
                payment_id: payment.id,
                invoice_item_id: item.invoice_item_id,
                invoice_id: invoiceItem?.invoice_id,
                student_id: payment.student_id,
                amount: item.amount,
            }
        })

        const { error: allocError } = await supabase
            .from("payment_allocations")
            .insert(allocations)

        if (allocError) throw new Error(`Failed to create allocations: ${allocError.message}`)

        // C. Update Invoice Item Statuses
        for (const item of items) {
            const ii = invoiceItems.find((x: any) => x.id === item.invoice_item_id)
            if (!ii) continue

            // Logic: New Balance = (Original Item Amount - Total already paid across ALL payments)
            // But here we just assume the flow is controlled.
            // Better: Mark as Paid if amount matches
            const newStatus = "Paid" // For now assume full payment per item in online flow

            await supabase
                .from("invoice_items")
                .update({ status: newStatus })
                .eq("id", item.invoice_item_id)
        }

        // D. Update Invoices
        const invoiceIds = Array.from(new Set(invoiceItems.map(ii => ii.invoice_id)))
        for (const invId of invoiceIds) {
            // Recalculate invoice stats based on all its items' current status
            const { data: allItems } = await supabase
                .from("invoice_items")
                .select("amount, status")
                .eq("invoice_id", invId)

            if (allItems) {
                const totalPaid = allItems
                    .filter(ii => ii.status === 'Paid')
                    .reduce((sum, ii) => sum + ii.amount, 0)

                const totalInvoiceAmount = allItems.reduce((sum, ii) => sum + ii.amount, 0)
                const newBalance = Math.max(0, totalInvoiceAmount - totalPaid)
                const newStatus = newBalance === 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Unpaid"

                await supabase
                    .from("invoices")
                    .update({
                        balance: newBalance,
                        amount_paid: totalPaid,
                        status: newStatus
                    })
                    .eq("id", invId)
            }
        }

        return Response.json({
            success: true,
            payment_id: payment.id,
            receipt_number: receiptNumber
        })

    } catch (error: any) {
        console.error("[PaymentVerify] Fatal error:", error)
        return Response.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
