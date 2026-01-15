import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import AdminAttendanceClient from "@/components/admin-attendance-client"

export const dynamic = "force-dynamic"

export default async function AdminAttendancePage() {
  const user = await requireAuth()

  // Only admins can access
  if (user.role !== "admin") {
    return <div className="p-6">Access Denied</div>
  }

  const supabase = await createClient()

  // Fetch classes for filter
  const { data: classes } = await supabase.from("classes").select("id, name").order("name")

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AdminAttendanceClient classes={classes || []} />
    </Suspense>
  )
}
