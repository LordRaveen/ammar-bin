// Email and SMS notification utilities
// Placeholders for future email/SMS integration

export interface EmailNotification {
  to: string
  subject: string
  body: string
  attachments?: { filename: string; content: string }[]
}

export interface SMSNotification {
  to: string
  message: string
}

export async function sendEmail(notification: EmailNotification): Promise<boolean> {
  // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
  return true
}

export async function sendSMS(notification: SMSNotification): Promise<boolean> {
  // TODO: Integrate with SMS service (Termii, Twilio, etc.)
  return true
}

export async function sendPaymentReceipt(email: string, receiptContent: string, receiptNumber: string) {
  return sendEmail({
    to: email,
    subject: `Payment Receipt - ${receiptNumber}`,
    body: `Thank you for your payment. Please find your receipt attached.\n\n${receiptContent}`,
  })
}

export async function sendPaymentNotification(phone: string, amount: number, receiptNumber: string) {
  return sendSMS({
    to: phone,
    message: `Payment of ₦${amount.toLocaleString()} received successfully. Receipt: ${receiptNumber}. Thank you! - Ammar Bin Yasir Institute`,
  })
}

export async function sendFeeReminder(
  email: string,
  phone: string,
  studentName: string,
  amountDue: number,
  dueDate: string,
) {
  const emailSent = await sendEmail({
    to: email,
    subject: "Fee Payment Reminder",
    body: `Dear Parent/Guardian,\n\nThis is a reminder that ${studentName} has an outstanding fee of ₦${amountDue.toLocaleString()} due on ${dueDate}.\n\nPlease make payment at your earliest convenience.\n\nThank you,\nAmmar Bin Yasir Institute`,
  })

  const smsSent = await sendSMS({
    to: phone,
    message: `Fee reminder: ${studentName} has ₦${amountDue.toLocaleString()} due on ${dueDate}. Please pay soon. - Ammar Bin Yasir Institute`,
  })

  return emailSent && smsSent
}
