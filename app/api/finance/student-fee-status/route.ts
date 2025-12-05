import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("q")
    const sessionFilter = searchParams.get("session")
    const termFilter = searchParams.get("term")
    const statusFilter = searchParams.get("status")

    if (!searchTerm) {
      return NextResponse.json({ error: "Search term required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Search for student
    const studentQuery = supabase
      .from("students")
      .select(`
        id,
        student_id,
        first_name,
        last_name,
        middle_name,
        photo_url,
        student_enrollments!inner(
          class:classes(
            name,
            section:sections(name)
          )
        )
      `)
      .or(`student_id.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      .limit(1)
      .single()

    const { data: student, error: studentError } = await studentQuery

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get student's class info
    const enrollment = student.student_enrollments[0]
    const classInfo = enrollment?.class

    // Fetch invoices with filters
    let invoicesQuery = supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        balance,
        status,
        due_date,
        created_at,
        session:sessions(name),
        term:terms(name)
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })

    if (sessionFilter && sessionFilter !== "all") {
      invoicesQuery = invoicesQuery.eq("session_id", sessionFilter)
    }

    if (termFilter && termFilter !== "all") {
      invoicesQuery = invoicesQuery.eq("term_id", termFilter)
    }

    if (statusFilter && statusFilter !== "all") {
      invoicesQuery = invoicesQuery.eq("status", statusFilter)
    }

    const { data: invoices } = await invoicesQuery

    // Fetch payments
    const { data: payments } = await supabase
      .from("payments")
      .select(`
        id,
        receipt_number,
        amount,
        payment_date,
        payment_method,
        invoice:invoices(invoice_number)
      `)
      .eq("student_id", student.id)
      .order("payment_date", { ascending: false })

    // Calculate totals
    const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number.parseFloat(inv.total_amount), 0) || 0
    const totalPaid = invoices?.reduce((sum, inv) => sum + Number.parseFloat(inv.amount_paid), 0) || 0
    const totalBalance = invoices?.reduce((sum, inv) => sum + Number.parseFloat(inv.balance), 0) || 0

    return NextResponse.json({
      id: student.id,
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name,
      photo_url: student.photo_url,
      class_name: classInfo?.name || "N/A",
      section_name: classInfo?.section?.name || "N/A",
      total_invoiced: totalInvoiced.toFixed(2),
      total_paid: totalPaid.toFixed(2),
      total_balance: totalBalance.toFixed(2),
      invoices: invoices || [],
      payments:
        payments?.map((p) => ({
          ...p,
          invoice_number: p.invoice?.invoice_number || "N/A",
        })) || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching student fee status:", error)
    return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 })
  }
}
