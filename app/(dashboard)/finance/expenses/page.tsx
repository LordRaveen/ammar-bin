import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpenseManagement } from "@/components/expense-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ExpensesPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get expense categories
  const { data: categories } = await supabase.from("expense_categories").select("*").eq("is_active", true).order("name")

  // Get recent expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
      *,
      expense_categories (name),
      recorded_by_user:teachers!recorded_by (first_name, last_name)
    `)
    .order("payment_date", { ascending: false })
    .limit(50)

  // Calculate total expenses
  const totalExpenses = expenses?.reduce((sum, exp) => sum + Number.parseFloat(exp.amount), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Expense Tracking</h1>
          <p className="text-muted-foreground">Record and manage school expenses</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{expenses?.length || 0} transaction(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦
              {expenses
                ?.filter((exp) => {
                  const expDate = new Date(exp.payment_date)
                  const now = new Date()
                  return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
                })
                .reduce((sum, exp) => sum + Number.parseFloat(exp.amount), 0)
                .toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active categories</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Expense</CardTitle>
          <CardDescription>Add a new expense transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseManagement categories={categories || []} expenses={expenses || []} />
        </CardContent>
      </Card>
    </div>
  )
}
