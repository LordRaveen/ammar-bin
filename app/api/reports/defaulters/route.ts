import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get overdue invoices with student and class details
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        balance,
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
      .eq("status", "Pending")
      .lt("due_date", new Date().toISOString().split("T")[0])
      .order("due_date", { ascending: true })

    if (error) throw error

    const defaulters =
      invoices?.map((invoice: any) => {
        const student = invoice.students
        const enrollment = student?.student_enrollments?.[0]
        const className = enrollment?.classes?.name || "N/A"

        const dueDate = new Date(invoice.due_date)
        const today = new Date()
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        return {
          student_id: student?.student_id || "N/A",
          student_name: `${student?.first_name || ""} ${student?.last_name || ""}`.trim() || "N/A",
          class_name: className,
          invoice_number: invoice.invoice_number,
          total_amount: Number.parseFloat(invoice.total_amount) || 0,
          amount_paid: Number.parseFloat(invoice.amount_paid) || 0,
          balance: Number.parseFloat(invoice.balance) || 0,
          due_date: invoice.due_date,
          days_overdue: daysOverdue,
        }
      }) || []

    return NextResponse.json({ defaulters })
  } catch (error) {
    console.error("Error fetching defaulters:", error)
    return NextResponse.json({ error: "Failed to fetch defaulters report" }, { status: 500 })
  }
}
