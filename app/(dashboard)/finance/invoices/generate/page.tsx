import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceGenerationForm } from "@/components/invoice-generation-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function GenerateInvoicePage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get active session and term
  const { data: activeSession } = await supabase.from("sessions").select("*").eq("is_active", true).maybeSingle()

  const { data: activeTerm } = await supabase.from("terms").select("*").eq("is_active", true).maybeSingle()

  // Get all classes
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, sections(name)")
    .eq("is_active", true)
    .order("name")

  // Get fee structures for active session/term
  const { data: feeStructures } = await supabase
    .from("fee_structures")
    .select(`
      *,
      fee_categories(name, description),
      classes(name)
    `)
    .eq("session_id", activeSession?.id)
    .eq("term_id", activeTerm?.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Invoices</h1>
          <p className="text-muted-foreground">Create invoices for students</p>
        </div>
      </div>

      {!activeSession || !activeTerm ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No active session or term found. Please activate a session and term in Settings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Generation</CardTitle>
            <CardDescription>
              Generate invoices for {activeSession.name} - {activeTerm.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceGenerationForm
              activeSession={activeSession}
              activeTerm={activeTerm}
              classes={classes}
              feeStructures={feeStructures}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
