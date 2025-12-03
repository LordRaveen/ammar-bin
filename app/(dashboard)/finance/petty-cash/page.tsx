import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PettyCashManagement } from "@/components/petty-cash-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PettyCashPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get all petty cash transactions
  const { data: transactions } = await supabase
    .from("petty_cash_transactions")
    .select(`
      *,
      recorded_by_user:teachers!recorded_by (first_name, last_name)
    `)
    .order("transaction_date", { ascending: false })
    .limit(50)

  // Calculate current balance
  const currentBalance = transactions && transactions.length > 0 ? Number.parseFloat(transactions[0].balance_after) : 0

  // Calculate this month's in and out
  const thisMonth = transactions?.filter((t) => {
    const tDate = new Date(t.transaction_date)
    const now = new Date()
    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
  })

  const monthIn =
    thisMonth?.filter((t) => t.transaction_type === "IN").reduce((sum, t) => sum + Number.parseFloat(t.amount), 0) || 0

  const monthOut =
    thisMonth?.filter((t) => t.transaction_type === "OUT").reduce((sum, t) => sum + Number.parseFloat(t.amount), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Petty Cash Management</h1>
          <p className="text-muted-foreground">Track petty cash transactions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{currentBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Available cash</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">This Month (In)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{monthIn.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Money added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">This Month (Out)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₦{monthOut.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Money spent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Transaction</CardTitle>
          <CardDescription>Add money to or withdraw from petty cash</CardDescription>
        </CardHeader>
        <CardContent>
          <PettyCashManagement currentBalance={currentBalance} transactions={transactions || []} />
        </CardContent>
      </Card>
    </div>
  )
}
