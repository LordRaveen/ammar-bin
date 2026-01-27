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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, CreditCard, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface PaymentItem {
    id: string
    studentName: string
    description: string
    amount: number
    originalAmount?: number
    discount?: number
    waiver?: number
}

interface PosPaymentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    items: PaymentItem[]
    subtotal: number
    totalDiscount: number
    totalWaiver: number
    totalToPay: number
    guardianId: string
    onConfirm: () => void
}

const BANKS = [
    "Access Bank",
    "First Bank",
    "GTBank",
    "UBA",
    "Zenith Bank",
    "Fidelity Bank",
    "Stanbic IBTC",
    "Opay",
    "PalmPay",
    "Moniepoint",
    "Other"
]

export function PosPaymentModal({
    open,
    onOpenChange,
    items,
    totalToPay,
    subtotal,
    totalDiscount,
    totalWaiver,
    guardianId,
    onConfirm,
}: PosPaymentModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [posReference, setPosReference] = useState("")
    const [bank, setBank] = useState("")
    const [cardLast4, setCardLast4] = useState("")
    const [terminalId, setTerminalId] = useState("")
    const [paymentDate, setPaymentDate] = useState<Date>(new Date())

    const handleConfirm = async () => {
        // Validation
        if (!posReference) {
            toast.error("POS Reference is required")
            return
        }

        if (!guardianId) {
            toast.error("Guardian information missing")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch("/api/payments/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guardian_id: guardianId,
                    payment_method: "pos",
                    items: items.map((item) => ({
                        invoice_item_id: item.id,
                        amount: item.amount,
                    })),
                    total_discount: totalDiscount,
                    total_waiver: totalWaiver,
                    // POS specific fields
                    reference: posReference,
                    bank_name: bank,
                    card_last_4: cardLast4,
                    terminal_id: terminalId,
                    payment_date: paymentDate.toISOString(),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to process payment")
            }

            toast.success("POS Payment Recorded", {
                description: `Reference: ${posReference}`,
            })

            onOpenChange(false)
            onConfirm()
        } catch (error: any) {
            console.error("POS Payment error:", error)
            toast.error("Payment Failed", {
                description: error.message || "An error occurred",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record POS Payment</DialogTitle>
                    <DialogDescription>
                        Enter the details from the POS transaction receipt.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="bg-muted/40 p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Total Amount</span>
                            <span className="text-lg font-bold">₦{totalToPay.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            Locked - Auto-filled from selection
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="pos-ref">POS Reference / RRN <span className="text-red-500">*</span></Label>
                        <Input
                            id="pos-ref"
                            value={posReference}
                            onChange={(e) => setPosReference(e.target.value)}
                            placeholder="e.g. 000123456789"
                            className="font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Bank</Label>
                            <Select value={bank} onValueChange={setBank}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BANKS.map((b) => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Card Last 4 Digits</Label>
                            <Input
                                value={cardLast4}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                                    setCardLast4(val)
                                }}
                                placeholder="e.g. 1234"
                                maxLength={4}
                                className="font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Terminal ID (Optional)</Label>
                            <Input
                                value={terminalId}
                                onChange={(e) => setTerminalId(e.target.value)}
                                placeholder="Terminal ID"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Payment Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !paymentDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={paymentDate}
                                        onSelect={(date) => date && setPaymentDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Separator />

                    <div className="text-sm text-muted-foreground p-2 bg-yellow-50/50 border border-yellow-100 rounded text-amber-900">
                        Ensure the transaction was successful on the POS machine before confirming here.
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting || !posReference} className="bg-green-600 hover:bg-green-700">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm POS Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
