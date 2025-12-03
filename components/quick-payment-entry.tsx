"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, User, FileText, DollarSign, Loader2, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  photo_url: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: string
  amount_paid: string
  balance: string
  due_date: string
  status: string
  term: { name: string }
}

export function QuickPaymentEntry() {
  const [searchTerm, setSearchTerm] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [success, setSuccess] = useState(false)

  // Search students
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search required",
        description: "Please enter a student ID or name",
        variant: "destructive",
      })
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      setStudents(data.students || [])

      if (data.students?.length === 0) {
        toast({
          title: "No students found",
          description: "Try a different search term",
        })
      }
    } catch (error) {
      console.error("[v0] Error searching students:", error)
      toast({
        title: "Search failed",
        description: "Could not search for students",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  // Load invoices when student is selected
  useEffect(() => {
    if (selectedStudent) {
      loadInvoices(selectedStudent.id)
    }
  }, [selectedStudent])

  const loadInvoices = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/invoices`)
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error("[v0] Error loading invoices:", error)
      toast({
        title: "Failed to load invoices",
        description: "Could not fetch student invoices",
        variant: "destructive",
      })
    }
  }

  // Auto-fill amount with invoice balance
  useEffect(() => {
    if (selectedInvoice) {
      const invoice = invoices.find((inv) => inv.id === selectedInvoice)
      if (invoice) {
        setAmount(invoice.balance)
      }
    }
  }, [selectedInvoice, invoices])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudent || !selectedInvoice || !amount || !paymentMethod) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/payments/quick-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          invoice_id: selectedInvoice,
          amount: Number.parseFloat(amount),
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          payment_date: new Date().toISOString().split("T")[0],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }

      setSuccess(true)
      toast({
        title: "Payment recorded successfully",
        description: `Receipt: ${data.receipt_number}`,
      })

      // Reset form after 2 seconds
      setTimeout(() => {
        resetForm()
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error recording payment:", error)
      toast({
        title: "Payment failed",
        description: error.message || "Could not record payment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSearchTerm("")
    setStudents([])
    setSelectedStudent(null)
    setInvoices([])
    setSelectedInvoice("")
    setAmount("")
    setPaymentMethod("")
    setReferenceNumber("")
    setSuccess(false)
  }

  if (success) {
    return (
      <Card className="border-green-500">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-bold">Payment Recorded!</h3>
              <p className="text-sm text-muted-foreground">Receipt generated successfully</p>
            </div>
            <Button onClick={resetForm}>Record Another Payment</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Quick Payment Entry
        </CardTitle>
        <CardDescription>Search student and record payment instantly</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Search */}
          <div className="space-y-2">
            <Label>Search Student</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter Student ID or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              />
              <Button type="button" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Student Selection */}
          {students.length > 0 && !selectedStudent && (
            <div className="space-y-2">
              <Label>Select Student</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setSelectedStudent(student)
                      setStudents([])
                    }}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url || "/placeholder.svg"}
                          alt={student.first_name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.student_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Student Info */}
          {selectedStudent && (
            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {selectedStudent.photo_url ? (
                      <img
                        src={selectedStudent.photo_url || "/placeholder.svg"}
                        alt={selectedStudent.first_name}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedStudent.student_id}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Pending Invoices */}
          {selectedStudent && invoices.length > 0 && (
            <div className="space-y-2">
              <Label>
                Select Invoice <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedInvoice} onValueChange={setSelectedInvoice} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose pending invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices
                    .filter((inv) => inv.status !== "Paid")
                    .map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span>{invoice.invoice_number}</span>
                          <span className="text-xs">
                            {invoice.term?.name} - Balance: ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Show selected invoice details */}
              {selectedInvoice && (
                <div className="p-3 border rounded-lg bg-muted/50 text-sm space-y-1">
                  {(() => {
                    const invoice = invoices.find((inv) => inv.id === selectedInvoice)
                    return invoice ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-medium">
                            ₦{Number.parseFloat(invoice.total_amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount Paid:</span>
                          <span className="font-medium">
                            ₦{Number.parseFloat(invoice.amount_paid).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-bold text-primary">
                            ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={invoice.status === "Pending" ? "destructive" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}

          {selectedStudent && invoices.length === 0 && (
            <div className="p-4 border rounded-lg bg-muted text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No pending invoices for this student</p>
            </div>
          )}

          {/* Payment Details */}
          {selectedInvoice && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount (₦) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">
                    Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="POS">POS</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(paymentMethod === "Bank Transfer" || paymentMethod === "POS") && (
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Enter transaction reference"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                  Clear
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
