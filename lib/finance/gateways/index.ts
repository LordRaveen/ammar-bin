import { MonnifyProvider } from "./monnify";
import { PaystackProvider } from "./paystack";
import { GatewayType, PaymentGateway } from "./types";

export function getPaymentGateway(type: GatewayType, mode: "test" | "live" = "test"): PaymentGateway {
    switch (type) {
        case "monnify":
            return new MonnifyProvider(mode);
        case "paystack":
            return new PaystackProvider(mode);
        default:
            throw new Error(`Unsupported payment gateway: ${type}`);
    }
}

export * from "./types";
