import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { FinanceTabs } from "@/components/finance/finance-tabs"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // 1. Parallel Fetching for Financial Data
  const [
    { data: invoices, error: invError },
    { data: payments, error: payError }
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select(`
        *,
        students (
          first_name,
          last_name,
          student_id
        )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200), // Safety limit for performance

    supabase
      .from("payments")
      .select(`
        *,
        payment_allocations (
          amount,
          students (
            first_name,
            last_name
          )
        )
      `)
      .order("payment_date", { ascending: false })
      .limit(100)
  ])

  if (invError) console.error("Invoices fetch error:", invError)
  if (payError) console.error("Payments fetch error:", payError)

  return (
    <div className="space-y-6">
      <FinanceTabs
        initialInvoices={invoices || []}
        initialPayments={payments || []}
        userRole={user.role as "admin" | "accountant" | "super_admin"}
      />
    </div>
  )
}
