import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/get-user"
import { StudentFeeSearchClient } from "@/components/student-fee-search-client"

export const dynamic = "force-dynamic"

export default async function StudentFeeSearchPage() {
  await requireAuth()
  const supabase = await createClient()

  // Get sessions and terms for filters
  const [{ data: sessions }, { data: terms }, { data: classes }] = await Promise.all([
    supabase.from("sessions").select("*").order("created_at", { ascending: false }),
    supabase.from("terms").select("*").order("term_number"),
    supabase
      .from("classes")
      .select(`
        id,
        name,
        section:sections(name)
      `)
      .eq("is_active", true)
      .order("name"),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Fee Status</h1>
        <p className="text-muted-foreground">Search and view complete fee history for any student</p>
      </div>

      <StudentFeeSearchClient sessions={sessions || []} terms={terms || []} classes={classes || []} />
    </div>
  )
}
