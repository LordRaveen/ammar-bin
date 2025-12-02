import { requireAuth } from '@/lib/auth/get-user'
import { createServerClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { recordPayment } from './actions'

export const dynamic = 'force-dynamic'

export default async function RecordPaymentPage({
  searchParams,
}: {
  searchParams: { student?: string }
}) {
  await requireAuth(['super_admin', 'admin', 'accountant'])
  const supabase = await createServerClient()

  // Get all students for selection
  const { data: students } = await supabase
    .from('students')
    .select('id, student_id, first_name, middle_name, last_name')
    .eq('status', 'Active')
    .order('first_name')

  // If student selected, get their pending invoices
  let pendingInvoices = null
  if (searchParams.student) {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('student_id', searchParams.student)
      .neq('status', 'Paid')
      .order('due_date')

    pendingInvoices = data
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
          <p className="text-muted-foreground">
            Record a new student payment
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Enter the payment details and select the invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={recordPayment} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="student_id">
                Select Student <span className="text-destructive">*</span>
              </Label>
              <Select name="student_id" defaultValue={searchParams.student}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} (
                      {student.student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pendingInvoices && pendingInvoices.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invoice_id">
                    Select Invoice <span className="text-destructive">*</span>
                  </Label>
                  <Select name="invoice_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingInvoices.map((invoice: any) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} - Balance: ₦
                          {parseFloat(invoice.balance).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Amount (₦) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="25000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_date">
                      Payment Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="payment_date"
                      name="payment_date"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">
                      Payment Method <span className="text-destructive">*</span>
                    </Label>
                    <Select name="payment_method" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="POS">POS</SelectItem>
                        <SelectItem value="Mobile Money">
                          Mobile Money
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference_number">Reference Number</Label>
                    <Input
                      id="reference_number"
                      name="reference_number"
                      placeholder="TRX123456 (optional)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    name="remarks"
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit">Record Payment</Button>
                  <Link href="/finance/payments">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </>
            ) : searchParams.student ? (
              <div className="p-4 border rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  No pending invoices found for this student.
                </p>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  Please select a student to view their pending invoices.
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
