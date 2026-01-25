"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface InvoicesTableProps {
  onSelectInvoice: (invoiceId: string) => void
  filters: {
    session?: string
    term?: string
    class?: string
    status?: string
    search?: string
  }
}

const PAGE_SIZE = 15

export function InvoicesTable({ onSelectInvoice, filters }: InvoicesTableProps) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const supabase = createBrowserClient()

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true)
      try {
        // If search is provided, first get matching student IDs
        let searchStudentIds: string[] | null = null
        if (filters.search && filters.search.trim() !== "") {
          const searchLower = filters.search.toLowerCase()
          const { data: matchingStudents } = await supabase
            .from("students")
            .select("id")
            .or(`first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,student_id.ilike.%${searchLower}%`)

          searchStudentIds = matchingStudents?.map(s => s.id) || []

          // If no students match search, return empty
          if (searchStudentIds.length === 0) {
            setInvoices([])
            setLoading(false)
            return
          }
        }

        let query = supabase
          .from("invoices")
          .select(`
            *,
            students(first_name, last_name, student_id)
          `)
          .is("deleted_at", null)

        // Apply session filter
        if (filters.session) {
          query = query.eq("session_id", filters.session)
        }

        // Apply term filter
        if (filters.term) {
          query = query.eq("term_id", filters.term)
        }

        // Apply class filter (skip if "all" or empty)
        if (filters.class && filters.class !== "" && filters.class !== "all") {
          const { data: enrollments } = await supabase
            .from("student_enrollments")
            .select("student_id")
            .eq("class_id", filters.class)
            .eq("is_active", true)

          const classStudentIds = enrollments?.map((e) => e.student_id) || []
          if (classStudentIds.length > 0) {
            query = query.in("student_id", classStudentIds)
          } else {
            // No students in this class, return empty
            setInvoices([])
            setLoading(false)
            return
          }
        }

        // Apply status filter
        if (filters.status && filters.status !== "All") {
          query = query.eq("status", filters.status)
        }

        // Apply search filter (use pre-fetched student IDs)
        if (searchStudentIds && searchStudentIds.length > 0) {
          query = query.in("student_id", searchStudentIds)
        }

        const { data } = await query.order("created_at", { ascending: false })

        setInvoices(data || [])
      } catch (error) {
        console.error("[v0] Error fetching invoices:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [filters, supabase])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Partial":
        return "bg-blue-100 text-blue-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(invoices.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedInvoices = invoices.slice(startIndex, endIndex)

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading invoices...
        </CardContent>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No invoices found
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 py-2 px-2 w-12">SN</TableHead>
              <TableHead className="h-10 py-2 px-1">Invoice No</TableHead>
              <TableHead className="h-10 py-2 px-1">Student</TableHead>
              <TableHead className="h-10 py-2 px-1 text-right">Total</TableHead>
              <TableHead className="h-10 py-2 px-1 text-right">Paid</TableHead>
              <TableHead className="h-10 py-2 px-1 text-right">Balance</TableHead>
              <TableHead className="h-10 py-2 px-1">Status</TableHead>
              <TableHead className="h-10 py-2 px-1">Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice, index) => (
              <TableRow
                key={invoice.id}
                className="hover:bg-muted cursor-pointer h-10"
                onClick={() => onSelectInvoice(invoice.id)}
              >
                <TableCell className="py-2 px-2 text-muted-foreground text-sm">
                  {startIndex + index + 1}
                </TableCell>
                <TableCell className="py-2 px-1 font-mono text-xs">{invoice.invoice_number}</TableCell>
                <TableCell className="py-2 px-1 text-sm">
                  {invoice.students?.first_name} {invoice.students?.last_name}
                </TableCell>
                <TableCell className="py-2 px-1 text-right font-semibold text-sm font-mono">
                  ₦{Number.parseFloat(invoice.total_amount).toLocaleString()}
                </TableCell>
                <TableCell className="py-2 px-1 text-right text-sm font-mono">
                  ₦{Number.parseFloat(invoice.amount_paid).toLocaleString()}
                </TableCell>
                <TableCell className="py-2 px-1 text-right font-mono">
                  <span className="text-red-300 font-semibold text-sm">
                    ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="py-2 px-1">
                  <Badge className={`${getStatusBadgeColor(invoice.status)} px-1 py-1 text-xs`}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 px-1 text-sm">
                  {new Date(invoice.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, invoices.length)} of {invoices.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

