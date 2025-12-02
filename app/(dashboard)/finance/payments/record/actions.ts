'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { devLog } from '@/lib/logger'

export async function recordPayment(formData: FormData) {
  const supabase = await createServerClient()

  const invoiceId = formData.get('invoice_id') as string
  const studentId = formData.get('student_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paymentDate = formData.get('payment_date') as string
  const paymentMethod = formData.get('payment_method') as string
  const referenceNumber = formData.get('reference_number') as string || null
  const remarks = formData.get('remarks') as string || null

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Get invoice details
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Generate receipt number
  const { count } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })

  const receiptNumber = `RCP/${new Date().getFullYear()}/${String((count || 0) + 1).padStart(3, '0')}`

  devLog('Recording payment:', { invoiceId, amount, receiptNumber })

  // Insert payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
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
    devLog('Error recording payment:', paymentError)
    throw new Error('Failed to record payment')
  }

  // Update invoice
  const newAmountPaid = parseFloat(invoice.amount_paid) + amount
  const newBalance = parseFloat(invoice.total_amount) - newAmountPaid
  
  let newStatus = 'Pending'
  if (newBalance <= 0) {
    newStatus = 'Paid'
  } else if (newAmountPaid > 0) {
    newStatus = 'Partial'
  }

  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      amount_paid: newAmountPaid,
      balance: newBalance,
      status: newStatus,
    })
    .eq('id', invoiceId)

  if (invoiceError) {
    devLog('Error updating invoice:', invoiceError)
    throw new Error('Failed to update invoice')
  }

  devLog('Payment recorded successfully')

  revalidatePath('/finance/payments')
  revalidatePath('/finance/invoices')
  redirect('/finance/payments')
}
