import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/get-user"
import NotificationsPageClient from "@/components/notifications-page-client"

export default async function NotificationsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return (
    <NotificationsPageClient
      userId={user.id}
      initialPreferences={
        preferences || {
          email_enabled: true,
          sms_enabled: true,
          in_app_enabled: true,
          fee_reminders: true,
          new_results: true,
          new_announcements: true,
          attendance_alerts: true,
          new_messages: true,
        }
      }
    />
  )
}
