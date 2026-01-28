import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import { getPaymentGateway } from "@/lib/finance/gateways"
import { getPaymentMode } from "@/lib/finance/settings"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            invoice_id,
            payment_method, // 'monnify' or 'paystack'
            items, // array of { invoice_item_id, amount }
        } = body

        if (!invoice_id || !payment_method || !items || items.length === 0) {
            console.error("[PaymentInit] Validation failed:", { invoice_id, payment_method, itemsCount: items?.length })
            return Response.json({ error: "Missing required information" }, { status: 400 })
        }

        console.log("[PaymentInit] Received Request:", { invoice_id, payment_method, totalItems: items.length })

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 1. Fetch Invoice and Student
        const { data: invoice, error: dbError } = await supabase
            .from("invoices")
            .select(`
                *,
                students (
                    id, first_name, last_name,
                    student_guardians (
                        is_primary,
                        guardian:guardians (id, first_name, last_name, email)
                    )
                )
            `)
            .eq("id", invoice_id)
            .single()

        if (dbError || !invoice) {
            console.error("[PaymentInit] Invoice not found or DB Error:", dbError)
            return Response.json({ error: "Invoice not found" }, { status: 404 })
        }

        const student = (invoice.students as any)
        // Find primary guardian or any guardian
        const primaryLink = student.student_guardians?.find((g: any) => g.is_primary) || student.student_guardians?.[0]
        const guardian = primaryLink?.guardian

        const email = guardian?.email || "customer@example.com"
        const name = (guardian
            ? `${guardian.first_name} ${guardian.last_name}`.trim()
            : `${student.first_name} ${student.last_name}`.trim()) || "Customer"

        const totalAmount = items.reduce((sum: number, item: any) => sum + item.amount, 0)
        const reference = `ONLINE-${Date.now()}-${nanoid(4).toUpperCase()}`

        // 2. Create PENDING payment record
        // Note: payment_method must be 'online' to satisfy DB check constraint
        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .insert({
                reference_number: reference,
                receipt_number: `DRFT-${nanoid(10).toUpperCase()}`,
                invoice_id: invoice_id,
                amount: totalAmount,
                payment_method: "online",
                status: "pending",
                student_id: student.id,
                payment_date: new Date().toISOString().split('T')[0],
                metadata: {
                    items_requested: items,
                    invoice_id: invoice_id,
                    gateway: payment_method // monnify or paystack
                }
            })
            .select()
            .single()

        if (paymentError) {
            console.error("[PaymentInit] Error creating pending payment:", paymentError)
            return Response.json({ error: "Failed to initialize transaction locally" }, { status: 500 })
        }

        // 3. Optional: Initialize Gateway (if requested or if skipping UI)
        const skipGatewayInit = body.skipGatewayInit === true
        let checkoutUrl = ""
        let gatewayReference = ""
        let transactionToken = ""

        if (!skipGatewayInit) {
            const mode = await getPaymentMode()
            const gateway = getPaymentGateway(payment_method, mode)
            const initResult = await gateway.initialize({
                amount: totalAmount,
                customerFullName: name,
                email: email,
                name: name,
                currencyCode: "NGN",
                reference: reference,
                metadata: {
                    payment_id: payment.id,
                    invoice_id: invoice_id
                }
            })

            if (!initResult.success) {
                // Cleanup the pending payment
                await supabase.from("payments").delete().eq("id", payment.id)
                return Response.json({ error: initResult.error || "Gateway initialization failed" }, { status: 502 })
            }

            checkoutUrl = initResult.checkoutUrl || ""
            gatewayReference = initResult.gatewayReference || ""
            transactionToken = initResult.transactionToken || ""

            // 4. Update payment with gateway reference
            await supabase.from("payments").update({
                metadata: {
                    ...payment.metadata,
                    gateway_reference: gatewayReference,
                    transaction_token: transactionToken
                }
            }).eq("id", payment.id)
        }

        return Response.json({
            success: true,
            checkoutUrl: checkoutUrl,
            reference: reference,
            payment_id: payment.id,
            customerName: name,
            customerEmail: email,
            amount: totalAmount
        })

    } catch (error: any) {
        console.error("[PaymentInit] Fatal error:", error)
        return Response.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
