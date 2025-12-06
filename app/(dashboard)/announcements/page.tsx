import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { AnnouncementsClientPage } from "@/components/announcements-client-page"

export const dynamic = "force-dynamic"

export default async function AnnouncementsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Fetch all announcements for admin/teachers
  const { data: announcements } = await supabase
    .from("announcements")
    .select(`
      *,
      teacher:teachers(first_name, last_name)
    `)
    .order("created_at", { ascending: false })

  return <AnnouncementsClientPage initialAnnouncements={announcements || []} userRole={user.role} />
}
