"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaymentsTableProps {
  onSelectPayment: (paymentId: string) => void
  filters: {
    method?: string
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
  }
}

const PAGE_SIZE = 10

export function PaymentsTable({ onSelectPayment, filters }: PaymentsTableProps) {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true)
      try {
        // Build the query
        let query = supabase
          .from("payments")
          .select(
            `
            *,
            students(first_name, last_name, student_id),
            invoices(
              invoice_number,
              parent_id,
              students(
                student_guardians(
                  is_primary,
                  guardian:guardians(first_name, last_name)
                )
              )
            ),
            received_by_user:received_by(
              teachers(first_name, last_name)
            )
          `,
            { count: "exact" }
          )
          .is("deleted_at", null)

        // Apply method filter
        if (filters.method && filters.method !== "all") {
          query = query.ilike("payment_method", filters.method)
        }

        // Apply status filter
        if (filters.status && filters.status !== "all") {
          query = query.ilike("status", filters.status)
        }

        // Apply date range filter
        if (filters.dateFrom) {
          query = query.gte("payment_date", filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte("payment_date", filters.dateTo)
        }

        // Order by newest first and apply pagination
        const from = (currentPage - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        const { data, count, error } = await query
          .order("created_at", { ascending: false })
          .range(from, to)

        if (error) {
          console.error("[v0] Error fetching payments:", error)
        }

        // Filter by search term (parent name or reference) - client side for now
        let filteredData = data || []
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredData = filteredData.filter((payment) => {
            const parentGuardian = payment.invoices?.students?.student_guardians?.find(
              (sg: any) => sg.is_primary
            )
            const parentName = parentGuardian?.guardian
              ? `${parentGuardian.guardian.first_name} ${parentGuardian.guardian.last_name}`.toLowerCase()
              : ""
            const refNumber = (payment.reference_number || "").toLowerCase()
            const receiptNumber = (payment.receipt_number || "").toLowerCase()

            return (
              parentName.includes(searchLower) ||
              refNumber.includes(searchLower) ||
              receiptNumber.includes(searchLower)
            )
          })
        }

        setPayments(filteredData)
        setTotalCount(count || 0)
      } catch (error) {
        console.error("[v0] Error fetching payments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [filters, currentPage, supabase])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.method, filters.status, filters.search, filters.dateFrom, filters.dateTo])

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status?.toLowerCase() || ""
    switch (statusLower) {
      case "completed":
      case "success":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "reversed":
        return "bg-red-100 text-red-800"
      case "failed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMethodBadgeColor = (method: string) => {
    const methodLower = method?.toLowerCase() || ""
    switch (methodLower) {
      case "cash":
        return "bg-green-50 text-green-700 border-green-200"
      case "pos":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "transfer":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "online":
        return "bg-teal-50 text-teal-700 border-teal-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getParentName = (payment: any) => {
    const guardians = payment.invoices?.students?.student_guardians
    if (!guardians) return "N/A"
    const primary = guardians.find((sg: any) => sg.is_primary)
    if (primary?.guardian) {
      return `${primary.guardian.first_name} ${primary.guardian.last_name}`
    }
    // Fallback to first guardian
    const first = guardians[0]
    if (first?.guardian) {
      return `${first.guardian.first_name} ${first.guardian.last_name}`
    }
    return "N/A"
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading payments...
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No payments found
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 py-2 px-3">Ref</TableHead>
                <TableHead className="h-10 py-2 px-3">Parent</TableHead>
                <TableHead className="h-10 py-2 px-3 text-right">Amount</TableHead>
                <TableHead className="h-10 py-2 px-3">Method</TableHead>
                <TableHead className="h-10 py-2 px-3">Status</TableHead>
                <TableHead className="h-10 py-2 px-3">Date</TableHead>
                <TableHead className="h-10 py-2 px-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="hover:bg-muted cursor-pointer h-10"
                  onClick={() => onSelectPayment(payment.id)}
                >
                  <TableCell className="py-2 px-3 font-mono text-xs">
                    {payment.receipt_number || payment.reference_number || `PAY-${payment.id.slice(0, 8)}`}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm">{getParentName(payment)}</TableCell>
                  <TableCell className="py-2 px-3 text-right font-semibold text-sm">
                    ₦{Number.parseFloat(payment.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Badge
                      variant="outline"
                      className={`${getMethodBadgeColor(payment.payment_method)} text-xs capitalize`}
                    >
                      {payment.payment_method || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Badge className={`${getStatusBadgeColor(payment.status)} text-xs capitalize`}>
                      {payment.status || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-sm">
                    {formatDate(payment.payment_date || payment.created_at)}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectPayment(payment.id)
                        }}
                        className="h-8 px-2 text-xs"
                        title="View details"
                      >
                        View
                      </Button>
                      {payment.status?.toLowerCase() !== "reversed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectPayment(payment.id)
                          }}
                          className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Reverse payment"
                        >
                          Reverse
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} payments
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={
                    currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
