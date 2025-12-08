import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/get-user"
import CustomReportBuilderClient from "@/components/custom-report-builder-client"

export const dynamic = "force-dynamic"

export default async function CustomReportBuilderPage() {
  await requireAuth(["super_admin", "admin", "accountant"])

  const supabase = await createServerClient()

  // Fetch saved reports
  const { data: savedReports } = await supabase
    .from("saved_reports")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Report Builder</h1>
        <p className="text-muted-foreground">Create custom reports by selecting tables, columns, and filters</p>
      </div>

      <Suspense fallback={<div>Loading report builder...</div>}>
        <CustomReportBuilderClient savedReports={savedReports || []} />
      </Suspense>
    </div>
  )
}
