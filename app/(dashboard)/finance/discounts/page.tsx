import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscountManagement } from "@/components/discount-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DiscountsPage() {
  await requireAuth(["super_admin", "admin"])
  const supabase = await createServerClient()

  // Get all discounts
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
        total_amount
      ),
      created_by_user:teachers!created_by (
        first_name,
        last_name
      ),
      approved_by_user:teachers!approved_by (
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
          <h1 className="text-3xl font-bold tracking-tight">Discounts & Waivers</h1>
          <p className="text-muted-foreground">Manage fee discounts and waivers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apply Discount or Waiver</CardTitle>
          <CardDescription>Reduce or waive fees for students</CardDescription>
        </CardHeader>
        <CardContent>
          <DiscountManagement existingDiscounts={discounts || []} />
        </CardContent>
      </Card>
    </div>
  )
}
