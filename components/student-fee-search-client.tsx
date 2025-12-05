"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, User, FileText, DollarSign, Download, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Session {
  id: string
  name: string
}

interface Term {
  id: string
  name: string
  session_id: string
}

interface Class {
  id: string
  name: string
  section: { name: string }
}

interface StudentData {
  id: string
  student_id: string
  first_name: string
  last_name: string
  middle_name: string | null
  photo_url: string | null
  class_name: string
  section_name: string
  total_invoiced: string
  total_paid: string
  total_balance: string
  invoices: Array<{
    id: string
    invoice_number: string
    total_amount: string
    amount_paid: string
    balance: string
    status: string
    due_date: string
    session: { name: string }
    term: { name: string }
    created_at: string
  }>
  payments: Array<{
    id: string
    receipt_number: string
    amount: string
    payment_date: string
    payment_method: string
    invoice_number: string
  }>
}

export function StudentFeeSearchClient({
  sessions,
  terms,
  classes,
}: {
  sessions: Session[]
  terms: Term[]
  classes: Class[]
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSession, setSelectedSession] = useState<string>("all")
  const [selectedTerm, setSelectedTerm] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [studentData, setStudentData] = useState<StudentData | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search required",
        description: "Please enter a student ID or name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        session: selectedSession,
        term: selectedTerm,
        class: selectedClass,
        status: statusFilter,
      })

      const response = await fetch(`/api/finance/student-fee-status?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch student data")
      }

      setStudentData(data)
    } catch (error: any) {
      console.error("[v0] Error searching student:", error)
      toast({
        title: "Search failed",
        description: error.message || "Could not find student",
        variant: "destructive",
      })
      setStudentData(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "Pending":
        return <Badge variant="destructive">Pending</Badge>
      case "Partial":
        return <Badge variant="secondary">Partial</Badge>
      case "Overdue":
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredInvoices = studentData?.invoices || []

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Student Search
          </CardTitle>
          <CardDescription>Search by student ID or name to view fee status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label>Student ID or Name</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Student ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Session</Label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="All terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Profile Card */}
      {studentData && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    {studentData.photo_url ? (
                      <img
                        src={studentData.photo_url || "/placeholder.svg"}
                        alt={studentData.first_name}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {studentData.first_name} {studentData.middle_name} {studentData.last_name}
                    </h2>
                    <p className="text-muted-foreground">{studentData.student_id}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {studentData.class_name} - {studentData.section_name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-3xl font-bold text-destructive">
                    ₦{Number.parseFloat(studentData.total_balance).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid gap-4 md:grid-cols-3 mt-6 pt-6 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoiced</p>
                  <p className="text-2xl font-bold">
                    ₦{Number.parseFloat(studentData.total_invoiced).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{Number.parseFloat(studentData.total_paid).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Progress</p>
                  <div className="mt-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(Number.parseFloat(studentData.total_paid) / Number.parseFloat(studentData.total_invoiced)) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(
                        (Number.parseFloat(studentData.total_paid) / Number.parseFloat(studentData.total_invoiced)) *
                        100
                      ).toFixed(1)}
                      % paid
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoices ({filteredInvoices.length})
                  </CardTitle>
                  <CardDescription>Complete invoice history</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Statement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Session/Term</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {invoice.session.name} - {invoice.term.name}
                        </TableCell>
                        <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          ₦{Number.parseFloat(invoice.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₦{Number.parseFloat(invoice.amount_paid).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                        </TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment History ({studentData.payments.length})
              </CardTitle>
              <CardDescription>All recorded payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentData.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No payments recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    studentData.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.receipt_number}</TableCell>
                        <TableCell>{payment.invoice_number}</TableCell>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{Number.parseFloat(payment.amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
