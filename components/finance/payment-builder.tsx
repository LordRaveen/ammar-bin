'use client'

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, InboxIcon } from "lucide-react"

interface InvoiceItem {
  id: string
  description: string
  balance: number
  status: "pending" | "paid" | "partial"
  studentId: string
  studentName: string
  dueDate?: string
}

interface PaymentBuilderProps {
  selectedFamily: any
  selectedItems: InvoiceItem[]
  userRole?: "admin" | "parent" | "accountant"
}

interface PaymentAmount {
  itemId: string
  amount: number
  discount?: number
  discountReason?: string
  waiver?: number
  waiverReason?: string
}

export function PaymentBuilder({
  selectedFamily,
  selectedItems,
  userRole = "admin",
}: PaymentBuilderProps) {
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, PaymentAmount>>({})
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [globalDiscountReason, setGlobalDiscountReason] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pos" | "transfer" | "online">(
    "cash"
  )
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set(selectedItems.map((item) => item.studentId))
  )

  // Group items by student
  const groupedByStudent = useMemo(() => {
    const groups: Record<string, InvoiceItem[]> = {}
    selectedItems.forEach((item) => {
      if (!groups[item.studentId]) {
        groups[item.studentId] = []
      }
      groups[item.studentId].push(item)
    })
    return groups
  }, [selectedItems])

  // Initialize payment amounts for all items
  useMemo(() => {
    const amounts: Record<string, PaymentAmount> = {}
    selectedItems.forEach((item) => {
      if (!paymentAmounts[item.id]) {
        amounts[item.id] = {
          itemId: item.id,
          amount: item.balance,
          discount: 0,
          discountReason: "",
          waiver: 0,
          waiverReason: "",
        }
      } else {
        amounts[item.id] = paymentAmounts[item.id]
      }
    })
    setPaymentAmounts(amounts)
  }, [selectedItems])

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0
    let totalWaiver = 0
    let totalDiscount = 0

    selectedItems.forEach((item) => {
      const amount = paymentAmounts[item.id]
      if (amount) {
        subtotal += amount.amount
        totalWaiver += amount.waiver || 0
        totalDiscount += amount.discount || 0
      }
    })

    const totalToPay = subtotal - totalDiscount - totalWaiver - globalDiscount

    return {
      subtotal,
      discount: totalDiscount + globalDiscount,
      waiver: totalWaiver,
      total: Math.max(0, totalToPay),
    }
  }, [selectedItems, paymentAmounts, globalDiscount])

  const handleAmountChange = (itemId: string, amount: number) => {
    const item = selectedItems.find((i) => i.id === itemId)
    if (!item) return

    // Validate amount doesn't exceed balance
    const maxAmount = item.balance - (paymentAmounts[itemId]?.waiver || 0)
    const validAmount = Math.min(Math.max(0, amount), maxAmount)

    setPaymentAmounts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        amount: validAmount,
      },
    }))
  }

  const handleDiscountChange = (itemId: string, discount: number) => {
    const item = selectedItems.find((i) => i.id === itemId)
    if (!item) return

    // Discount can't exceed the amount
    const maxDiscount = Math.min(item.balance, discount)

    setPaymentAmounts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        discount: Math.max(0, maxDiscount),
      },
    }))
  }

  const handleWaiverChange = (itemId: string, waiver: number) => {
    const item = selectedItems.find((i) => i.id === itemId)
    if (!item) return

    // Waiver can't exceed the amount
    const maxWaiver = item.balance
    setPaymentAmounts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        waiver: Math.max(0, Math.min(item.balance, waiver)),
      },
    }))
  }

  const toggleStudentExpand = (studentId: string) => {
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId)
    } else {
      newExpanded.add(studentId)
    }
    setExpandedStudents(newExpanded)
  }

  if (!selectedFamily || selectedItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <InboxIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="font-medium text-muted-foreground">No items selected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select invoice items to build a payment
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected Items by Student */}
      <div className="space-y-3">
        {Object.entries(groupedByStudent).map(([studentId, items]) => {
          const studentName = items[0]?.studentName || "Unknown Student"
          const isExpanded = expandedStudents.has(studentId)

          return (
            <Card key={studentId} className="overflow-hidden shadow-none border py-0 gap-1">
              {/* Student Header */}
              <div
                onClick={() => toggleStudentExpand(studentId)}
                className="flex items-center justify-between px-4 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <h4 className="font-semibold text-sm">{studentName}</h4>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>

              {/* Student Items */}
              {isExpanded && (
                <CardContent className="p-4 space-y-4">
                  {items.map((item) => {
                    const amount = paymentAmounts[item.id]
                    return (
                      <div key={item.id} className="space-y-2 pb-3 border-b last:border-b-0">
                        {/* Item Display */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Balance: ₦{item.balance.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            ₦{amount?.amount?.toLocaleString() || item.balance.toLocaleString()}
                          </p>
                        </div>

                        {/* Amount Input */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs mb-1 block">Amount</Label>
                            <Input
                              type="number"
                              value={amount?.amount || item.balance}
                              onChange={(e) => handleAmountChange(item.id, Number(e.target.value))}
                              className="text-xs h-8"
                              min="0"
                              max={item.balance}
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">Discount</Label>
                            <Input
                              type="number"
                              value={amount?.discount || 0}
                              onChange={(e) => handleDiscountChange(item.id, Number(e.target.value))}
                              className="text-xs h-8"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">Waiver</Label>
                            <Input
                              type="number"
                              value={amount?.waiver || 0}
                              onChange={(e) => handleWaiverChange(item.id, Number(e.target.value))}
                              className="text-xs h-8"
                              min="0"
                            />
                          </div>
                        </div>

                        {/* Discount Reason */}
                        {(amount?.discount || 0) > 0 && (
                          <div>
                            <Label className="text-xs mb-1 block">Discount Reason</Label>
                            <Input
                              type="text"
                              value={amount?.discountReason || ""}
                              onChange={(e) =>
                                setPaymentAmounts((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    discountReason: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., Early payment, loyalty"
                              className="text-xs h-8"
                            />
                          </div>
                        )}

                        {/* Waiver Reason */}
                        {(amount?.waiver || 0) > 0 && (
                          <div>
                            <Label className="text-xs mb-1 block">Waiver Reason</Label>
                            <Input
                              type="text"
                              value={amount?.waiverReason || ""}
                              onChange={(e) =>
                                setPaymentAmounts((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    waiverReason: e.target.value,
                                  },
                                }))
                              }
                              placeholder="e.g., Financial hardship, scholarship"
                              className="text-xs h-8"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      <Separator />

      {/* Global Discount */}
      <div className="space-y-2">
        <Label className="text-sm">Global Discount (Optional)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={globalDiscount}
            onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value)))}
            placeholder="Amount"
            className="h-8"
            min="0"
          />
          <Input
            type="text"
            value={globalDiscountReason}
            onChange={(e) => setGlobalDiscountReason(e.target.value)}
            placeholder="Reason"
            className="h-8"
          />
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-semibold font-mono">₦{totals.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Discount</span>
          <span className="font-semibold font-mono">₦{totals.discount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Waiver</span>
          <span className="font-semibold font-mono">₦{totals.waiver.toLocaleString()}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-base font-semibold font mono">
          <span>Total to pay</span>
          <span classNAme="font-mono">₦{totals.total.toLocaleString()}</span>
        </div>
      </div>

      <Separator />

      {/* Payment Method */}
      <div className="space-y-2">
        <Label className="text-sm">Payment Method</Label>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { value: "cash", label: "Cash" },
              { value: "pos", label: "POS" },
              { value: "transfer", label: "Transfer" },
              { value: "online", label: "Online" },
            ] as const
          ).map((method) => (
            <Button
              key={method.value}
              variant={paymentMethod === method.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentMethod(method.value)}
              className={
                paymentMethod === method.value
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }
            >
              {method.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-10">
        Confirm & Collect Payment
      </Button>
    </div>
  )
}
