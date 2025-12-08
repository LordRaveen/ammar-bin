import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import AcademicReportsClient from "@/components/academic-reports-client"

export const dynamic = "force-dynamic"

export default async function AcademicReportsPage() {
  const supabase = await createServerClient()

  // Fetch academic performance data
  const { data: performance } = await supabase
    .from("vw_academic_performance")
    .select("*")
    .order("average_percentage", { ascending: false })
    .limit(100)

  // Fetch subject performance data
  const { data: subjectPerformance } = await supabase.from("vw_subject_performance").select("*")

  // Fetch sessions for filtering
  const { data: sessions } = await supabase.from("sessions").select("*").order("start_date", { ascending: false })

  // Fetch classes for filtering
  const { data: classes } = await supabase.from("classes").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Academic Performance Reports</h1>
        <p className="text-muted-foreground">Comprehensive analysis of student and class performance</p>
      </div>

      <Suspense fallback={<div>Loading reports...</div>}>
        <AcademicReportsClient
          performance={performance || []}
          subjectPerformance={subjectPerformance || []}
          sessions={sessions || []}
          classes={classes || []}
        />
      </Suspense>
    </div>
  )
}
