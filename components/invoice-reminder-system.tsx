"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Printer, Mail, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface InvoiceReminderSystemProps {
  invoices: any[]
}

export function InvoiceReminderSystem({ invoices }: InvoiceReminderSystemProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [reminderType, setReminderType] = useState<"sms" | "email" | "whatsapp" | "print">("print")
  const [reminderMessage, setReminderMessage] = useState(
    "Dear Parent/Guardian,\n\nThis is a reminder that your ward's school fees are outstanding. Please make payment at your earliest convenience.\n\nThank you.",
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(invoices.map((inv) => inv.id))
    } else {
      setSelectedInvoices([])
    }
  }

  const handleToggleInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId])
    } else {
      setSelectedInvoices(selectedInvoices.filter((id) => id !== invoiceId))
    }
  }

  const handleSendReminders = () => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice")
      return
    }

    if (reminderType === "print") {
      // Print reminders
      window.print()
      toast.success(`Prepared ${selectedInvoices.length} reminder(s) for printing`)
    } else {
      // Placeholder for SMS/Email/WhatsApp integration
      toast.info(`${reminderType.toUpperCase()} integration coming soon`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Overdue":
        return "destructive"
      case "Partial":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Reminder Options */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Reminder Method</Label>
          <Select value={reminderType} onValueChange={(value: any) => setReminderType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="print">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Notices
                </div>
              </SelectItem>
              <SelectItem value="email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (Coming Soon)
                </div>
              </SelectItem>
              <SelectItem value="sms">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS (Coming Soon)
                </div>
              </SelectItem>
              <SelectItem value="whatsapp">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp (Coming Soon)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handleSendReminders} disabled={selectedInvoices.length === 0} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Send {selectedInvoices.length} Reminder(s)
          </Button>
        </div>
      </div>

      {/* Message Template */}
      <div className="space-y-2">
        <Label>Reminder Message</Label>
        <Textarea
          value={reminderMessage}
          onChange={(e) => setReminderMessage(e.target.value)}
          rows={5}
          className="resize-none"
        />
      </div>

      {/* Invoice List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b flex items-center gap-3">
          <Checkbox checked={selectedInvoices.length === invoices.length} onCheckedChange={handleSelectAll} />
          <span className="font-medium">
            Select All ({selectedInvoices.length} of {invoices.length} selected)
          </span>
        </div>

        <div className="divide-y max-h-96 overflow-y-auto">
          {invoices.map((invoice) => {
            const guardian = invoice.student_guardians?.[0]?.guardians

            return (
              <div key={invoice.id} className="p-4 flex items-start gap-3 hover:bg-accent/50">
                <Checkbox
                  checked={selectedInvoices.includes(invoice.id)}
                  onCheckedChange={(checked) => handleToggleInvoice(invoice.id, checked as boolean)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium">
                        {invoice.students.first_name} {invoice.students.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.students.student_id} • {invoice.invoice_number}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <span className="text-muted-foreground">Balance: </span>
                      <span className="font-semibold text-orange-600">
                        ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due: </span>
                      <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {guardian && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Guardian: {guardian.first_name} {guardian.last_name} • {guardian.phone || guardian.email}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Print Template (Hidden) */}
      <div className="hidden print:block">
        {selectedInvoices.map((invoiceId) => {
          const invoice = invoices.find((inv) => inv.id === invoiceId)
          if (!invoice) return null

          const guardian = invoice.student_guardians?.[0]?.guardians

          return (
            <div key={invoiceId} className="page-break p-8 border mb-4">
              <h2 className="text-2xl font-bold mb-4">Payment Reminder</h2>
              <p className="mb-4">Dear {guardian?.first_name || "Parent/Guardian"},</p>
              <div className="whitespace-pre-wrap mb-4">{reminderMessage}</div>
              <div className="border p-4 my-4">
                <p>
                  <strong>Student:</strong> {invoice.students.first_name} {invoice.students.last_name}
                </p>
                <p>
                  <strong>Student ID:</strong> {invoice.students.student_id}
                </p>
                <p>
                  <strong>Invoice Number:</strong> {invoice.invoice_number}
                </p>
                <p>
                  <strong>Amount Due:</strong> ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                </p>
                <p>
                  <strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              </div>
              <p>Regards,</p>
              <p className="font-semibold">School Administration</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
