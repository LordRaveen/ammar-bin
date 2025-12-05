"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DiscountManagementClient({ discounts, userRole }: any) {
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isAdmin = userRole === "super_admin" || userRole === "admin"

  const approveDiscount = async (discountId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/discounts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountId }),
      })

      if (response.ok) {
        toast({
          title: "Discount approved",
          description: "The discount has been approved and applied to the invoice",
        })
        window.location.reload()
      } else {
        const data = await response.json()
        toast({
          title: "Approval failed",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve discount",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const rejectDiscount = async (discountId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/discounts/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountId }),
      })

      if (response.ok) {
        toast({
          title: "Discount rejected",
          description: "The discount request has been rejected",
        })
        window.location.reload()
      } else {
        const data = await response.json()
        toast({
          title: "Rejection failed",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject discount",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const pendingDiscounts = discounts.filter((d: any) => !d.approved_by)
  const approvedDiscounts = discounts.filter((d: any) => d.approved_by)

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {isAdmin && pendingDiscounts.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 text-orange-600">Pending Approvals ({pendingDiscounts.length})</h3>
          <div className="space-y-2">
            {pendingDiscounts.map((discount: any) => (
              <div key={discount.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{discount.discount_type}</Badge>
                      <span className="text-sm font-medium">
                        {discount.students.first_name} {discount.students.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">({discount.students.student_id})</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Invoice: {discount.invoices.invoice_number}</p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Amount:</span> ₦
                      {Number.parseFloat(discount.amount).toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Reason:</span> {discount.reason}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Requested by: {discount.created_by_teacher?.first_name} {discount.created_by_teacher?.last_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveDiscount(discount.id)} disabled={isLoading}>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectDiscount(discount.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Discounts */}
      <div>
        <h3 className="font-semibold mb-4">
          {isAdmin ? "Approved Discounts" : "All Discounts"} ({approvedDiscounts.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Student</th>
                <th className="text-left p-2">Invoice</th>
                <th className="text-left p-2">Type</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Reason</th>
                <th className="text-left p-2">Requested By</th>
                <th className="text-left p-2">Approved By</th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {approvedDiscounts.length > 0 ? (
                approvedDiscounts.map((discount: any) => (
                  <tr key={discount.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-sm">{new Date(discount.created_at).toLocaleDateString()}</td>
                    <td className="p-2">
                      <div>
                        <p className="text-sm font-medium">
                          {discount.students.first_name} {discount.students.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{discount.students.student_id}</p>
                      </div>
                    </td>
                    <td className="p-2 text-sm">{discount.invoices.invoice_number}</td>
                    <td className="p-2">
                      <Badge variant="outline">{discount.discount_type}</Badge>
                    </td>
                    <td className="p-2 text-right font-medium">
                      ₦{Number.parseFloat(discount.amount).toLocaleString()}
                    </td>
                    <td className="p-2 text-sm max-w-xs truncate">{discount.reason}</td>
                    <td className="p-2 text-sm">
                      {discount.created_by_teacher?.first_name} {discount.created_by_teacher?.last_name}
                    </td>
                    <td className="p-2 text-sm">
                      {discount.approved_by_teacher?.first_name} {discount.approved_by_teacher?.last_name || "Pending"}
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant={discount.approved_by ? "default" : "secondary"}>
                        {discount.approved_by ? "Approved" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No approved discounts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
