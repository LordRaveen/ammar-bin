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
import { Checkbox } from "@/components/ui/checkbox"
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
    showDrafts?: boolean
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
        // Build the query (no student join needed, will come from allocations)
        let query = supabase
          .from("payments")
          .select(
            `
            *,
            teacher:received_by(first_name, last_name),
            invoices (
              students (
                first_name,
                last_name,
                student_guardians (
                  is_primary,
                  guardian:guardians (
                    first_name,
                    last_name
                  )
                )
              )
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

        // Hide online drafts by default
        if (!filters.showDrafts) {
          // If status filter is 'pending', we still exclude online drafts specifically
          // Logic: Exclude (payment_method = 'online' AND status = 'pending')
          // Using not and and filtering is tricky in Supabase syntax for nested logic, 
          // but we can use or filtering to select everything ELSE.
          // Or just use the fact that drafts always have 'pending' status and 'online' method.

          // Actually, the simplest way is to fetch everything and filter out on client if 
          // complex logic is needed, but let's try to filter on server if possible.
          // Since we want to exclude a specific combination, we can use a raw filter or a simplified approach.

          // Simplified: If not showing drafts, we only show:
          // 1. Status is NOT pending
          // 2. OR Method is NOT online
          query = query.or(`status.neq.pending,payment_method.neq.online`)
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

        // Set payments data and fetch guardian info from allocations for each
        const paginatedData = filteredData
        setPayments(paginatedData)
        setTotalCount(count || 0)

        // Fetch allocations with guardian info for all payments
        const paymentIds = paginatedData.map((p: any) => p.id)
        if (paymentIds.length > 0) {
          const { data: allocationsData } = await supabase
            .from("payment_allocations")
            .select(
              `
              payment_id,
              students(
                first_name,
                last_name,
                student_id,
                student_guardians(
                  is_primary,
                  guardian:guardians(first_name, last_name)
                )
              )
            `
            )
            .in("payment_id", paymentIds)

          // Map allocations to payments for parent name extraction
          const paymentAllocations: Record<string, any[]> = {}
          allocationsData?.forEach((alloc: any) => {
            if (!paymentAllocations[alloc.payment_id]) {
              paymentAllocations[alloc.payment_id] = []
            }
            paymentAllocations[alloc.payment_id].push(alloc.students)
          })

          // Attach allocations to payments for use in rendering
          paginatedData.forEach((p: any) => {
            p._allocations = paymentAllocations[p.id] || []
          })

          setPayments([...paginatedData])
        }
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
  }, [filters.method, filters.status, filters.search, filters.dateFrom, filters.dateTo, filters.showDrafts])

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
    // Get unique guardians from allocations
    const guardians: any[] = []
    payment._allocations?.forEach((student: any) => {
      const studentGuardians = student?.student_guardians || []
      const primary = studentGuardians.find((sg: any) => sg.is_primary)
      if (primary?.guardian && !guardians.find((g) => g.id === primary.guardian.id)) {
        guardians.push(primary.guardian)
      }
    })

    // Fallback: Use invoice relationship if allocations method failed
    if (guardians.length === 0 && payment.invoices?.students?.student_guardians) {
      const sgs = payment.invoices.students.student_guardians
      const primary = sgs.find((sg: any) => sg.is_primary) || sgs[0]
      if (primary?.guardian) guardians.push(primary.guardian)
    }

    if (guardians.length === 0) return "N/A"
    if (guardians.length === 1) {
      return `${guardians[0].first_name} ${guardians[0].last_name}`
    }
    // Multiple guardians - show first + count
    return `${guardians[0].first_name} ${guardians[0].last_name} +${guardians.length - 1}`
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
                <TableHead className="w-[30px] p-2">
                  <Checkbox />
                </TableHead>
                <TableHead className="h-10 py-2 px-1 w-[50px]">SN</TableHead>
                <TableHead className="h-10 py-2 px-1">Ref</TableHead>
                <TableHead className="h-10 py-2 px-1">Parent</TableHead>
                <TableHead className="h-10 py-2 px-1 text-right">Amount</TableHead>
                <TableHead className="h-10 py-2 px-1">Method</TableHead>
                <TableHead className="h-10 py-2 px-1">Status</TableHead>
                <TableHead className="h-10 py-2 px-1 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment, index) => (
                <TableRow
                  key={payment.id}
                  className="hover:bg-muted cursor-pointer h-10"
                  onClick={() => onSelectPayment(payment.id)}
                >
                  <TableCell className="py-2 px-2">
                    <Checkbox onClick={(e) => e.stopPropagation()} />
                  </TableCell>
                  <TableCell className="py-2 px-1 font-mono text-xs text-muted-foreground">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell className="py-2 px-1 font-mono text-xs">
                    {payment.receipt_number || payment.reference_number || `PAY-${payment.id.slice(0, 8)}`}
                  </TableCell>
                  <TableCell className="py-2 px-1 text-sm">{getParentName(payment)}</TableCell>
                  <TableCell className="py-2 px-1 text-right font-semibold font-mono text-sm">
                    ₦{Number.parseFloat(payment.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2 px-1">
                    <Badge
                      variant="outline"
                      className={`${getMethodBadgeColor(payment.payment_method)} text-xs capitalize`}
                    >
                      {payment.payment_method || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-1">
                    <Badge className={`${getStatusBadgeColor(payment.status)} text-xs capitalize`}>
                      {payment.status || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-1 text-right text-sm">
                    {formatDate(payment.payment_date || payment.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {
        totalPages > 1 && (
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
        )
      }
    </div >
  )
}
