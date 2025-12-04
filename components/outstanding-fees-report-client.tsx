"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Search, AlertCircle } from "lucide-react"

interface OutstandingFeesReportClientProps {
  classes: Array<{ id: string; name: string }>
  activeSession: any
  activeTerm: any
}

interface OutstandingFee {
  student_id: string
  student_name: string
  class_name: string
  invoice_number: string
  total_amount: number
  amount_paid: number
  balance: number
  status: string
  due_date: string
}

export function OutstandingFeesReportClient({ classes, activeSession, activeTerm }: OutstandingFeesReportClientProps) {
  const [fees, setFees] = useState<OutstandingFee[]>([])
  const [filteredFees, setFilteredFees] = useState<OutstandingFee[]>([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchOutstandingFees()
  }, [])

  useEffect(() => {
    filterFees()
  }, [classFilter, statusFilter, searchQuery, fees])

  const fetchOutstandingFees = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reports/outstanding")
      const data = await response.json()
      setFees(data.fees || [])
    } catch (error) {
      console.error("Error fetching outstanding fees:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterFees = () => {
    let filtered = [...fees]

    if (classFilter !== "all") {
      filtered = filtered.filter((f) => f.class_name === classFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (f) =>
          f.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.student_id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    filtered.sort((a, b) => b.balance - a.balance)
    setFilteredFees(filtered)
  }

  const totalOutstanding = filteredFees.reduce((sum, f) => sum + f.balance, 0)
  const totalBilled = filteredFees.reduce((sum, f) => sum + f.total_amount, 0)
  const totalPaid = filteredFees.reduce((sum, f) => sum + f.amount_paid, 0)

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const csv = [
      ["Student ID", "Name", "Class", "Invoice #", "Total Amount", "Amount Paid", "Balance", "Status", "Due Date"],
      ...filteredFees.map((f) => [
        f.student_id,
        f.student_name,
        f.class_name,
        f.invoice_number,
        f.total_amount,
        f.amount_paid,
        f.balance,
        f.status,
        f.due_date,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `outstanding-fees-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <>
      <div className="print:hidden grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Billed</CardDescription>
            <CardTitle className="text-2xl">₦{totalBilled.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Paid</CardDescription>
            <CardTitle className="text-2xl text-green-600">₦{totalPaid.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Outstanding</CardDescription>
            <CardTitle className="text-2xl text-orange-600">₦{totalOutstanding.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
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

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Fees Report</CardTitle>
          <CardDescription>
            {activeSession?.name} - {activeTerm?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading outstanding fees...</div>
          ) : filteredFees.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No outstanding fees found</p>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFees.map((fee, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{fee.student_id}</TableCell>
                      <TableCell className="font-medium">{fee.student_name}</TableCell>
                      <TableCell>{fee.class_name}</TableCell>
                      <TableCell className="font-mono text-sm">{fee.invoice_number}</TableCell>
                      <TableCell className="text-right">₦{fee.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₦{fee.amount_paid.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        ₦{fee.balance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fee.status === "Pending" ? "secondary" : "default"}>{fee.status}</Badge>
                      </TableCell>
                      <TableCell>{fee.due_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
