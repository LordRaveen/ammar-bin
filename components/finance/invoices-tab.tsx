"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Download, FileText } from "lucide-react"
import { InvoicesTable } from "@/components/finance/invoices-table"
import { InvoiceDetailsDrawer } from "@/components/finance/invoice-details-drawer"

interface InvoicesTabProps {
  userRole?: "admin" | "accountant" | "parent"
}

export function InvoicesTab({ userRole = "admin" }: InvoicesTabProps) {
  const [selectedSession, setSelectedSession] = useState("2024")
  const [selectedTerm, setSelectedTerm] = useState("1")
  const [selectedClass, setSelectedClass] = useState("jss1")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Filters and Action Bar */}
      <div className="space-y-4">
        {/* Filters Row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Session</label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Term</label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Term 1</SelectItem>
                <SelectItem value="2">Term 2</SelectItem>
                <SelectItem value="3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jss1">JSS 1</SelectItem>
                <SelectItem value="jss2">JSS 2</SelectItem>
                <SelectItem value="jss3">JSS 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Search Student</label>
            <Input
              placeholder="Student name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {userRole === "admin" && (
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Generate Invoice
            </Button>
            <Button className="gap-2 bg-transparent" size="sm" variant="outline">
              <Plus className="h-4 w-4" />
              Generate Group Invoice
            </Button>
            <Button className="gap-2 bg-transparent" size="sm" variant="outline">
              <FileText className="h-4 w-4" />
              Bulk Generate
            </Button>
            <Button className="gap-2 bg-transparent" size="sm" variant="outline">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <InvoicesTable
        onSelectInvoice={setSelectedInvoice}
        filters={{
          session: selectedSession,
          term: selectedTerm,
          class: selectedClass,
          status: selectedStatus,
          search: searchTerm,
        }}
      />

      {/* Invoice Details Drawer */}
      {selectedInvoice && (
        <InvoiceDetailsDrawer
          invoiceId={selectedInvoice}
          open={!!selectedInvoice}
          onOpenChange={(open) => {
            if (!open) setSelectedInvoice(null)
          }}
          userRole={userRole}
        />
      )}
    </div>
  )
}
