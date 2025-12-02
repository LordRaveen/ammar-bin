import { requireAuth } from '@/lib/auth/get-user'
import { createServerClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  await requireAuth(['super_admin', 'admin', 'accountant'])
  const supabase = await createServerClient()

  // Get all invoices with student details
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name
      ),
      sessions (name),
      terms (name)
    `)
    .order('generated_at', { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'default'
      case 'Partial':
        return 'secondary'
      case 'Pending':
        return 'outline'
      case 'Overdue':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage student fee invoices
          </p>
        </div>
        <Link href="/finance/invoices/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Invoices
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {invoices?.length || 0} invoice(s) generated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Invoice No.</th>
                  <th className="text-left p-2">Student</th>
                  <th className="text-left p-2">Session/Term</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-right p-2">Paid</th>
                  <th className="text-right p-2">Balance</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-left p-2">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices && invoices.length > 0 ? (
                  invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="border-b">
                      <td className="p-2">
                        <Link
                          href={`/finance/invoices/${invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="p-2">
                        <Link
                          href={`/students/${invoice.students.id}`}
                          className="hover:underline"
                        >
                          {invoice.students.first_name}{' '}
                          {invoice.students.last_name}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {invoice.students.student_id}
                          </span>
                        </Link>
                      </td>
                      <td className="p-2 text-sm">
                        {invoice.sessions.name}
                        <br />
                        <span className="text-muted-foreground">
                          {invoice.terms.name}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">
                        ₦{parseFloat(invoice.total_amount).toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-green-600">
                        ₦{parseFloat(invoice.amount_paid).toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-orange-600 font-medium">
                        ₦{parseFloat(invoice.balance).toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No invoices generated yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
