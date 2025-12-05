import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DiscountManagementClient } from "@/components/discount-management-client"

export const dynamic = "force-dynamic"

export default async function ManageDiscountsPage() {
  const user = await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get all discounts with related data
  const { data: discounts } = await supabase
    .from("discounts")
    .select(`
      *,
      students (
        student_id,
        first_name,
        last_name
      ),
      invoices (
        invoice_number,
        total_amount,
        balance
      ),
      created_by_teacher:teachers!discounts_created_by_fkey (
        first_name,
        last_name
      ),
      approved_by_teacher:teachers!discounts_approved_by_fkey (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Discounts & Waivers</h1>
          <p className="text-muted-foreground">Review and approve discount requests</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Discounts</CardTitle>
          <CardDescription>{discounts?.length || 0} discount(s) recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <DiscountManagementClient discounts={discounts || []} userRole={user.role} />
        </CardContent>
      </Card>
    </div>
  )
}
