"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Search, AlertCircle } from "lucide-react"

interface DefaultersReportClientProps {
  classes: Array<{ id: string; name: string }>
  activeSession: any
  activeTerm: any
}

interface Defaulter {
  student_id: string
  student_name: string
  class_name: string
  invoice_number: string
  total_amount: number
  amount_paid: number
  balance: number
  due_date: string
  days_overdue: number
}

export function DefaultersReportClient({ classes, activeSession, activeTerm }: DefaultersReportClientProps) {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([])
  const [filteredDefaulters, setFilteredDefaulters] = useState<Defaulter[]>([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchDefaulters()
  }, [])

  useEffect(() => {
    filterDefaulters()
  }, [classFilter, searchQuery, defaulters])

  const fetchDefaulters = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reports/defaulters")
      const data = await response.json()
      setDefaulters(data.defaulters || [])
    } catch (error) {
      console.error("Error fetching defaulters:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterDefaulters = () => {
    let filtered = [...defaulters]

    // Filter by class
    if (classFilter !== "all") {
      filtered = filtered.filter((d) => d.class_name === classFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.student_id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sort by balance (highest first)
    filtered.sort((a, b) => b.balance - a.balance)

    setFilteredDefaulters(filtered)
  }

  const totalOutstanding = filteredDefaulters.reduce((sum, d) => sum + d.balance, 0)

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const csv = [
      [
        "Student ID",
        "Name",
        "Class",
        "Invoice #",
        "Total Amount",
        "Amount Paid",
        "Balance",
        "Due Date",
        "Days Overdue",
      ],
      ...filteredDefaulters.map((d) => [
        d.student_id,
        d.student_name,
        d.class_name,
        d.invoice_number,
        d.total_amount,
        d.amount_paid,
        d.balance,
        d.due_date,
        d.days_overdue,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `defaulters-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <>
      <div className="print:hidden flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="print:mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Defaulters Report</CardTitle>
                <CardDescription>
                  {activeSession?.name} - {activeTerm?.name}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-destructive">₦{totalOutstanding.toLocaleString()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading defaulters...</div>
            ) : filteredDefaulters.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No defaulters found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-center">Days Overdue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDefaulters.map((defaulter, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{defaulter.student_id}</TableCell>
                        <TableCell className="font-medium">{defaulter.student_name}</TableCell>
                        <TableCell>{defaulter.class_name}</TableCell>
                        <TableCell className="font-mono text-sm">{defaulter.invoice_number}</TableCell>
                        <TableCell className="text-right">₦{defaulter.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₦{defaulter.amount_paid.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          ₦{defaulter.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>{defaulter.due_date}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">{defaulter.days_overdue} days</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:mt-8 {
            margin-top: 2rem;
          }
        }
      `}</style>
    </>
  )
}
