'use client'

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, ShieldCheck, Globe, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface PaymentItem {
    id: string
    studentName: string
    description: string
    amount: number
    invoice_id?: string
}

interface OnlinePaymentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    items: PaymentItem[]
    totalToPay: number
    guardianId: string
    onSuccess: () => void
}

declare global {
    interface Window {
        MonnifySDK: any;
        PaystackPop: any;
    }
}

export function OnlinePaymentModal({
    open,
    onOpenChange,
    items,
    totalToPay,
    guardianId,
    onSuccess,
}: OnlinePaymentModalProps) {
    const [isInitializing, setIsInitializing] = useState(false)
    const [isMonnifyLoaded, setIsMonnifyLoaded] = useState(false)
    const [isPaystackLoaded, setIsPaystackLoaded] = useState(false)
    const [selectedGateway, setSelectedGateway] = useState<"paystack" | "monnify">("paystack")

    // Load Checkout Scripts
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Monnify SDK
        if (!window.MonnifySDK) {
            const script = document.createElement("script")
            script.src = "https://sdk.monnify.com/plugin/monnify.js"
            script.async = true
            script.onload = () => setIsMonnifyLoaded(true)
            document.body.appendChild(script)
        } else {
            setIsMonnifyLoaded(true)
        }

        // Paystack SDK
        if (!window.PaystackPop) {
            const script = document.createElement("script")
            script.src = "https://js.paystack.co/v1/inline.js"
            script.async = true
            script.onload = () => setIsPaystackLoaded(true)
            document.body.appendChild(script)
        } else {
            setIsPaystackLoaded(true)
        }
    }, [])

    const verifyPayment = async (reference: string, gateway: string) => {
        try {
            const response = await fetch("/api/payments/online/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reference, payment_method: gateway }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Verification failed")
            return result
        } catch (error: any) {
            console.error("Verification Error:", error)
            throw error
        }
    }

    const handleStartPayment = async () => {
        if (!guardianId) {
            toast.error("Guardian information missing")
            return
        }

        setIsInitializing(true)
        console.log("[OnlinePayment] Initializing for items:", items, "Gateway:", selectedGateway);
        try {
            // 1. Step 1: Initialize Locally (Fast, always done) 
            const response = await fetch("/api/payments/online/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoice_id: items[0]?.invoice_id || "",
                    payment_method: selectedGateway,
                    skipGatewayInit: true, // Don't wait for server-to-server init yet
                    items: items.map(item => ({
                        invoice_item_id: item.id,
                        amount: item.amount
                    }))
                }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Local initialization failed")

            // 2. Step 2: Gateway Logic
            if (selectedGateway === "monnify" && window.MonnifySDK) {
                window.MonnifySDK.initialize({
                    amount: data.amount,
                    currencyCode: "NGN",
                    reference: data.reference,
                    customerFullName: data.customerName || "Customer",
                    customerEmail: data.customerEmail || "customer@example.com",
                    apiKey: process.env.NEXT_PUBLIC_MONNIFY_API_KEY,
                    contractCode: process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE,
                    paymentDescription: "School Fees Payment",
                    metadata: {
                        payment_id: data.payment_id,
                        guardian_id: guardianId,
                        invoice_id: items[0]?.invoice_id
                    },
                    onComplete: function (monnifyResponse: any) {
                        if (monnifyResponse.paymentStatus === "PAID" || monnifyResponse.status === "SUCCESS") {
                            toast.loading("Verifying payment...", { id: "verify-payment" })
                            verifyPayment(data.reference, "monnify")
                                .then(() => {
                                    toast.success("Payment verified and recorded!", { id: "verify-payment" })
                                    onSuccess()
                                    onOpenChange(false)
                                })
                                .catch((err: any) => {
                                    toast.error("Payment successful but recording failed. Please contact admin.", {
                                        id: "verify-payment",
                                        description: err.message
                                    })
                                })
                                .finally(() => {
                                    setIsInitializing(false)
                                })
                        } else {
                            toast.error(`Payment Status: ${monnifyResponse.paymentStatus || 'Failed'}`)
                            setIsInitializing(false)
                        }
                    },
                    onClose: function () {
                        setIsInitializing(false)
                    }
                });
            } else if (selectedGateway === "paystack" && window.PaystackPop) {
                const handler = window.PaystackPop.setup({
                    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
                    email: data.customerEmail || "customer@example.com",
                    amount: Math.round(data.amount * 100), // Paystack uses kobo
                    ref: data.reference,
                    metadata: {
                        payment_id: data.payment_id,
                        guardian_id: guardianId,
                        invoice_id: items[0]?.invoice_id
                    },
                    callback: function (paystackResponse: any) {
                        toast.loading("Verifying payment...", { id: "verify-payment" })
                        verifyPayment(data.reference, "paystack")
                            .then(() => {
                                toast.success("Payment verified and recorded!", { id: "verify-payment" })
                                onSuccess()
                                onOpenChange(false)
                            })
                            .catch((err: any) => {
                                toast.error("Payment successful but recording failed. Our team will verify it.", {
                                    id: "verify-payment",
                                    description: err.message
                                })
                            })
                            .finally(() => {
                                setIsInitializing(false)
                            })
                    },
                    onClose: function () {
                        setIsInitializing(false)
                    }
                });
                handler.openIframe();
            } else {
                // Fallback to external redirect if SDK is missing
                toast.info("SDK missing, redirecting to secure checkout...")
                const fallbackResponse = await fetch("/api/payments/online/initialize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        invoice_id: items[0]?.invoice_id || "",
                        payment_method: selectedGateway,
                        skipGatewayInit: false,
                        items: items.map(item => ({
                            invoice_item_id: item.id,
                            amount: item.amount
                        }))
                    }),
                })
                const fallbackData = await fallbackResponse.json()
                if (fallbackData.checkoutUrl) {
                    window.location.href = fallbackData.checkoutUrl
                } else {
                    throw new Error("Checkout URL not found")
                }
            }

        } catch (error: any) {
            console.error("[OnlinePayment] Error:", error)
            toast.error("Failed to start payment", {
                description: error.message
            })
            setIsInitializing(false)
        }
    }

    const isCurrentScriptLoaded = selectedGateway === "monnify" ? isMonnifyLoaded : isPaystackLoaded;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <DialogTitle>Online Payment</DialogTitle>
                    </div>
                    <DialogDescription>
                        Pay securely using your preferred payment gateway.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Gateway Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Payment Gateway</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedGateway("paystack")}
                                className={`p-3 rounded-lg border-2 transition-all ${selectedGateway === "paystack"
                                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                    }`}
                                disabled={isInitializing}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className="text-lg font-bold">Paystack</div>
                                    <div className="text-[10px] text-muted-foreground">Modern Checkout</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedGateway("monnify")}
                                className={`p-3 rounded-lg border-2 transition-all ${selectedGateway === "monnify"
                                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                    }`}
                                disabled={isInitializing}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className="text-lg font-bold">Monnify</div>
                                    <div className="text-[10px] text-muted-foreground">Flexible Checkout</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total to pay</span>
                            <span className="font-mono font-black text-lg">₦{totalToPay.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Selected Items</p>
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-xs">
                                    <span>{item.description}</span>
                                    <span className="font-semibold">₦{item.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-300">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <p className="text-[11px] leading-tight">
                            Payments are processed securely by {selectedGateway === "paystack" ? "Paystack" : "Monnify"}. Your financial data is nunca stored on our servers.
                        </p>
                    </div>
                </div>

                {!isCurrentScriptLoaded && !isInitializing && (
                    <div className="px-6 pb-2">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-900/40 text-center font-medium">
                            Note: {selectedGateway === "paystack" ? "Paystack" : "Monnify"} SDK not detected. You will be redirected to a secure payment page.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isInitializing}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        onClick={handleStartPayment}
                        disabled={isInitializing}
                    >
                        {isInitializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                        Pay Online Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
