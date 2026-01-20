"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Printer } from "lucide-react"
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

export function InvoicesTable({ onSelectInvoice, filters }: InvoicesTableProps) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true)
      try {
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

        // Apply class filter
        if (filters.class) {
          const { data: enrollments } = await supabase
            .from("student_enrollments")
            .select("student_id")
            .eq("class_id", filters.class)

          const studentIds = enrollments?.map((e) => e.student_id) || []
          if (studentIds.length > 0) {
            query = query.in("student_id", studentIds)
          }
        }

        // Apply status filter
        if (filters.status && filters.status !== "All") {
          query = query.eq("status", filters.status)
        }

        // Apply search filter
        if (filters.search) {
          query = query.or(
            `students.first_name.ilike.%${filters.search}%,students.last_name.ilike.%${filters.search}%,students.student_id.ilike.%${filters.search}%`,
          )
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
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>
                  {invoice.students?.first_name} {invoice.students?.last_name}
                </TableCell>
                <TableCell>
                  {invoice.guardians?.[0]?.first_name} {invoice.guardians?.[0]?.last_name}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ₦{Number.parseFloat(invoice.total_amount).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ₦{Number.parseFloat(invoice.amount_paid).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-red-600 font-semibold">
                    ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectInvoice(invoice.id)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Print invoice"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
