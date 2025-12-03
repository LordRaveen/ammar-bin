"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import { recordPettyCashTransaction } from "@/app/(dashboard)/finance/petty-cash/actions"

interface PettyCashManagementProps {
  currentBalance: number
  transactions: any[]
}

export function PettyCashManagement({ currentBalance, transactions }: PettyCashManagementProps) {
  const [transactionType, setTransactionType] = useState<"IN" | "OUT">("OUT")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)

  const handleRecordTransaction = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a description")
      return
    }

    if (transactionType === "OUT" && Number.parseFloat(amount) > currentBalance) {
      toast.error("Insufficient petty cash balance")
      return
    }

    setLoading(true)

    try {
      const result = await recordPettyCashTransaction({
        transactionType,
        amount: Number.parseFloat(amount),
        description,
        transactionDate,
        currentBalance,
      })

      if (result.success) {
        toast.success(result.message)
        // Reset form
        setAmount("")
        setDescription("")
        setTransactionDate(new Date().toISOString().split("T")[0])
        window.location.reload()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to record transaction")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Transaction Form */}
      <Tabs value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="IN" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Add Cash (IN)
          </TabsTrigger>
          <TabsTrigger value="OUT" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Withdraw (OUT)
          </TabsTrigger>
        </TabsList>

        <TabsContent value={transactionType} className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
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
              <Label>Transaction Date *</Label>
              <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description *</Label>
              <Textarea
                placeholder={
                  transactionType === "IN"
                    ? "Describe where the money came from..."
                    : "Describe what the money was used for..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <div className="p-3 bg-muted rounded-lg mb-3">
                <p className="text-sm">
                  <span className="font-medium">Current Balance:</span> ₦{currentBalance.toLocaleString()}
                </p>
                {amount && Number.parseFloat(amount) > 0 && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">New Balance:</span>{" "}
                    <span className={transactionType === "IN" ? "text-green-600" : "text-red-600"}>
                      ₦
                      {(
                        currentBalance +
                        (transactionType === "IN" ? 1 : -1) * Number.parseFloat(amount)
                      ).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>

              <Button onClick={handleRecordTransaction} disabled={loading} className="w-full">
                {loading ? "Recording..." : `Record ${transactionType === "IN" ? "Addition" : "Withdrawal"}`}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Transaction History</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-left p-3 text-sm font-medium">Description</th>
                  <th className="text-right p-3 text-sm font-medium">Amount</th>
                  <th className="text-right p-3 text-sm font-medium">Balance After</th>
                  <th className="text-left p-3 text-sm font-medium">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t">
                    <td className="p-3 text-sm">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                    <td className="p-3 text-sm">
                      {transaction.transaction_type === "IN" ? (
                        <Badge variant="default" className="bg-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          IN
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          OUT
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-sm">{transaction.description}</td>
                    <td
                      className={`p-3 text-sm text-right font-medium ${
                        transaction.transaction_type === "IN" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.transaction_type === "IN" ? "+" : "-"}₦
                      {Number.parseFloat(transaction.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-right font-medium">
                      ₦{Number.parseFloat(transaction.balance_after).toLocaleString()}
                    </td>
                    <td className="p-3 text-sm">
                      {transaction.recorded_by_user?.first_name} {transaction.recorded_by_user?.last_name}
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
