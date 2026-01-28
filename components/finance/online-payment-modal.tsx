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
        MonnifySDK: any
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
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)

    // Load Monnify SDK Script
    useEffect(() => {
        if (typeof window !== "undefined" && !window.MonnifySDK) {
            const script = document.createElement("script")
            script.src = "https://sdk.monnify.com/v1/sdk.js"
            script.async = true
            script.onload = () => {
                console.log("Monnify SDK Loaded")
                setIsScriptLoaded(true)
            }
            script.onerror = () => {
                console.error("Monnify SDK Failed to load")
                // Keep isScriptLoaded false, but button remains enabled for fallback
            }
            document.body.appendChild(script)
        } else if (window.MonnifySDK) {
            setIsScriptLoaded(true)
        }
    }, [])

    const handleStartPayment = async () => {
        if (!guardianId) {
            toast.error("Guardian information missing")
            return
        }

        setIsInitializing(true)
        console.log("[OnlinePayment] Initializing for items:", items);
        try {
            // 1. Initialize on our backend
            const response = await fetch("/api/payments/online/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoice_id: (items[0] as any).invoice_id || "", // We should pass invoice_id from props if available
                    payment_method: "monnify",
                    items: items.map(item => ({
                        invoice_item_id: item.id,
                        amount: item.amount
                    }))
                }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Initialization failed")

            // 2. Open Monnify Inline Plugin
            if (window.MonnifySDK) {
                window.MonnifySDK.initialize({
                    amount: totalToPay,
                    currency: "NGN",
                    reference: data.reference,
                    customerName: "Parent/Guardian", // Should ideally fetch name
                    customerEmail: "parent@example.com", // Should ideally fetch email
                    apiKey: process.env.NEXT_PUBLIC_MONNIFY_API_KEY,
                    contractCode: process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE,
                    paymentDescription: "School Fees Payment",
                    metadata: {
                        payment_id: data.payment_id,
                        guardian_id: guardianId
                    },
                    onComplete: function (response: any) {
                        console.log("Monnify Response:", response);
                        if (response.status === "SUCCESS") {
                            toast.success("Payment successful!")
                            onSuccess()
                            onOpenChange(false)
                        } else {
                            toast.error("Payment was not successful")
                        }
                    },
                    onClose: function (data: any) {
                        console.log("Monnify Closed");
                    }
                });
            } else {
                // Fallback to checkout URL if SDK fails
                window.location.href = data.checkoutUrl
            }

        } catch (error: any) {
            console.error("[OnlinePayment] Error:", error)
            toast.error("Failed to start payment", {
                description: error.message
            })
        } finally {
            setIsInitializing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <DialogTitle>Online Payment</DialogTitle>
                    </div>
                    <DialogDescription>
                        Pay securely via Monnify using Card, Bank Transfer, or USSD.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border space-y-3">
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
                            Payments are processed securely by Monnify. Your financial data is nunca stored on our servers.
                        </p>
                    </div>

                    {totalToPay > 2500 && (
                        <div className="flex gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
                            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                            <p className="text-[10px]">
                                A small processing fee may be applied by the gateway.
                            </p>
                        </div>
                    )}
                </div>

                {!isScriptLoaded && !isInitializing && (
                    <div className="px-6 pb-2">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-900/40 text-center font-medium">
                            Note: Monnify SDK not detected. You will be redirected to a secure payment page.
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
