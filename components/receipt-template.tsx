"use client"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface ReceiptTemplateProps {
  payment: any
  schoolSettings: any
  invoiceItems: any[]
}

export function ReceiptTemplate({ payment, schoolSettings, invoiceItems }: ReceiptTemplateProps) {
  const student = payment.students
  const invoice = payment.invoices
  const cashier = payment.received_by_user

  return (
    <Card className="max-w-4xl mx-auto p-8 print:p-12 print:shadow-none">
      {/* Header with School Info */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold">{schoolSettings?.school_name}</h1>
        {schoolSettings?.school_name_arabic && (
          <h2 className="text-2xl font-semibold" dir="rtl">
            {schoolSettings.school_name_arabic}
          </h2>
        )}
        <p className="text-sm text-muted-foreground">{schoolSettings?.address}</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          {schoolSettings?.phone_primary && <span>Tel: {schoolSettings.phone_primary}</span>}
          {schoolSettings?.email && <span>Email: {schoolSettings.email}</span>}
        </div>
      </div>

      <div className="text-center mb-6">
        <Badge className="text-lg px-4 py-1">PAYMENT RECEIPT</Badge>
      </div>

      <Separator className="my-6" />

      {/* Receipt Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Receipt No:</span>
            <span className="font-semibold">{payment.receipt_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Payment Date:</span>
            <span className="font-semibold">
              {new Date(payment.payment_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Payment Method:</span>
            <span className="font-semibold">{payment.payment_method}</span>
          </div>
          {payment.reference_number && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Reference No:</span>
              <span className="font-semibold">{payment.reference_number}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Student ID:</span>
            <span className="font-semibold">{student.student_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Student Name:</span>
            <span className="font-semibold">
              {student.first_name} {student.middle_name} {student.last_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Session:</span>
            <span className="font-semibold">{invoice.sessions?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Term:</span>
            <span className="font-semibold">{invoice.terms?.name}</span>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Payment Details */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4">Payment Details</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Description</th>
                <th className="text-right p-3 text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems?.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="p-3 text-sm">
                    {item.fee_categories?.name}
                    {item.description && <span className="text-muted-foreground"> - {item.description}</span>}
                  </td>
                  <td className="p-3 text-sm text-right font-medium">
                    ₦{Number.parseFloat(item.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2">
                <td className="p-3 font-semibold">Amount Paid</td>
                <td className="p-3 text-right text-lg font-bold">
                  ₦{Number.parseFloat(payment.amount).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Information */}
      <div className="bg-muted/30 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Invoice Amount</p>
            <p className="text-lg font-semibold">₦{Number.parseFloat(invoice.total_amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount Paid (This Receipt)</p>
            <p className="text-lg font-semibold">₦{Number.parseFloat(payment.amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance Remaining</p>
            <p className="text-lg font-bold text-orange-600">
              ₦{(Number.parseFloat(invoice.total_amount) - Number.parseFloat(payment.amount)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {payment.remarks && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Remarks:</p>
          <p className="text-sm">{payment.remarks}</p>
        </div>
      )}

      <Separator className="my-6" />

      {/* Footer */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Received By:</p>
          <p className="font-semibold">
            {cashier?.first_name} {cashier?.last_name}
          </p>
          <p className="text-sm text-muted-foreground">{cashier?.staff_id}</p>
          <div className="mt-8 border-t border-muted-foreground/20 pt-2">
            <p className="text-sm text-center">Signature</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Generated on: {new Date().toLocaleString("en-GB")}</p>
          <div className="mt-12">
            <p className="text-xs text-muted-foreground italic">
              This is a computer-generated receipt and does not require a signature.
            </p>
          </div>
        </div>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
        <p>Thank you for your payment.</p>
        <p>
          For inquiries, please contact {schoolSettings?.email} or call {schoolSettings?.phone_primary}
        </p>
      </div>
    </Card>
  )
}
