import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { UsersClientPage } from "@/components/users-client-page"

export const dynamic = "force-dynamic"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()

  const params = await searchParams
  const search = params.search || ""

  const { count } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true })

  let query = supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,staff_id.ilike.%${search}%`,
    )
  }

  const { data: users } = await query

  return <UsersClientPage initialUsers={users || []} totalCount={count || 0} />
}
