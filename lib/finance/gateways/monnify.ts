import { PaymentGateway, PaymentInitData, PaymentInitResponse, PaymentVerifyResponse } from "./types";

export class MonnifyProvider implements PaymentGateway {
    name: "monnify" = "monnify";
    private mode: "test" | "live";
    private apiKey: string;
    private secretKey: string;
    private contractCode: string;
    private baseUrl: string;

    constructor(mode: "test" | "live" = "test") {
        this.mode = mode;
        this.baseUrl = mode === "live"
            ? "https://api.monnify.com"
            : "https://sandbox.monnify.com";

        this.apiKey = mode === "live"
            ? (process.env.MONNIFY_API_KEY || "")
            : (process.env.MONNIFY_TEST_API_KEY || process.env.MONNIFY_API_KEY || "");

        this.secretKey = mode === "live"
            ? (process.env.MONNIFY_SECRET_KEY || "")
            : (process.env.MONNIFY_TEST_SECRET_KEY || process.env.MONNIFY_SECRET_KEY || "");

        this.contractCode = mode === "live"
            ? (process.env.MONNIFY_CONTRACT_CODE || "")
            : (process.env.MONNIFY_TEST_CONTRACT_CODE || process.env.MONNIFY_CONTRACT_CODE || "");
    }

    private async getAccessToken() {
        const authHeader = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString("base64");
        const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${authHeader}`,
            },
        });

        const data = await response.json();
        if (!data.requestSuccessful) {
            throw new Error(`Monnify Auth Failed: ${data.responseMessage}`);
        }
        return data.responseBody.accessToken;
    }

    async initialize(data: PaymentInitData): Promise<PaymentInitResponse> {
        try {
            const token = await this.getAccessToken();
            const response = await fetch(`${this.baseUrl}/api/v1/merchant/transactions/init-transaction`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: data.amount,
                    customerName: data.name,
                    customerEmail: data.email,
                    paymentReference: data.reference,
                    paymentDescription: `School Fees Payment - ${data.reference}`,
                    currencyCode: data.currencyCode || "NGN",
                    contractCode: this.contractCode,
                    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/finance/payments/callback?ref=${data.reference}&gateway=monnify`,
                    metadata: data.metadata,
                }),
            });

            const result = await response.json();
            if (!result.requestSuccessful) {
                return { success: false, gatewayReference: "", error: result.responseMessage };
            }

            return {
                success: true,
                gatewayReference: result.responseBody.transactionReference,
                checkoutUrl: result.responseBody.checkoutUrl,
                transactionToken: result.responseBody.paymentToken,
            };
        } catch (error: any) {
            return { success: false, gatewayReference: "", error: error.message };
        }
    }

    async verify(reference: string): Promise<PaymentVerifyResponse> {
        try {
            const token = await this.getAccessToken();
            // Monnify allows querying by their reference or our merchant reference
            const response = await fetch(`${this.baseUrl}/api/v1/merchant/transactions/query?paymentReference=${reference}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (!result.requestSuccessful) {
                return {
                    success: false,
                    status: "pending",
                    amount: 0,
                    reference,
                    gatewayReference: "",
                    error: result.responseMessage
                };
            }

            const body = result.responseBody;
            const statusMap: Record<string, 'success' | 'failed' | 'pending'> = {
                'PAID': 'success',
                'OVERPAID': 'success',
                'PARTIALLY_PAID': 'pending',
                'PENDING': 'pending',
                'EXPIRED': 'failed',
                'CANCELLED': 'failed',
                'FAILED': 'failed'
            };

            return {
                success: body.paymentStatus === 'PAID',
                status: statusMap[body.paymentStatus] || 'pending',
                amount: body.amountPaid || body.payableAmount,
                reference: body.paymentReference,
                gatewayReference: body.transactionReference,
                paidAt: body.completedOn,
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
