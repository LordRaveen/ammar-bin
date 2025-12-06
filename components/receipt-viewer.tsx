"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { generateReceiptPDF, downloadReceipt, type ReceiptData } from "@/lib/receipt-generator"

interface ReceiptViewerProps {
  data: ReceiptData & {
    schoolName?: string
    schoolNameArabic?: string
    schoolAddress?: string
    schoolPhone?: string
    schoolEmail?: string
  }
}

export default function ReceiptViewer({ data }: ReceiptViewerProps) {
  const handleDownload = async () => {
    const content = await generateReceiptPDF(data)
    downloadReceipt(content, `${data.receiptNumber.replace(/\//g, "-")}.txt`)
  }

  return (
    <Card className="print:shadow-none">
      <CardContent className="p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{data.schoolName || "AMMAR BIN YASIR INSTITUTE"}</h1>
          {data.schoolNameArabic && <p className="text-lg text-muted-foreground">{data.schoolNameArabic}</p>}
          {data.schoolAddress && <p className="text-sm text-muted-foreground">{data.schoolAddress}</p>}
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            {data.schoolPhone && <span>Tel: {data.schoolPhone}</span>}
            {data.schoolEmail && <span>Email: {data.schoolEmail}</span>}
          </div>
        </div>

        <Separator />

        {/* Receipt Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold">OFFICIAL PAYMENT RECEIPT</h2>
          <p className="text-sm text-muted-foreground mt-1">Receipt No: {data.receiptNumber}</p>
        </div>

        <Separator />

        {/* Receipt Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date of Payment</p>
              <p className="font-medium">{data.paymentDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{data.invoiceNumber}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Student Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{data.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Student ID</p>
                <p className="font-medium">{data.studentId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Class</p>
                <p className="font-medium">{data.className}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Payment Details</p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-2xl font-bold text-green-600">₦{data.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">{data.paymentMethod}</span>
              </div>
              {data.referenceNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference Number</span>
                  <span className="font-medium font-mono">{data.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>

          {data.remarks && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm">{data.remarks}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-between items-center text-sm">
            <div>
              <p className="text-muted-foreground">Received By</p>
              <p className="font-medium">{data.receivedBy}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Signature</p>
              <div className="border-b border-foreground/20 w-32 mt-6"></div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Thank you for your payment</p>
          <p className="text-xs text-muted-foreground">This is an official receipt. Please keep for your records.</p>
          <p className="text-xs text-muted-foreground">For inquiries, please contact the school administration.</p>
        </div>

        {/* Download Button (hidden in print) */}
        <div className="print:hidden flex justify-center pt-4">
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
