"use server"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { devLog } from "@/lib/logger"
import { generateReceiptPDF, type ReceiptData } from "@/lib/receipt-generator"
import { sendPaymentReceipt, sendPaymentNotification } from "@/lib/notifications"

export async function recordPayment(formData: FormData) {
  const supabase = await createServerClient()

  const invoiceId = formData.get("invoice_id") as string
  const studentId = formData.get("student_id") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const paymentDate = formData.get("payment_date") as string
  const paymentMethod = formData.get("payment_method") as string
  const referenceNumber = (formData.get("reference_number") as string) || null
  const remarks = (formData.get("remarks") as string) || null

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get invoice details
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).single()

  if (!invoice) {
    throw new Error("Invoice not found")
  }

  // Get student and guardian details for notifications
  const { data: student } = await supabase
    .from("students")
    .select(
      `
      *,
      student_guardians!inner(
        guardian:guardians(email, phone)
      )
    `,
    )
    .eq("id", studentId)
    .single()

  // Get teacher details
  const { data: teacher } = await supabase
    .from("teachers")
    .select("first_name, last_name, staff_id")
    .eq("user_id", user?.id)
    .single()

  // Generate receipt number
  const { count } = await supabase.from("payments").select("*", { count: "exact", head: true })

  const receiptNumber = `RCP/${new Date().getFullYear()}/${String((count || 0) + 1).padStart(5, "0")}`

  devLog("Recording payment:", { invoiceId, amount, receiptNumber })

  // Insert payment
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      receipt_number: receiptNumber,
      invoice_id: invoiceId,
      student_id: studentId,
      amount,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      reference_number: referenceNumber,
      received_by: user?.id,
      remarks,
    })
    .select()
    .single()

  if (paymentError) {
    devLog("Error recording payment:", paymentError)
    throw new Error("Failed to record payment")
  }

  // Update invoice
  const newAmountPaid = Number.parseFloat(invoice.amount_paid) + amount
  const newBalance = Number.parseFloat(invoice.total_amount) - newAmountPaid

  let newStatus = "Pending"
  if (newBalance <= 0) {
    newStatus = "Paid"
  } else if (newAmountPaid > 0) {
    newStatus = "Partial"
  }

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      balance: newBalance,
      status: newStatus,
    })
    .eq("id", invoiceId)

  if (invoiceError) {
    devLog("Error updating invoice:", invoiceError)
    throw new Error("Failed to update invoice")
  }

  // Generate receipt PDF
  if (student && teacher) {
    const receiptData: ReceiptData = {
      receiptNumber,
      paymentDate,
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      className: "N/A", // You can fetch class if needed
      amount,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      receivedBy: `${teacher.first_name} ${teacher.last_name} (${teacher.staff_id})`,
      invoiceNumber: invoice.invoice_number,
      remarks: remarks || undefined,
    }

    const receiptContent = await generateReceiptPDF(receiptData)

    // Send notifications
    const primaryGuardian = student.student_guardians[0]?.guardian
    if (primaryGuardian) {
      // Send email receipt
      if (primaryGuardian.email) {
        await sendPaymentReceipt(primaryGuardian.email, receiptContent, receiptNumber)
      }

      // Send SMS notification
      if (primaryGuardian.phone) {
        await sendPaymentNotification(primaryGuardian.phone, amount, receiptNumber)
      }
    }
  }

  devLog("Payment recorded successfully with notifications")

  revalidatePath("/finance/payments")
  revalidatePath("/finance/invoices")
  revalidatePath("/parent/payments")
  redirect("/finance/payments")
}
