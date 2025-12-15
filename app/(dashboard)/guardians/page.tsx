import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { GuardiansClientPage } from "@/components/guardians-client-page"

export const dynamic = "force-dynamic"

export default async function GuardiansPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string; pageSize?: string }
}) {
  await requireAdmin()
  const supabase = await createClient()

  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("guardians")
    .select(
      `
      *,
      student_guardians(count)
    `,
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (searchParams.search) {
    query = query.or(
      `first_name.ilike.%${searchParams.search}%,last_name.ilike.%${searchParams.search}%,phone.ilike.%${searchParams.search}%`,
    )
  }

  const { data: guardians, count } = await query

  return (
    <GuardiansClientPage
      initialGuardians={guardians || []}
      initialSearch={searchParams.search}
      totalCount={count || 0}
      currentPage={page}
      pageSize={pageSize}
    />
  )
}
