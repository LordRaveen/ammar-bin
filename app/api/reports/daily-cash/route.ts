import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const cashierId = searchParams.get("cashier")

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from("payments")
      .select(`
        id,
        receipt_number,
        amount,
        payment_method,
        reference_number,
        payment_date,
        remarks,
        student_id,
        students:student_id (
          student_id,
          first_name,
          last_name
        ),
        received_by,
        teachers:received_by (
          first_name,
          last_name
        )
      `)
      .eq("payment_date", date)
      .order("payment_date", { ascending: true })

    // Filter by cashier if specified
    if (cashierId && cashierId !== "all") {
      query = query.eq("received_by", cashierId)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error("[v0] Error fetching payments:", error)
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
    }

    // Format payments data
    const formattedPayments = payments.map((p: any) => ({
      id: p.id,
      receipt_number: p.receipt_number,
      student_id: p.students?.student_id || "N/A",
      student_name: p.students ? `${p.students.first_name} ${p.students.last_name}` : "Unknown",
      amount: Number.parseFloat(p.amount),
      payment_method: p.payment_method,
      reference_number: p.reference_number,
      payment_date: p.payment_date,
      cashier_name: p.teachers ? `${p.teachers.first_name} ${p.teachers.last_name}` : "Unknown",
      remarks: p.remarks,
    }))

    // Calculate summary
    const summary = {
      cash: formattedPayments.filter((p) => p.payment_method === "Cash").reduce((sum, p) => sum + p.amount, 0),
      transfer: formattedPayments
        .filter((p) => p.payment_method === "Bank Transfer")
        .reduce((sum, p) => sum + p.amount, 0),
      pos: formattedPayments.filter((p) => p.payment_method === "POS").reduce((sum, p) => sum + p.amount, 0),
      total: formattedPayments.reduce((sum, p) => sum + p.amount, 0),
      cashCount: formattedPayments.filter((p) => p.payment_method === "Cash").length,
      transferCount: formattedPayments.filter((p) => p.payment_method === "Bank Transfer").length,
      posCount: formattedPayments.filter((p) => p.payment_method === "POS").length,
      totalCount: formattedPayments.length,
    }

    return NextResponse.json({
      payments: formattedPayments,
      summary,
    })
  } catch (error) {
    console.error("[v0] Error in daily cash report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
