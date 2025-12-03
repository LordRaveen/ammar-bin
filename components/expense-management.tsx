"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { recordExpense } from "@/app/(dashboard)/finance/expenses/actions"

interface ExpenseManagementProps {
  categories: any[]
  expenses: any[]
}

export function ExpenseManagement({ categories, expenses }: ExpenseManagementProps) {
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank Transfer" | "Cheque">("Cash")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)

  const handleRecordExpense = async () => {
    if (!categoryId) {
      toast.error("Please select a category")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a description")
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setLoading(true)

    try {
      const result = await recordExpense({
        categoryId,
        description,
        amount: Number.parseFloat(amount),
        paymentMethod,
        paymentDate,
      })

      if (result.success) {
        toast.success(result.message)
        // Reset form
        setCategoryId("")
        setDescription("")
        setAmount("")
        setPaymentDate(new Date().toISOString().split("T")[0])
        window.location.reload()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to record expense")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Expense Form */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Amount (₦) *</Label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Method *</Label>
          <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Payment Date *</Label>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Description *</Label>
          <Textarea
            placeholder="Describe the expense..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <Button onClick={handleRecordExpense} disabled={loading} className="w-full">
            {loading ? "Recording..." : "Record Expense"}
          </Button>
        </div>
      </div>

      {/* Recent Expenses */}
      {expenses.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Recent Expenses</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Category</th>
                  <th className="text-left p-3 text-sm font-medium">Description</th>
                  <th className="text-left p-3 text-sm font-medium">Method</th>
                  <th className="text-right p-3 text-sm font-medium">Amount</th>
                  <th className="text-left p-3 text-sm font-medium">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-t">
                    <td className="p-3 text-sm">{new Date(expense.payment_date).toLocaleDateString()}</td>
                    <td className="p-3 text-sm">
                      <Badge variant="outline">{expense.expense_categories?.name}</Badge>
                    </td>
                    <td className="p-3 text-sm">{expense.description}</td>
                    <td className="p-3 text-sm">{expense.payment_method}</td>
                    <td className="p-3 text-sm text-right font-medium text-red-600">
                      ₦{Number.parseFloat(expense.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm">
                      {expense.recorded_by_user?.first_name} {expense.recorded_by_user?.last_name}
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
