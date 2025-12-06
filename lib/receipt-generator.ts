// Receipt PDF generation utilities
// This is a placeholder - in production, use a library like @react-pdf/renderer or jsPDF

export interface ReceiptData {
  receiptNumber: string
  paymentDate: string
  studentName: string
  studentId: string
  className: string
  amount: number
  paymentMethod: string
  referenceNumber?: string
  receivedBy: string
  invoiceNumber: string
  remarks?: string
}

export async function generateReceiptPDF(data: ReceiptData): Promise<string> {
  // In production, implement actual PDF generation here
  // For now, return a formatted text receipt

  const receipt = `
    ============================================
    AMMAR BIN YASIR INSTITUTE
    Official Payment Receipt
    ============================================
    
    Receipt Number: ${data.receiptNumber}
    Date: ${data.paymentDate}
    
    Student Information:
    Name: ${data.studentName}
    ID: ${data.studentId}
    Class: ${data.className}
    
    Payment Details:
    Amount Paid: ₦${data.amount.toLocaleString()}
    Payment Method: ${data.paymentMethod}
    Reference: ${data.referenceNumber || "N/A"}
    Invoice Number: ${data.invoiceNumber}
    
    Received By: ${data.receivedBy}
    ${data.remarks ? `Remarks: ${data.remarks}` : ""}
    
    ============================================
    Thank you for your payment
    ============================================
  `

  return receipt
}

export function downloadReceipt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
