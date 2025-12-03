import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DailyCashReport } from "@/components/reports/daily-cash-report"

export const dynamic = "force-dynamic"

export default async function DailyCashReportPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get school settings
  const { data: schoolSettings } = await supabase.from("school_settings").select("*").single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Cash Report</h1>
        <p className="text-muted-foreground">View daily collections by payment method</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Daily Report</CardTitle>
          <CardDescription>Select a date to view collections</CardDescription>
        </CardHeader>
        <CardContent>
          <DailyCashReport schoolSettings={schoolSettings} />
        </CardContent>
      </Card>
    </div>
  )
}
