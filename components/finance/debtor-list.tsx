"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowRight, Loader2 } from "lucide-react"

interface DebtorListProps {
    onSelectStudent: (student: any) => void
}

export function DebtorList({ onSelectStudent }: DebtorListProps) {
    const [debtors, setDebtors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        fetchDebtors()
    }, [])

    const fetchDebtors = async () => {
        try {
            // Fetch invoices with balance > 0 and their students
            const { data, error } = await supabase
                .from("invoices")
                .select(`
          id,
          balance,
          student:students (
            id,
            first_name,
            last_name,
            student_id,
            student_enrollments (
              class:classes (name)
            )
          )
        `)
                .gt("balance", 0)
                .neq("status", "Paid") // Include Pending and Partial
                .is("deleted_at", null)
                .order("balance", { ascending: false })
                .limit(20)

            if (error) {
                console.error("Error fetching debtors:", error)
                return
            }

            // Group by student to show total debt
            const studentMap = new Map()

            data?.forEach((invoice: any) => {
                if (!invoice.student) return

                const studentId = invoice.student.id
                if (!studentMap.has(studentId)) {
                    // Find active class
                    const activeClass = invoice.student.student_enrollments?.[0]?.class?.name || "N/A"

                    studentMap.set(studentId, {
                        id: studentId,
                        first_name: invoice.student.first_name,
                        last_name: invoice.student.last_name,
                        student_id: invoice.student.student_id,
                        class_name: activeClass,
                        total_debt: 0,
                        invoice_count: 0
                    })
                }

                const student = studentMap.get(studentId)
                student.total_debt += Number(invoice.balance)
                student.invoice_count += 1
            })

            setDebtors(Array.from(studentMap.values()))
        } catch (error) {
            console.error("Error processing debtors:", error)
        } finally {
            setLoading(false)
        }
    }

    const getInitials = (first: string, last: string) => {
        return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase()
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card className="h-full border-none shadow-none">
            <CardContent className="px-0 space-y-2 pt-0">
                {debtors.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No matching debtors found</p>
                ) : (
                    debtors.map((debtor) => (
                        <div
                            key={debtor.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                            onClick={() => onSelectStudent({ id: debtor.id, first_name: debtor.first_name, last_name: debtor.last_name })}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-10 w-10 bg-red-100 text-red-700 border border-red-200 flex-shrink-0">
                                    <AvatarFallback>{getInitials(debtor.first_name, debtor.last_name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{debtor.first_name} {debtor.last_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {debtor.class_name} • {debtor.student_id}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-sm text-red-600">
                                    ₦{debtor.total_debt.toLocaleString()}
                                </p>
                                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                    <span>Select</span>
                                    <ArrowRight className="h-3 w-3" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
