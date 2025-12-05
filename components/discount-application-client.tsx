"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Percent, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function DiscountApplicationClient({ activeSession, activeTerm }: any) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [discountType, setDiscountType] = useState<"Percentage" | "Fixed" | "Waiver">("Percentage")
  const [discountAmount, setDiscountAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const searchStudent = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Enter search term",
        description: "Please enter a student ID or name",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()

      if (data.students?.length === 1) {
        setSelectedStudent(data.students[0])
        loadInvoices(data.students[0].id)
      } else if (data.students?.length > 1) {
        toast({
          title: "Multiple students found",
          description: "Please be more specific with your search",
        })
      } else {
        toast({
          title: "No students found",
          description: "No student found matching your search",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search for student",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadInvoices = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/invoices`)
      const data = await response.json()

      // Filter to show only pending and partial invoices
      const pendingInvoices =
        data.invoices?.filter((inv: any) => inv.status === "Pending" || inv.status === "Partial") || []

      setInvoices(pendingInvoices)

      if (pendingInvoices.length === 0) {
        toast({
          title: "No pending invoices",
          description: "This student has no pending or partial invoices",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to load invoices",
        variant: "destructive",
      })
    }
  }

  const calculateDiscountedAmount = () => {
    if (!selectedInvoice || !discountAmount) return selectedInvoice?.balance

    const balance = Number.parseFloat(selectedInvoice.balance)
    const discount = Number.parseFloat(discountAmount)

    if (discountType === "Percentage") {
      return balance - (balance * discount) / 100
    } else if (discountType === "Fixed") {
      return balance - discount
    } else {
      return 0 // Waiver
    }
  }

  const applyDiscount = async () => {
    if (!selectedInvoice) {
      toast({
        title: "Select an invoice",
        description: "Please select an invoice to apply the discount",
        variant: "destructive",
      })
      return
    }

    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for the discount",
        variant: "destructive",
      })
      return
    }

    if (discountType !== "Waiver" && !discountAmount) {
      toast({
        title: "Amount required",
        description: "Please enter a discount amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/discounts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          studentId: selectedStudent.id,
          discountType,
          amount: discountType === "Waiver" ? selectedInvoice.balance : discountAmount,
          reason,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Discount applied",
          description: data.requiresApproval
            ? "Discount submitted for admin approval"
            : "Discount applied successfully",
        })

        // Reset form
        setSelectedInvoice(null)
        setDiscountAmount("")
        setReason("")
        loadInvoices(selectedStudent.id)
      } else {
        toast({
          title: "Failed to apply discount",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply discount",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchStudent()}
          />
          <Button onClick={searchStudent} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Selected Student */}
      {selectedStudent && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-2">Selected Student</h3>
          <p className="text-sm">
            {selectedStudent.first_name} {selectedStudent.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{selectedStudent.student_id}</p>
        </div>
      )}

      {/* Invoices List */}
      {invoices.length > 0 && (
        <div className="space-y-2">
          <Label>Select Invoice</Label>
          <div className="space-y-2">
            {invoices.map((invoice: any) => (
              <div
                key={invoice.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedInvoice?.id === invoice.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedInvoice(invoice)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.sessions?.name} - {invoice.terms?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{Number.parseFloat(invoice.balance).toLocaleString()}</p>
                    <Badge variant="outline">{invoice.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discount Form */}
      {selectedInvoice && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">Apply Discount</h3>

          <div className="space-y-2">
            <Label>Discount Type</Label>
            <Select value={discountType} onValueChange={(value: any) => setDiscountType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Percentage">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Percentage Discount
                  </div>
                </SelectItem>
                <SelectItem value="Fixed">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Fixed Amount
                  </div>
                </SelectItem>
                <SelectItem value="Waiver">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Full Waiver (100%)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {discountType !== "Waiver" && (
            <div className="space-y-2">
              <Label>{discountType === "Percentage" ? "Discount Percentage" : "Discount Amount"}</Label>
              <Input
                type="number"
                placeholder={discountType === "Percentage" ? "Enter percentage" : "Enter amount"}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason for Discount/Waiver *</Label>
            <Textarea
              placeholder="Provide a detailed reason for this discount..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Original Balance:</span>
              <span className="font-medium">₦{Number.parseFloat(selectedInvoice.balance).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Discount:</span>
              <span className="text-red-600 font-medium">
                -₦
                {discountType === "Waiver"
                  ? Number.parseFloat(selectedInvoice.balance).toLocaleString()
                  : discountAmount
                    ? (Number.parseFloat(selectedInvoice.balance) - calculateDiscountedAmount()).toLocaleString()
                    : "0"}
              </span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>New Balance:</span>
              <span className="text-green-600">₦{calculateDiscountedAmount()?.toLocaleString() || "0"}</span>
            </div>
          </div>

          {discountType === "Percentage" && Number.parseFloat(discountAmount) > 20 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
              ⚠️ Discounts above 20% require admin approval
            </div>
          )}

          {discountType === "Waiver" && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
              ⚠️ All waivers require admin approval
            </div>
          )}

          <Button onClick={applyDiscount} disabled={isLoading} className="w-full">
            Apply Discount
          </Button>
        </div>
      )}
    </div>
  )
}
