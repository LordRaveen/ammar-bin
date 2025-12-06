import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { ParentAnnouncementsClient } from "@/components/parent-announcements-client"

export const dynamic = "force-dynamic"

export default async function ParentAnnouncementsPage() {
  const user = await requireAuth()

  // Redirect non-parents
  if (user.role !== "parent") {
    return <div>Access Denied</div>
  }

  const supabase = await createClient()

  // Get all announcements targeted to parents or all
  const { data: announcements, error } = await supabase
    .from("announcements")
    .select(`
      *,
      teachers (
        first_name,
        last_name
      )
    `)
    .in("target_audience", ["All", "Parents"])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching announcements:", error)
  }

  return <ParentAnnouncementsClient announcements={announcements || []} />
}
