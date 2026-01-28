"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    RotateCcw,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    ArrowRightLeft,
    TrendingDown,
    ShieldCheck,
    History
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

interface ReversalsTabProps {
    userRole?: "admin" | "accountant" | "super_admin"
}

export function ReversalsTab({ userRole = "admin" }: ReversalsTabProps) {
    const [view, setView] = useState<"history" | "request">("history")
    const [loading, setLoading] = useState(true)
    const [reversals, setReversals] = useState<any[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    // For Requesting
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null)
    const [reversalReason, setReversalReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // For Approving
    const [selectedReversal, setSelectedReversal] = useState<any | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Reversals
            const { data: revData } = await supabase
                .from("payment_reversals")
                .select(`
                    *,
                    reversed_by_user:reversed_by (first_name, last_name),
                    approved_by_user:approved_by (first_name, last_name),
                    payments (
                        receipt_number,
                        amount,
                        payment_date,
                        payment_method,
                        students (first_name, last_name, student_id)
                    )
                `)
                .order("created_at", { ascending: false })

            // Fetch Payments available for reversal (recent ones, not already reversed)
            const { data: payData } = await supabase
                .from("payments")
                .select(`
                    *,
                    students (first_name, last_name, student_id),
                    payment_reversals (status)
                `)
                .order("created_at", { ascending: false })
                .limit(50)

            setReversals(revData || [])
            // Filter out payments that already have a successful reversal
            setPayments(payData?.filter(p => !p.payment_reversals?.some((r: any) => r.status === "approved")) || [])
        } catch (error) {
            console.error(error)
            toast.error("Failed to load reversal data")
        } finally {
            setLoading(false)
        }
    }

    const handleRequestReversal = async () => {
        if (!selectedPayment || !reversalReason.trim()) return

        setIsSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from("payment_reversals")
                .insert({
                    payment_id: selectedPayment.id,
                    reason: reversalReason,
                    reversed_by: user?.id,
                    status: "pending"
                })

            if (error) throw error

            toast.success("Reversal request submitted for approval")
            setSelectedPayment(null)
            setReversalReason("")
            fetchData()
        } catch (error: any) {
            toast.error(error.message || "Failed to submit request")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleApproveReversal = async (reversalId: string) => {
        setIsSubmitting(true)
        try {
            const response = await fetch("/api/payments/reverse/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reversalId }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to approve")
            }

            toast.success("Payment reversal processed successfully")
            setSelectedReversal(null)
            fetchData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const pendingCount = reversals.filter(r => r.status === "pending").length
    const totalReversedAmount = reversals
        .filter(r => r.status === "approved")
        .reduce((sum, r) => sum + Number(r.payments?.amount || 0), 0)

    const filteredReversals = reversals.filter(r =>
        r.payments?.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.payments?.students?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredPayments = payments.filter(p =>
        p.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.students?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pt-4">
            {/* Slim KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="py-4 border shadow-none overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="px-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 shrink-0">
                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Awaiting Approval</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-bold">{pendingCount}</h3>
                                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Requests</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="py-4 border shadow-none overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="px-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Processed (MTD)</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-bold">₦{totalReversedAmount.toLocaleString()}</h3>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+2.4%</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="py-4 border shadow-none overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="px-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0">
                            <ArrowRightLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Reversals</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-bold">{reversals.length}</h3>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">All time</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-full md:w-auto">
                    <Button
                        variant={view === "request" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setView("request")}
                        className={view === "request" ? "bg-white dark:bg-slate-800 shadow-sm dark:text-white" : "dark:text-slate-400"}
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-2" />
                        New Request
                    </Button>
                    <Button
                        variant={view === "history" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setView("history")}
                        className={view === "history" ? "bg-white dark:bg-slate-800 shadow-sm dark:text-white" : "dark:text-slate-400"}
                    >
                        <History className="h-3.5 w-3.5 mr-2" />
                        History & Approvals
                    </Button>
                </div>

                <div className="relative w-full md:w-[350px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={view === "history" ? "Find reversal..." : "Search payments..."}
                        className="pl-9 h-9 bg-white dark:bg-slate-950 border shadow-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border shadow-none overflow-hidden dark:bg-slate-950">
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                        {view === "history" ? (
                            <TableRow>
                                <TableHead className="w-[100px]">Receipt</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Requestor</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableHead className="w-[100px]">Receipt</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">Loading transactions...</TableCell>
                            </TableRow>
                        ) : view === "history" ? (
                            filteredReversals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">No reversal history found</TableCell>
                                </TableRow>
                            ) : (
                                filteredReversals.map((rev) => (
                                    <TableRow key={rev.id} className="group transition-colors">
                                        <TableCell className="font-mono text-xs font-semibold">{rev.payments?.receipt_number}</TableCell>
                                        <TableCell>
                                            <p className="text-sm font-medium">{rev.payments?.students?.first_name} {rev.payments?.students?.last_name}</p>
                                            <p className="text-[10px] text-muted-foreground">{rev.payments?.students?.student_id}</p>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {rev.reversed_by_user?.first_name} {rev.reversed_by_user?.last_name}
                                        </TableCell>
                                        <TableCell className="font-bold text-red-600">₦{Number(rev.payments?.amount).toLocaleString()}</TableCell>
                                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={rev.reason}>
                                            {rev.reason}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`
                                                    font-bold text-[10px] uppercase
                                                    ${rev.status === 'pending' ? 'border-orange-200 dark:border-orange-950 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20' :
                                                        rev.status === 'approved' ? 'border-emerald-200 dark:border-emerald-950 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' :
                                                            'border-red-200 dark:border-red-950 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20'}
                                                `}
                                            >
                                                {rev.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {rev.status === "pending" && (userRole === "admin" || userRole === "super_admin") ? (
                                                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" onClick={() => setSelectedReversal(rev)}>Review</Button>
                                            ) : (
                                                <Button size="sm" variant="ghost" className="h-8 text-[10px] opacity-0 group-hover:opacity-100">Details</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )
                        ) : (
                            filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">No recent payments found</TableCell>
                                </TableRow>
                            ) : (
                                filteredPayments.map((pay) => (
                                    <TableRow key={pay.id} className="group transition-colors">
                                        <TableCell className="font-mono text-xs font-semibold">{pay.receipt_number}</TableCell>
                                        <TableCell>
                                            <p className="text-sm font-medium">{pay.students?.first_name} {pay.students?.last_name}</p>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{new Date(pay.payment_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] font-bold uppercase">{pay.payment_method}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600">₦{Number(pay.amount).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-100 dark:border-red-900/50"
                                                onClick={() => setSelectedPayment(pay)}
                                            >
                                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                                Reverse
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Request Dialog */}
            <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-red-600" />
                            Initiate Reversal Request
                        </DialogTitle>
                        <DialogDescription>
                            This will create a request for admin approval. The payment will remain valid until approved.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayment && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Receipt</p>
                                    <p className="text-sm font-mono dark:text-slate-300">{selectedPayment.receipt_number}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Amount</p>
                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">₦{Number(selectedPayment.amount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Student</p>
                                    <p className="text-sm font-medium dark:text-slate-300">{selectedPayment.students?.first_name} {selectedPayment.students?.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
                                    <p className="text-sm dark:text-slate-400">{new Date(selectedPayment.payment_date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-xs font-bold uppercase text-slate-500">Reason for Reversal *</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Briefly explain why this payment needs to be reversed (e.g., Wrong amount entered, Cheque bounced, etc.)"
                                    value={reversalReason}
                                    onChange={(e) => setReversalReason(e.target.value)}
                                    className="min-h-[100px] text-sm"
                                />
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 p-3 rounded-lg flex gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                                <div className="text-[11px] text-yellow-800 dark:text-yellow-200 leading-relaxed font-medium">
                                    <p className="font-bold mb-1">Impact Warning:</p>
                                    Approving this will increase the student's bill balance by ₦{Number(selectedPayment.amount).toLocaleString()}. This action is logged for audit purposes.
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedPayment(null)}>Cancel</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleRequestReversal}
                            disabled={isSubmitting || !reversalReason.trim()}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve/Review Dialog */}
            <Dialog open={!!selectedReversal} onOpenChange={() => setSelectedReversal(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                            Approve Payment Reversal
                        </DialogTitle>
                        <DialogDescription>
                            Review the request details below before making a decision.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReversal && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-800">
                                    <span className="text-muted-foreground">Requestor:</span>
                                    <span className="font-semibold dark:text-slate-300">{selectedReversal.reversed_by_user?.first_name} {selectedReversal.reversed_by_user?.last_name}</span>
                                </div>

                                <Card className="border shadow-none bg-red-50/20 dark:bg-red-950/10 border-red-100 dark:border-red-900/30">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground uppercase font-bold">Receipt No:</span>
                                            <span className="font-mono dark:text-slate-300">{selectedReversal.payments?.receipt_number}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground uppercase font-bold">Amount to Deduct:</span>
                                            <span className="font-bold text-red-600 dark:text-red-400">₦{Number(selectedReversal.payments?.amount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground uppercase font-bold">Payment Method:</span>
                                            <span className="font-semibold uppercase dark:text-slate-300">{selectedReversal.payments?.payment_method}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold italic ml-1 underline">Reason for request:</p>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded text-sm italic dark:text-slate-400">
                                        "{selectedReversal.reason}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50" onClick={() => setSelectedReversal(null)}>
                            Reject
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleApproveReversal(selectedReversal.id)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Processing..." : "Approve & Reverse"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
