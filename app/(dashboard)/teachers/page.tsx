import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { TeachersClientPage } from "@/components/teachers-client-page"

export const dynamic = "force-dynamic"

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()

  const params = await searchParams
  const search = params.search || ""

  const { count } = await supabase.from("teachers").select("*", { count: "exact", head: true }).is("deleted_at", null)

  let query = supabase.from("teachers").select("*").is("deleted_at", null).order("created_at", { ascending: false })

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,staff_id.ilike.%${search}%`,
    )
  }

  const { data: teachers } = await query

  return <TeachersClientPage initialTeachers={teachers || []} totalCount={count || 0} />
}
