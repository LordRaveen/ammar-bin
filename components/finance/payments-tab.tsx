"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Calendar } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { PaymentsTable } from "@/components/finance/payments-table"
import { PaymentDetailsSheet } from "@/components/finance/payment-details-sheet"
import { format } from "date-fns"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

interface PaymentsTabProps {
  userRole?: "admin" | "accountant" | "parent" | "super_admin"
}

export function PaymentsTab({ userRole = "admin" }: PaymentsTabProps) {
  const [selectedMethod, setSelectedMethod] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createBrowserClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const clearFilters = () => {
    setSelectedMethod("all")
    setSelectedStatus("all")
    setSearchTerm("")
    setDateRange(undefined)
  }

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        {/* Date Range */}
        <div className="flex-1 min-w-[260px]">
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          <DateRangePicker date={dateRange} setDate={setDateRange} />
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Method</label>
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger>
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="pos">POS</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="online">Online</SelectItem>
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
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input
            placeholder="Parent name or reference"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          Clear Filters
        </Button>
        <Button className="gap-2 bg-transparent" size="sm" variant="outline">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Payments Table */}
      {mounted && (
        <PaymentsTable
          key={refreshKey}
          onSelectPayment={setSelectedPayment}
          filters={{
            method: selectedMethod,
            status: selectedStatus,
            search: searchTerm,
            dateFrom: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
            dateTo: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
          }}
        />
      )}

      {/* Payment Details Sheet */}
      {selectedPayment && (
        <PaymentDetailsSheet
          paymentId={selectedPayment}
          open={!!selectedPayment}
          onOpenChange={(open) => {
            if (!open) setSelectedPayment(null)
          }}
          onReversed={handleRefresh}
          userRole={userRole}
        />
      )}
    </div>
  )
}
