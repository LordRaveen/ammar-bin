"use client"

import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ReceiptPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAuth(["super_admin", "admin", "accountant", "cashier"])
  const supabase = await createServerClient()

  const { id: paymentId } = params

  // Fetch payment details with related data
  const { data: payment, error } = await supabase
    .from("payments")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name,
        student_enrollments (
          classes (
            name,
            sections (name)
          )
        )
      ),
      invoices (
        invoice_number,
        total_amount,
        amount_paid,
        balance,
        session_id,
        term_id,
        sessions (name),
        terms (name)
      ),
      teachers!payments_received_by_fkey (
        first_name,
        middle_name,
        last_name,
        staff_id
      )
    `)
    .eq("id", paymentId)
    .single()

  if (error || !payment) {
    return notFound()
  }

  // Fetch school settings
  const { data: school } = await supabase.from("school_settings").select("*").single()

  // Get class info from enrollment
  const enrollment = payment.students?.student_enrollments?.[0]
  const className = enrollment?.classes?.name || "N/A"
  const sectionName = enrollment?.classes?.sections?.name || ""

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/finance/payments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Receipt</h1>
            <p className="text-muted-foreground">Receipt No: {payment.receipt_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="default">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Printable Receipt */}
      <div className="bg-white text-black p-8 max-w-3xl mx-auto border-2 border-black shadow-lg print:shadow-none print:border print:max-w-full">
        {/* School Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {school?.school_name || "Ammar Bin Yasir Institute"}
          </h1>
          {school?.school_name_arabic && (
            <p className="text-lg font-semibold mt-1" dir="rtl">
              {school.school_name_arabic}
            </p>
          )}
          <p className="text-sm mt-2">{school?.address || ""}</p>
          <p className="text-sm">
            {school?.phone_primary && `Tel: ${school.phone_primary}`}
            {school?.phone_secondary && ` | ${school.phone_secondary}`}
          </p>
          {school?.email && <p className="text-sm">Email: {school.email}</p>}
          <h2 className="text-xl font-bold mt-4 uppercase tracking-wide">Official Payment Receipt</h2>
        </div>

        {/* Receipt Details Header */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b border-black pb-4">
          <div>
            <p className="font-semibold text-base">Receipt No:</p>
            <p className="text-lg font-bold">{payment.receipt_number}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-base">Date:</p>
            <p className="text-lg font-bold">
              {new Date(payment.payment_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Student Information */}
        <div className="mb-6 border border-black p-4 bg-gray-50">
          <h3 className="font-bold text-base mb-3 uppercase">Student Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Student Name:</p>
              <p className="font-semibold">
                {payment.students?.first_name} {payment.students?.middle_name} {payment.students?.last_name}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Student ID:</p>
              <p className="font-semibold">{payment.students?.student_id}</p>
            </div>
            <div>
              <p className="text-gray-600">Class:</p>
              <p className="font-semibold">
                {sectionName} {className}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Session/Term:</p>
              <p className="font-semibold">
                {payment.invoices?.sessions?.name} - {payment.invoices?.terms?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h3 className="font-bold text-base mb-3 uppercase border-b border-black pb-2">Payment Details</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="py-2">Payment for Invoice: {payment.invoices?.invoice_number}</td>
                <td className="text-right py-2 font-semibold">
                  {Number.parseFloat(payment.amount).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Summary Box */}
        <div className="mb-6 border-2 border-black p-4 bg-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Payment Method:</span>
            <span className="font-bold text-lg">{payment.payment_method}</span>
          </div>
          {payment.reference_number && (
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Reference Number:</span>
              <span className="font-mono">{payment.reference_number}</span>
            </div>
          )}
          <div className="border-t-2 border-black pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">AMOUNT PAID:</span>
              <span className="font-bold text-2xl">
                ₦
                {Number.parseFloat(payment.amount).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Balance Information */}
        <div className="mb-6 border border-black p-3 text-sm bg-yellow-50">
          <h4 className="font-semibold mb-2">Invoice Status:</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-gray-600 text-xs">Total Invoice:</p>
              <p className="font-semibold">
                ₦{Number.parseFloat(payment.invoices?.total_amount || "0").toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">Total Paid:</p>
              <p className="font-semibold text-green-600">
                ₦{Number.parseFloat(payment.invoices?.amount_paid || "0").toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">Balance Due:</p>
              <p className="font-semibold text-orange-600">
                ₦{Number.parseFloat(payment.invoices?.balance || "0").toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Remarks */}
        {payment.remarks && (
          <div className="mb-6 text-sm">
            <p className="font-semibold mb-1">Remarks:</p>
            <p className="border border-black p-2 bg-gray-50">{payment.remarks}</p>
          </div>
        )}

        {/* Received By */}
        <div className="mb-6 text-sm">
          <p className="font-semibold mb-1">Received By:</p>
          <p className="font-medium">
            {payment.teachers?.first_name} {payment.teachers?.middle_name} {payment.teachers?.last_name}
            {payment.teachers?.staff_id && ` (${payment.teachers.staff_id})`}
          </p>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-black">
          <div>
            <div className="border-t-2 border-black pt-2 mt-12">
              <p className="text-sm font-semibold text-center">Cashier Signature</p>
            </div>
          </div>
          <div>
            <div className="border-t-2 border-black pt-2 mt-12">
              <p className="text-sm font-semibold text-center">School Stamp</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-600 border-t border-gray-300 pt-4">
          <p className="font-semibold">IMPORTANT NOTICE</p>
          <p className="mt-1">This is an official receipt. Please keep it for your records.</p>
          <p>For any queries, contact the school administration.</p>
        </div>

        {/* Print Timestamp */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>
            Printed on:{" "}
            {new Date().toLocaleString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
