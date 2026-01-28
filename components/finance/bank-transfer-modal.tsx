'use client'

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Landmark, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface PaymentItem {
    id: string
    studentName: string
    description: string
    amount: number
}

interface BankTransferModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    items: PaymentItem[]
    totalToPay: number
    guardianId: string
    onConfirm: () => void
}

export function BankTransferModal({
    open,
    onOpenChange,
    items,
    totalToPay,
    guardianId,
    onConfirm,
}: BankTransferModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [bankName, setBankName] = useState("")
    const [reference, setReference] = useState("")

    const handleConfirm = async () => {
        if (!guardianId) {
            toast.error("Guardian information missing")
            return
        }

        if (!bankName) {
            toast.error("Please enter the source bank name")
            return
        }

        setIsSubmitting(true)
        try {
            // Reusing the cash payment API but with 'transfer' method
            const response = await fetch("/api/payments/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guardian_id: guardianId,
                    payment_method: "transfer",
                    items: items.map((item) => ({
                        invoice_item_id: item.id,
                        amount: item.amount,
                    })),
                    metadata: {
                        bank_name: bankName,
                        bank_reference: reference
                    },
                    remarks: `Bank Transfer from ${bankName}. Ref: ${reference}`
                }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to record transfer")

            toast.success("Transfer recorded successfully!", {
                description: `₦${totalToPay.toLocaleString()} confirmed`,
                icon: <CheckCircle className="h-5 w-5 text-green-600" />,
            })

            onOpenChange(false)
            onConfirm()
        } catch (error: any) {
            toast.error("Recording Failed", {
                description: error.message,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Landmark className="h-5 w-5 text-purple-600" />
                        <DialogTitle>Bank Transfer Detail</DialogTitle>
                    </div>
                    <DialogDescription>
                        Record a manual bank transfer received from a parent.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank_name">Source Bank Name</Label>
                            <Input
                                id="bank_name"
                                placeholder="e.g. GTBank, Kuda, Zenith"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ref">Transfer Reference / Session ID (Optional)</Label>
                            <Input
                                id="ref"
                                placeholder="e.g. 123456789..."
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground uppercase text-[10px] font-bold">Total Confirmed</span>
                            <span className="font-mono font-black text-lg">₦{totalToPay.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p className="text-[11px] leading-tight">
                            Ensure you have verified the funds in the school's bank account before confirming this record.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirm & Record
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
