import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const paymentMethod = searchParams.get("paymentMethod")
    const classId = searchParams.get("classId")
    const cashierId = searchParams.get("cashierId")
    const studentSearch = searchParams.get("studentSearch")

    // Build query
    let query = supabase
      .from("payments")
      .select(`
        id,
        receipt_number,
        payment_date,
        amount,
        payment_method,
        reference_number,
        remarks,
        student:students!payments_student_id_fkey (
          student_id,
          first_name,
          last_name
        ),
        invoice:invoices!payments_invoice_id_fkey (
          invoice_number
        ),
        cashier:teachers!payments_received_by_fkey (
          first_name,
          last_name,
          staff_id
        )
      `)
      .order("payment_date", { ascending: false })

    // Apply date filters
    if (startDate) {
      query = query.gte("payment_date", startDate)
    }
    if (endDate) {
      query = query.lte("payment_date", endDate)
    }

    // Apply payment method filter
    if (paymentMethod && paymentMethod !== "all") {
      query = query.eq("payment_method", paymentMethod)
    }

    // Apply cashier filter
    if (cashierId && cashierId !== "all") {
      query = query.eq("received_by", cashierId)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error("Error fetching payments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let filteredPayments = payments || []

    // Filter by class if specified
    if (classId && classId !== "all") {
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("student_id")
        .eq("class_id", classId)
        .eq("is_active", true)

      const studentIds = enrollments?.map((e) => e.student_id) || []
      filteredPayments = filteredPayments.filter((p: any) => studentIds.includes(p.student_id))
    }

    // Filter by student search
    if (studentSearch) {
      const searchLower = studentSearch.toLowerCase()
      filteredPayments = filteredPayments.filter((p: any) => {
        const fullName = `${p.student.first_name} ${p.student.last_name}`.toLowerCase()
        const studentId = p.student.student_id.toLowerCase()
        return fullName.includes(searchLower) || studentId.includes(searchLower)
      })
    }

    // Calculate summary
    const totalAmount = filteredPayments.reduce((sum: number, p: any) => sum + Number.parseFloat(p.amount), 0)
    const totalCount = filteredPayments.length
    const averagePayment = totalCount > 0 ? totalAmount / totalCount : 0

    const byMethod = {
      cash: filteredPayments
        .filter((p: any) => p.payment_method === "Cash")
        .reduce((sum: number, p: any) => sum + Number.parseFloat(p.amount), 0),
      transfer: filteredPayments
        .filter((p: any) => p.payment_method === "Bank Transfer")
        .reduce((sum: number, p: any) => sum + Number.parseFloat(p.amount), 0),
      pos: filteredPayments
        .filter((p: any) => p.payment_method === "POS")
        .reduce((sum: number, p: any) => sum + Number.parseFloat(p.amount), 0),
    }

    return NextResponse.json({
      payments: filteredPayments,
      summary: {
        totalAmount,
        totalCount,
        averagePayment,
        byMethod,
      },
    })
  } catch (error) {
    console.error("Error in payment history report:", error)
    return NextResponse.json({ error: "Failed to generate payment history report" }, { status: 500 })
  }
}
