import { PaymentGateway, PaymentInitData, PaymentInitResponse, PaymentVerifyResponse } from "./types";

export class PaystackProvider implements PaymentGateway {
    name: "paystack" = "paystack";
    private mode: "test" | "live";
    private secretKey: string;
    private baseUrl = "https://api.paystack.co";

    constructor(mode: "test" | "live" = "test") {
        this.mode = mode;
        this.secretKey = mode === "live"
            ? (process.env.PAYSTACK_SECRET_KEY || "")
            : (process.env.PAYSTACK_TEST_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY || "");
    }

    async initialize(data: PaymentInitData): Promise<PaymentInitResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: data.amount * 100, // Paystack uses kobo
                    email: data.email,
                    reference: data.reference,
                    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/finance/payments/callback?ref=${data.reference}&gateway=paystack`,
                    metadata: data.metadata,
                }),
            });

            const result = await response.json();
            if (!result.status) {
                return { success: false, gatewayReference: "", error: result.message };
            }

            return {
                success: true,
                gatewayReference: result.data.reference,
                checkoutUrl: result.data.authorization_url,
            };
        } catch (error: any) {
            return { success: false, gatewayReference: "", error: error.message };
        }
    }

    async verify(reference: string): Promise<PaymentVerifyResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });

            const result = await response.json();
            if (!result.status) {
                return {
                    success: false,
                    status: "pending",
                    amount: 0,
                    reference,
                    gatewayReference: "",
                    error: result.message
                };
            }

            const body = result.data;
            const statusMap: Record<string, 'success' | 'failed' | 'pending'> = {
                'success': 'success',
                'failed': 'failed',
                'abandoned': 'failed',
                'ongoing': 'pending',
                'pending': 'pending'
            };

            return {
                success: body.status === 'success',
                status: statusMap[body.status] || 'pending',
                amount: body.amount / 100,
                reference: body.reference,
                gatewayReference: body.id.toString(),
                paidAt: body.paid_at,
            };
        } catch (error: any) {
            return {
                success: false,
                status: "pending",
                amount: 0,
                reference,
                gatewayReference: "",
                error: error.message
            };
        }
    }
}
