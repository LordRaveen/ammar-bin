"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface StudentInvoiceItem {
  id: string
  description: string
  dueDate: string
  balance: number
  status: "Pending" | "Paid" | "Partial" | "Unpaid"
  selected?: boolean
}

interface StudentInvoiceCardProps {
  studentId: string
  studentName: string
  studentClass: string
  invoiceNumber: string
  invoices: StudentInvoiceItem[]
  selectedItemIds: Set<string>
  onItemToggle: (itemId: string) => void
  onSelectAll?: (itemIds: string[], select: boolean) => void
}

export function StudentInvoiceCard({
  studentId,
  studentName,
  studentClass,
  invoiceNumber,
  invoices,
  selectedItemIds,
  onItemToggle,
  onSelectAll,
}: StudentInvoiceCardProps) {
  const unpaidItems = invoices.filter((item) => item.status !== "Paid")
  const allUnpaidSelected = unpaidItems.length > 0 && unpaidItems.every((item) => selectedItemIds.has(item.id))

  const handleStudentCheckAll = () => {
    const unpaidItemIds = unpaidItems.map((item) => item.id)

    if (onSelectAll) {
      // Use the bulk select/deselect callback
      onSelectAll(unpaidItemIds, !allUnpaidSelected)
    } else {
      // Fallback to individual toggles (won't work correctly due to stale state)
      unpaidItems.forEach((item) => {
        const isSelected = selectedItemIds.has(item.id)
        if (allUnpaidSelected && isSelected) {
          onItemToggle(item.id)
        } else if (!allUnpaidSelected && !isSelected) {
          onItemToggle(item.id)
        }
      })
    }
  }

  return (
    <Card className="border py-2 shadow-none">
      <CardContent className="p-0">
        {/* Student Header */}
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              checked={allUnpaidSelected}
              onCheckedChange={handleStudentCheckAll}
              className="h-5 w-5"
              disabled={unpaidItems.length === 0}
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">{studentName} <span className="text-xs text-muted-foreground">{studentClass}</span> </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground font-mono">{invoiceNumber}</p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="overflow-x-auto mt-3">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 ">
                <TableHead className="w-12 h-8"></TableHead>
                <TableHead className="px-2 py-1 text-xs font-semibold font-mono h-8">Invoice item</TableHead>
                <TableHead className="px-2 py-1 text-xs font-semibold text-right font-mono h-8">Due date</TableHead>
                <TableHead className="px-2 py-1 text-xs font-semibold text-right font-mono h-8">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((item) => (
                <TableRow
                  key={item.id}
                  className={`${item.status === "Paid" ? "bg-muted/30" : ""} hover:bg-muted/50`}
                >
                  <TableCell className="w-12 px-2 py-1 ">
                    {item.status !== "Paid" ? (
                      <Checkbox
                        checked={selectedItemIds.has(item.id)}
                        onCheckedChange={() => onItemToggle(item.id)}
                        className="h-4 w-4"
                      />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium px-2 py-1 font-mono">{item.description}</TableCell>
                  <TableCell className="text-sm text-right px-2 py-1 font-mono">
                    {item.status === "Paid" ? (
                      <span className="text-green-600 font-medium">Paid</span>
                    ) : (
                      <span
                        className={`${item.dueDate === "Overdue" ? "text-red-600 font-medium" : ""
                          }`}
                      >
                        {item.dueDate}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-right font-semibold font-mono px-2 py-1 ">
                    ₦{item.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
