import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get all payments for the session grouped by payment method
    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        payment_method,
        amount,
        invoice_id,
        invoices!inner (
          session_id
        )
      `)
      .eq("invoices.session_id", sessionId)

    if (error) throw error

    // Group by payment method
    const grouped = (payments || []).reduce((acc: any, payment: any) => {
      const method = payment.payment_method || "Unknown"
      if (!acc[method]) {
        acc[method] = {
          payment_method: method,
          count: 0,
          total_amount: 0,
        }
      }
      acc[method].count += 1
      acc[method].total_amount += Number.parseFloat(payment.amount) || 0
      return acc
    }, {})

    const collections = Object.values(grouped)

    return NextResponse.json({ collections })
  } catch (error) {
    console.error("Error fetching collection summary:", error)
    return NextResponse.json({ error: "Failed to fetch collection summary" }, { status: 500 })
  }
}
