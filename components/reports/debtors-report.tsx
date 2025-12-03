"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Search, Send } from "lucide-react"
import Link from "next/link"

interface DebtorsReportProps {
  invoices: any[]
  schoolSettings: any
}

export function DebtorsReport({ invoices, schoolSettings }: DebtorsReportProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "overdue">("all")

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      searchQuery === "" ||
      inv.students.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.students.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.students.student_id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || (filterStatus === "overdue" && inv.status === "Overdue")

    return matchesSearch && matchesStatus
  })

  // Calculate days overdue
  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + Number.parseFloat(inv.balance), 0)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>
          All ({invoices.length})
        </Button>
        <Button
          variant={filterStatus === "overdue" ? "destructive" : "outline"}
          onClick={() => setFilterStatus("overdue")}
        >
          Overdue ({invoices.filter((i) => i.status === "Overdue").length})
        </Button>
      </div>

      <div className="flex justify-between items-center print:hidden">
        <div className="text-sm text-muted-foreground">
          Showing {filteredInvoices.length} of {invoices.length} debtors
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Link href="/finance/invoices/reminders">
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          </Link>
        </div>
      </div>

      {/* Report Content */}
      <div className="border rounded-lg print:border-0">
        {/* Print Header */}
        <div className="hidden print:block p-6 text-center">
          <h2 className="text-2xl font-bold">{schoolSettings?.school_name}</h2>
          <p className="text-muted-foreground">{schoolSettings?.address}</p>
          <h3 className="text-xl font-semibold mt-4">Debtors Report</h3>
          <p className="text-sm text-muted-foreground">Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Summary */}
        <div className="p-4 bg-muted border-b">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Debtors</p>
              <p className="text-2xl font-bold">{filteredInvoices.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-2xl font-bold text-orange-600">₦{totalOutstanding.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredInvoices.filter((i) => i.status === "Overdue").length}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Student ID</th>
                <th className="text-left p-3 text-sm font-medium">Name</th>
                <th className="text-left p-3 text-sm font-medium">Class</th>
                <th className="text-left p-3 text-sm font-medium">Invoice No.</th>
                <th className="text-right p-3 text-sm font-medium">Total Amount</th>
                <th className="text-right p-3 text-sm font-medium">Paid</th>
                <th className="text-right p-3 text-sm font-medium">Balance</th>
                <th className="text-center p-3 text-sm font-medium">Due Date</th>
                <th className="text-center p-3 text-sm font-medium print:hidden">Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => {
                const daysOverdue = getDaysOverdue(invoice.due_date)
                const classInfo = invoice.student_enrollments?.[0]?.classes

                return (
                  <tr
                    key={invoice.id}
                    className={`border-b ${invoice.status === "Overdue" ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                  >
                    <td className="p-3 text-sm">{invoice.students.student_id}</td>
                    <td className="p-3 text-sm">
                      {invoice.students.first_name} {invoice.students.last_name}
                    </td>
                    <td className="p-3 text-sm">
                      {classInfo?.name} ({classInfo?.sections?.name})
                    </td>
                    <td className="p-3 text-sm">{invoice.invoice_number}</td>
                    <td className="p-3 text-sm text-right">
                      ₦{Number.parseFloat(invoice.total_amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-right text-green-600">
                      ₦{Number.parseFloat(invoice.amount_paid).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-right font-medium text-orange-600">
                      ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-center">
                      {new Date(invoice.due_date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-3 text-center print:hidden">
                      {daysOverdue > 0 ? (
                        <Badge variant="destructive">{daysOverdue} days</Badge>
                      ) : (
                        <Badge variant="outline">Not overdue</Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t-2 font-semibold bg-muted">
              <tr>
                <td colSpan={6} className="p-3 text-sm">
                  Grand Total
                </td>
                <td className="p-3 text-sm text-right text-orange-600">₦{totalOutstanding.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
