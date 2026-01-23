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
        if (filters.class && filters.class !== "") {
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
            <TableRow className="hover:bg-transparent">
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
            {invoices.map((invoice) => (
              <TableRow 
                key={invoice.id} 
                className="hover:bg-muted cursor-pointer h-10"
                onClick={() => onSelectInvoice(invoice.id)}
              >
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
                <TableCell className="py-2 px-1 text-sm">{new Date(invoice.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
