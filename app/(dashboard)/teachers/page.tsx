import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { TeachersClientPage } from "@/components/teachers-client-page"

export const dynamic = "force-dynamic"

export default async function TeachersPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: teachers } = await supabase.from("teachers").select("*").order("created_at", { ascending: false })

  return <TeachersClientPage initialTeachers={teachers || []} />
}
