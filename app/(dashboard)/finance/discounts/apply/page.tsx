import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DiscountApplicationClient } from "@/components/discount-application-client"

export const dynamic = "force-dynamic"

export default async function ApplyDiscountPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get active session and term
  const { data: activeSession } = await supabase.from("sessions").select("*").eq("is_active", true).maybeSingle()

  const { data: activeTerm } = await supabase.from("terms").select("*").eq("is_active", true).maybeSingle()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply Discount/Waiver</h1>
          <p className="text-muted-foreground">Grant discounts or waivers to student invoices</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discount Application</CardTitle>
          <CardDescription>Search for a student and apply discounts to their pending invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <DiscountApplicationClient activeSession={activeSession} activeTerm={activeTerm} />
        </CardContent>
      </Card>
    </div>
  )
}
