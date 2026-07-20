import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { InvoiceGenerationClient } from "@/components/invoice-generation-client"

export const dynamic = "force-dynamic"

export default async function GenerateInvoicePage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Fetch active session and term
  const [{ data: activeSession }, { data: activeTerm }, { data: classes }, { data: sessions }] = await Promise.all([
    supabase.from("sessions").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("terms").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("classes").select("*, section:sections(name)").eq("is_active", true).order("name"),
    supabase.from("sessions").select("*, terms:terms(*)").order("name", { ascending: false }),
  ])

  return (
    <InvoiceGenerationClient
      activeSession={activeSession}
      activeTerm={activeTerm}
      classes={classes || []}
      sessions={sessions || []}
    />
  )
}
