import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get all pending/partial invoices
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        balance,
        status,
        due_date,
        student_id,
        students (
          student_id,
          first_name,
          last_name,
          student_enrollments (
            class_id,
            classes (
              name
            )
          )
        )
      `)
      .in("status", ["Pending", "Partial"])
      .order("balance", { ascending: false })

    if (error) throw error

    const fees =
      invoices?.map((invoice: any) => {
        const student = invoice.students
        const enrollment = student?.student_enrollments?.[0]
        const className = enrollment?.classes?.name || "N/A"

        return {
          student_id: student?.student_id || "N/A",
          student_name: `${student?.first_name || ""} ${student?.last_name || ""}`.trim() || "N/A",
          class_name: className,
          invoice_number: invoice.invoice_number,
          total_amount: Number.parseFloat(invoice.total_amount) || 0,
          amount_paid: Number.parseFloat(invoice.amount_paid) || 0,
          balance: Number.parseFloat(invoice.balance) || 0,
          status: invoice.status,
          due_date: invoice.due_date,
        }
      }) || []

    return NextResponse.json({ fees })
  } catch (error) {
    console.error("Error fetching outstanding fees:", error)
    return NextResponse.json({ error: "Failed to fetch outstanding fees report" }, { status: 500 })
  }
}
