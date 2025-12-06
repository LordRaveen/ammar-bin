import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { ParentPaymentsClient } from "@/components/parent-payments-client"

export const dynamic = "force-dynamic"

export default async function ParentPaymentsPage() {
  const user = await requireAuth()

  // Redirect non-parents
  if (user.role !== "parent") {
    return <div>Access Denied</div>
  }

  const supabase = await createClient()

  // Get guardian record
  const { data: guardian } = await supabase.from("guardians").select("*").eq("user_id", user.id).single()

  if (!guardian) {
    return <div>Guardian record not found</div>
  }

  // Get all children
  const { data: studentGuardians } = await supabase
    .from("student_guardians")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name,
        photo_url
      )
    `)
    .eq("guardian_id", guardian.id)

  const children = studentGuardians?.map((sg: any) => sg.students) || []

  // Get all sessions and terms
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, terms(*)")
    .order("start_date", { ascending: false })

  // Get all invoices for all children
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name
      ),
      sessions (name),
      terms (name)
    `)
    .in(
      "student_id",
      children.map((c) => c.id),
    )
    .order("generated_at", { ascending: false })

  // Get all payments for all children
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name
      ),
      invoices (
        invoice_number
      )
    `)
    .in(
      "student_id",
      children.map((c) => c.id),
    )
    .order("payment_date", { ascending: false })

  // Get invoice items for detailed view
  const invoiceIds = invoices?.map((inv) => inv.id) || []
  const { data: invoiceItems } = await supabase
    .from("invoice_items")
    .select(`
      *,
      fee_categories:fee_category_id (
        name
      )
    `)
    .in("invoice_id", invoiceIds)

  return (
    <ParentPaymentsClient
      children={children}
      sessions={sessions || []}
      invoices={invoices || []}
      payments={payments || []}
      invoiceItems={invoiceItems || []}
    />
  )
}
