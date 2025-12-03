import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceReminderSystem } from "@/components/invoice-reminder-system"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function InvoiceRemindersPage() {
  await requireAuth(["super_admin", "admin", "accountant"])
  const supabase = await createServerClient()

  // Get pending and overdue invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name
      ),
      student_guardians (
        guardians (
          id,
          first_name,
          last_name,
          phone,
          email,
          whatsapp_number
        )
      )
    `)
    .in("status", ["Pending", "Partial", "Overdue"])
    .order("due_date", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Reminders</h1>
          <p className="text-muted-foreground">Send payment reminders to parents/guardians</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invoices</CardTitle>
          <CardDescription>{invoices?.length || 0} invoice(s) with outstanding balance</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceReminderSystem invoices={invoices || []} />
        </CardContent>
      </Card>
    </div>
  )
}
