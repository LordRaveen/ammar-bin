export type GatewayType = 'monnify' | 'paystack';

export interface PaymentInitData {
    amount: number;
    email: string;
    name: string;
    customerFullName?: string;
    currencyCode?: string;
    reference: string;
    metadata?: any;
}

export interface PaymentInitResponse {
    success: boolean;
    checkoutUrl?: string; // For Paystack/others that use external checkout
    gatewayReference: string;
    transactionToken?: string; // For Monnify/others
    error?: string;
}

export interface PaymentVerifyResponse {
    success: boolean;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    reference: string;
    gatewayReference: string;
    paidAt?: string;
    error?: string;
}

export interface PaymentGateway {
    name: GatewayType;
    initialize(data: PaymentInitData): Promise<PaymentInitResponse>;
    verify(reference: string): Promise<PaymentVerifyResponse>;
    // Webhook methods can be added as needed
}
