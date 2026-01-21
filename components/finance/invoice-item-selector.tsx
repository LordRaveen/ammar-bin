"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface InvoiceItem {
  id: string
  invoice_id: string
  fee_category_id: string
  description: string
  amount: number
  student_id: string
  student_name: string
  class_name: string
  invoice_number: string
  balance: number
  amount_paid: number
  due_date: string
  invoice_status: string
}

interface SelectedItem extends InvoiceItem {
  selected: boolean
  payment_amount?: number
}

interface InvoiceItemSelectorProps {
  studentIds: string[]
  onItemsSelected: (items: SelectedItem[]) => void
}

export function InvoiceItemSelector({
  studentIds,
  onItemsSelected,
}: InvoiceItemSelectorProps) {
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(
    new Map()
  )
  const [loading, setLoading] = useState(false)
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(
    new Set()
  )
  const supabase = createBrowserClient()

  // Fetch invoice items for selected students
  useEffect(() => {
    if (!studentIds || studentIds.length === 0) {
      setItems([])
      setSelectedItems(new Map())
      return
    }

    fetchInvoiceItems()
  }, [studentIds])

  // Notify parent component of selected items
  useEffect(() => {
    const selectedArray = Array.from(selectedItems.values())
    onItemsSelected(selectedArray)
  }, [selectedItems, onItemsSelected])

  const fetchInvoiceItems = async () => {
    setLoading(true)
    try {
      // Fetch all invoices and items for selected students
      const { data: invoices, error: invoiceError } = await supabase
        .from("invoices")
        .select(
          `
          id,
          invoice_number,
          student_id,
          balance,
          amount_paid,
          total_amount,
          due_date,
          status,
          students(first_name, last_name),
          student_enrollments(
            class:classes(name)
          ),
          invoice_items(
            id,
            fee_category_id,
            description,
            amount
          )
        `
        )
        .in("student_id", studentIds)
        .is("deleted_at", null)
        .eq("status", "Pending") // Only show pending invoices
        .order("created_at", { ascending: false })

      if (invoiceError) {
        console.error("[v0] Error fetching invoices:", invoiceError)
        toast.error("Failed to load invoices")
        return
      }

      // Transform data into invoice items
      const transformedItems: InvoiceItem[] = []

      invoices?.forEach((invoice: any) => {
        const studentName = `${invoice.students?.first_name} ${invoice.students?.last_name}`
        const className = invoice.student_enrollments?.[0]?.class?.name || "N/A"

        invoice.invoice_items?.forEach((item: any) => {
          transformedItems.push({
            id: item.id,
            invoice_id: invoice.id,
            fee_category_id: item.fee_category_id,
            description: item.description,
            amount: item.amount,
            student_id: invoice.student_id,
            student_name: studentName,
            class_name: className,
            invoice_number: invoice.invoice_number,
            balance: invoice.balance,
            amount_paid: invoice.amount_paid,
            due_date: invoice.due_date,
            invoice_status: invoice.status,
          })
        })
      })

      setItems(transformedItems)
      // Auto-expand first invoice
      if (transformedItems.length > 0) {
        const firstInvoiceId = transformedItems[0].invoice_id
        setExpandedInvoices(new Set([firstInvoiceId]))
      }
    } catch (error) {
      console.error("[v0] Error in fetchInvoiceItems:", error)
      toast.error("Error loading invoice items")
    } finally {
      setLoading(false)
    }
  }

  const toggleInvoice = (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoices)
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId)
    } else {
      newExpanded.add(invoiceId)
    }
    setExpandedInvoices(newExpanded)
  }

  const toggleItemSelection = (item: InvoiceItem) => {
    const itemKey = item.id
    const newSelected = new Map(selectedItems)

    if (newSelected.has(itemKey)) {
      newSelected.delete(itemKey)
    } else {
      newSelected.set(itemKey, {
        ...item,
        selected: true,
        payment_amount: item.amount, // Default to full amount
      })
    }

    setSelectedItems(newSelected)
  }

  const isItemFullyPaid = (item: InvoiceItem) => {
    return Number(item.balance) <= 0
  }

  const isItemSelected = (itemId: string) => {
    return selectedItems.has(itemId)
  }

  // Group items by student then by invoice
  const groupedByStudent = items.reduce(
    (acc, item) => {
      if (!acc[item.student_id]) {
        acc[item.student_id] = {}
      }
      if (!acc[item.student_id][item.invoice_id]) {
        acc[item.student_id][item.invoice_id] = []
      }
      acc[item.student_id][item.invoice_id].push(item)
      return acc
    },
    {} as Record<string, Record<string, InvoiceItem[]>>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No pending invoices to display
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedByStudent).map(([studentId, invoiceMap]) => {
        const studentItem = items.find((i) => i.student_id === studentId)
        if (!studentItem) return null

        return (
          <div key={studentId} className="space-y-3">
            {/* Student Header */}
            <div className="flex items-center gap-2 px-2 py-1">
              <p className="text-sm font-semibold">
                {studentItem.student_name}
              </p>
              <Badge variant="secondary" className="text-xs">
                {studentItem.class_name}
              </Badge>
            </div>

            {/* Invoices */}
            <div className="space-y-2">
              {Object.entries(invoiceMap).map(([invoiceId, invoiceItems]) => {
                const isExpanded = expandedInvoices.has(invoiceId)
                const invoiceNumber = invoiceItems[0]?.invoice_number
                const dueDate = invoiceItems[0]?.due_date

                return (
                  <Card key={invoiceId} className="overflow-hidden">
                    {/* Invoice Header */}
                    <div
                      className="p-3 bg-muted/50 cursor-pointer hover:bg-muted flex items-center justify-between"
                      onClick={() => toggleInvoice(invoiceId)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={`transform transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        >
                          <svg
                            className="h-4 w-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {invoiceNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due:{" "}
                            {new Date(dueDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Items */}
                    {isExpanded && (
                      <CardContent className="p-3 space-y-2 border-t">
                        {invoiceItems.map((item) => {
                          const isFullyPaid = isItemFullyPaid(item)
                          const isSelected = isItemSelected(item.id)

                          return (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-2 rounded border hover:bg-muted/30 transition-colors"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  toggleItemSelection(item)
                                }
                                disabled={isFullyPaid}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {item.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Amount: ₦
                                      {Number(item.amount).toLocaleString()}
                                    </p>
                                  </div>
                                  {isFullyPaid && (
                                    <Badge variant="default" className="text-xs">
                                      Paid
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>
                                    Balance: ₦
                                    {Number(item.balance).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
