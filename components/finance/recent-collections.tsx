"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Clock, Printer } from "lucide-react"

interface RecentCollectionsProps {
    onViewPayment?: (paymentId: string) => void
}

export function RecentCollections({ onViewPayment }: RecentCollectionsProps) {
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [totalToday, setTotalToday] = useState(0)
    const supabase = createBrowserClient()

    useEffect(() => {
        fetchRecentPayments()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('recent-payments-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'payments'
                },
                () => {
                    fetchRecentPayments()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchRecentPayments = async () => {
        try {
            const today = new Date().toISOString().split("T")[0]

            const { data, error } = await supabase
                .from("payments")
                .select(`
          id,
          amount,
          payment_method,
          status,
          created_at,
          invoices (
            student:students (
              first_name,
              last_name
            )
          )
        `)
                .eq("status", "completed")
                .gte("created_at", `${today}T00:00:00`)
                .order("created_at", { ascending: false })
                .limit(10)

            if (error) {
                console.error("Error fetching payments:", error)
                return
            }

            setPayments(data || [])

            // Calculate total
            const total = data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
            setTotalToday(total)

        } catch (error) {
            console.error("Error processing recent payments:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card className="h-full border-none shadow-none bg-muted/30">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Today&apos;s Collections</CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Total: ₦{totalToday.toLocaleString()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {payments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No payments collected today</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map((payment, index) => (
                            <div key={payment.id} className="relative pl-6 pb-1 group">
                                {/* Timeline dot */}
                                <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border border-primary bg-background z-10" />
                                {index !== payments.length - 1 && (
                                    <div className="absolute left-[4px] top-4 bottom-[-12px] w-px bg-border" />
                                )}

                                <div className="flex items-start justify-between bg-background/50 p-2 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border/50 cursor-pointer" onClick={() => onViewPayment?.(payment.id)}>
                                    <div>
                                        <p className="font-medium text-sm">
                                            {payment.invoices?.student?.first_name} {payment.invoices?.student?.last_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="capitalize">{payment.payment_method}</span>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-semibold text-sm text-green-600">
                                            ₦{Number(payment.amount).toLocaleString()}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onViewPayment?.(payment.id)
                                            }}
                                            title="Print Receipt"
                                        >
                                            <Printer className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
