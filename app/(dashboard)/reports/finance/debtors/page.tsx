import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DebtorsReport } from "@/components/reports/debtors-report"

export const dynamic = "force-dynamic"

export default async function DebtorsReportPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get all debtors (students with outstanding balance)
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      students (
        student_id,
        first_name,
        middle_name,
        last_name
      ),
      student_enrollments!inner (
        classes (
          name,
          sections (name)
        )
      ),
      sessions (name),
      terms (name)
    `)
    .gt("balance", 0)
    .order("due_date")

  // Calculate total outstanding
  const totalOutstanding = invoices?.reduce((sum, inv) => sum + Number.parseFloat(inv.balance), 0) || 0

  // Get school settings
  const { data: schoolSettings } = await supabase.from("school_settings").select("*").single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Debtors Report</h1>
        <p className="text-muted-foreground">Students with outstanding fee balances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Fees</CardTitle>
          <CardDescription>
            {invoices?.length || 0} student(s) with total outstanding of ₦{totalOutstanding.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DebtorsReport invoices={invoices || []} schoolSettings={schoolSettings} />
        </CardContent>
      </Card>
    </div>
  )
}
