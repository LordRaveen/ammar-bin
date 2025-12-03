"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Percent, DollarSign } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { applyDiscount } from "@/app/(dashboard)/finance/discounts/actions"

interface DiscountManagementProps {
  existingDiscounts: any[]
}

export function DiscountManagement({ existingDiscounts }: DiscountManagementProps) {
  const [studentSearch, setStudentSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentInvoices, setStudentInvoices] = useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState("")
  const [discountType, setDiscountType] = useState<"Percentage" | "Fixed" | "Waiver">("Fixed")
  const [discountValue, setDiscountValue] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSearchStudent = async () => {
    if (!studentSearch.trim()) {
      toast.error("Please enter a student ID or name")
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("students")
      .select("id, student_id, first_name, last_name")
      .or(`student_id.ilike.%${studentSearch}%,first_name.ilike.%${studentSearch}%,last_name.ilike.%${studentSearch}%`)
      .limit(5)

    if (error) {
      toast.error("Failed to search students")
      return
    }

    setSearchResults(data || [])
  }

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student)
    setSearchResults([])
    setStudentSearch("")

    // Fetch student's invoices with outstanding balance
    const supabase = createClient()
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("student_id", student.id)
      .gt("balance", 0)
      .order("created_at", { ascending: false })

    setStudentInvoices(invoices || [])
  }

  const handleApplyDiscount = async () => {
    if (!selectedInvoice) {
      toast.error("Please select an invoice")
      return
    }

    if (discountType !== "Waiver" && !discountValue) {
      toast.error("Please enter discount amount")
      return
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for the discount")
      return
    }

    setLoading(true)

    try {
      const invoice = studentInvoices.find((inv) => inv.id === selectedInvoice)
      let discountAmount = 0

      if (discountType === "Waiver") {
        discountAmount = Number.parseFloat(invoice.balance)
      } else if (discountType === "Percentage") {
        const percentage = Number.parseFloat(discountValue)
        if (percentage <= 0 || percentage > 100) {
          toast.error("Percentage must be between 1 and 100")
          setLoading(false)
          return
        }
        discountAmount = (Number.parseFloat(invoice.balance) * percentage) / 100
      } else {
        discountAmount = Number.parseFloat(discountValue)
        if (discountAmount <= 0 || discountAmount > Number.parseFloat(invoice.balance)) {
          toast.error("Invalid discount amount")
          setLoading(false)
          return
        }
      }

      const result = await applyDiscount({
        invoiceId: selectedInvoice,
        studentId: selectedStudent.id,
        discountType,
        amount: discountAmount,
        reason,
      })

      if (result.success) {
        toast.success(result.message)
        // Reset form
        setSelectedStudent(null)
        setStudentInvoices([])
        setSelectedInvoice("")
        setDiscountValue("")
        setReason("")
        window.location.reload()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to apply discount")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Search */}
      <div className="space-y-2">
        <Label>Search Student</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter student ID or name..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchStudent()
              }
            }}
          />
          <Button onClick={handleSearchStudent}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg divide-y mt-2">
            {searchResults.map((student) => (
              <button
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className="w-full p-3 text-left hover:bg-accent transition-colors"
              >
                <p className="font-medium">
                  {student.first_name} {student.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{student.student_id}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Student Info */}
      {selectedStudent && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <p className="font-semibold">
            {selectedStudent.first_name} {selectedStudent.last_name}
          </p>
          <p className="text-sm text-muted-foreground">{selectedStudent.student_id}</p>
        </div>
      )}

      {/* Invoice Selection */}
      {studentInvoices.length > 0 && (
        <div className="space-y-2">
          <Label>Select Invoice</Label>
          <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an invoice" />
            </SelectTrigger>
            <SelectContent>
              {studentInvoices.map((invoice) => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} - Balance: ₦{Number.parseFloat(invoice.balance).toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Discount Type */}
      {selectedInvoice && (
        <>
          <div className="space-y-2">
            <Label>Discount Type</Label>
            <Select value={discountType} onValueChange={(value: any) => setDiscountType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Fixed Amount
                  </div>
                </SelectItem>
                <SelectItem value="Percentage">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Percentage
                  </div>
                </SelectItem>
                <SelectItem value="Waiver">Full Waiver (100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discount Value */}
          {discountType !== "Waiver" && (
            <div className="space-y-2">
              <Label>{discountType === "Percentage" ? "Percentage (%)" : "Amount (₦)"}</Label>
              <Input
                type="number"
                placeholder={discountType === "Percentage" ? "Enter percentage" : "Enter amount"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                min="0"
                max={discountType === "Percentage" ? "100" : undefined}
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Discount</Label>
            <Textarea
              placeholder="Explain why this discount is being applied..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Apply Button */}
          <Button onClick={handleApplyDiscount} disabled={loading} className="w-full">
            {loading ? "Applying..." : "Apply Discount"}
          </Button>
        </>
      )}

      {/* Existing Discounts */}
      {existingDiscounts.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Recent Discounts</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Student</th>
                  <th className="text-left p-3 text-sm font-medium">Invoice</th>
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-right p-3 text-sm font-medium">Amount</th>
                  <th className="text-left p-3 text-sm font-medium">Reason</th>
                  <th className="text-left p-3 text-sm font-medium">Created By</th>
                </tr>
              </thead>
              <tbody>
                {existingDiscounts.map((discount) => (
                  <tr key={discount.id} className="border-t">
                    <td className="p-3 text-sm">{new Date(discount.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-sm">
                      {discount.students.first_name} {discount.students.last_name}
                    </td>
                    <td className="p-3 text-sm">{discount.invoices.invoice_number}</td>
                    <td className="p-3 text-sm">
                      <Badge variant="outline">{discount.discount_type}</Badge>
                    </td>
                    <td className="p-3 text-sm text-right font-medium">
                      ₦{Number.parseFloat(discount.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm">{discount.reason}</td>
                    <td className="p-3 text-sm">
                      {discount.created_by_user?.first_name} {discount.created_by_user?.last_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
