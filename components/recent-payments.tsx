"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Banknote, CreditCard } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Payment {
  id: string
  receipt_number: string
  amount: string
  payment_method: string
  payment_date: string
  students: {
    first_name: string
    last_name: string
    student_id: string
  }
}

export function RecentPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentPayments() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          receipt_number,
          amount,
          payment_method,
          payment_date,
          students (
            first_name,
            last_name,
            student_id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      if (!error && data) {
        setPayments(data as Payment[])
      }
      setLoading(false)
    }

    fetchRecentPayments()
  }, [])

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Cash":
        return <Banknote className="h-4 w-4" />
      case "Bank Transfer":
      case "POS":
        return <CreditCard className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "Cash":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Bank Transfer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "POS":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <CardDescription>Latest payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No recent payments</div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Link
                key={payment.id}
                href={`/finance/receipts/${payment.id}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className={`p-2 rounded-full ${getPaymentMethodColor(payment.payment_method)}`}>
                  {getPaymentMethodIcon(payment.payment_method)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium truncate">
                      {payment.students.first_name} {payment.students.last_name}
                    </p>
                    <p className="font-semibold whitespace-nowrap">
                      ₦{Number.parseFloat(payment.amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{payment.receipt_number}</span>
                    <span>•</span>
                    <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <Link href="/finance/payments" className="text-sm text-primary hover:underline">
            View all payments →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
