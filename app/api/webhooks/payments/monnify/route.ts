import { createClient } from "@/lib/supabase/server"
import { fulfillPayment } from "@/lib/finance/payment-fulfillment"
import crypto from "crypto"

export async function POST(request: Request) {
    try {
        const rawBody = await request.text()
        const body = JSON.parse(rawBody)
        const signature = request.headers.get("monnify-signature")

        // TODO: Verify signature
        // const secret = process.env.MONNIFY_SECRET_KEY
        // const hash = crypto.createHmac('sha512', secret!).update(rawBody).digest('hex')
        // if (hash !== signature) return Response.json({ error: 'invalid signature' }, { status: 401 })

        console.log("[MonnifyWebhook] Received notification:", body)

        const { eventType, responseBody } = body

        if (eventType === "SUCCESSFUL_TRANSACTION") {
            const reference = responseBody.paymentReference
            const supabase = await createClient()

            // Fetch pending payment
            const { data: payment } = await supabase
                .from("payments")
                .select("*")
                .eq("reference_number", reference)
                .single()

            if (payment && payment.status !== "completed") {
                await fulfillPayment({
                    student_id: payment.student_id,
                    amount: responseBody.amountPaid,
                    payment_method: "monnify",
                    reference_number: reference,
                    payment_date: responseBody.paidOn,
                    metadata: {
                        ...payment.metadata,
                        webhook_data: body
                    },
                    items: payment.metadata.items_requested,
                    remarks: "Online Payment via Monnify (Webhook)"
                })
            }
        }

        return Response.json({ status: "success" })
    } catch (error: any) {
        console.error("[MonnifyWebhook] Error:", error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
