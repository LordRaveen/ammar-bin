import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/finance/gateways"
import { fulfillPayment } from "@/lib/finance/payment-fulfillment"
import { getPaymentMode } from "@/lib/finance/settings"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")
    const gatewayType = searchParams.get("gateway") as any

    if (!reference || !gatewayType) {
        return Response.json({ error: "Missing reference or gateway" }, { status: 400 })
    }

    try {
        const supabase = await createClient()

        // 1. Fetch the pending payment
        const { data: payment } = await supabase
            .from("payments")
            .select("*")
            .eq("reference_number", reference)
            .single()

        if (!payment) return Response.json({ error: "Transaction not found" }, { status: 404 })
        if (payment.status === "completed") return Response.json({ success: true, already_completed: true })

        // 2. Verify with Gateway
        const mode = await getPaymentMode()
        const gateway = getPaymentGateway(gatewayType, mode)
        const verification = await gateway.verify(reference)

        if (verification.status === "success") {
            // 3. Fulfill the payment in our system
            const result = await fulfillPayment({
                student_id: payment.student_id,
                amount: verification.amount,
                payment_method: gatewayType,
                reference_number: reference,
                payment_date: verification.paidAt || new Date().toISOString(),
                metadata: {
                    ...payment.metadata,
                    gateway_verification: verification
                },
                items: payment.metadata.items_requested,
                remarks: `Online Payment via ${gatewayType}`
            })

            return Response.json({ success: true, result })
        } else {
            return Response.json({ success: false, status: verification.status, error: verification.error })
        }

    } catch (error: any) {
        console.error("[PaymentVerify] Fatal error:", error)
        return Response.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
