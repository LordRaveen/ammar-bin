"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { FamilyCard } from "@/components/finance/family-card"
import { PaymentBuilder } from "@/components/finance/payment-builder"
import { SearchResultsModal } from "@/components/finance/search-results-modal"
import { DebtorList } from "@/components/finance/debtor-list"
import { RecentCollections } from "@/components/finance/recent-collections"
import { PaymentDetailsSheet } from "@/components/finance/payment-details-sheet"
import { Button } from "@/components/ui/button"

interface CollectPaymentProps {
  userRole?: "admin" | "parent" | "accountant" | "super_admin"
  parentId?: string
  preSelectedStudentId?: string | null
  preSelectedInvoiceId?: string | null
}

export function CollectPayment({
  userRole = "admin",
  parentId,
  preSelectedStudentId,
  preSelectedInvoiceId
}: CollectPaymentProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchPreSelected = async () => {
      if (preSelectedInvoiceId) {
        // Fetch invoice and its items
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .select(`
            *,
            students(id, first_name, last_name, middle_name, student_id)
          `)
          .eq("id", preSelectedInvoiceId)
          .single()

        if (invoice && !invoiceError) {
          setSelectedFamily({
            ...invoice.students,
            type: "student"
          })

          // Fetch invoice items and their allocations to calculate balances
          const [itemsResult, allocationsResult] = await Promise.all([
            supabase.from("invoice_items").select("*").eq("invoice_id", preSelectedInvoiceId),
            supabase.from("payment_allocations").select("*").eq("invoice_id", preSelectedInvoiceId)
          ])

          const items = itemsResult.data || []
          const allocations = allocationsResult.data || []

          if (items.length > 0) {
            const formattedItems = items.map(item => {
              const itemAllocations = allocations.filter(a => a.invoice_item_id === item.id)
              const totalAllocated = itemAllocations.reduce((sum, a) => sum + Number(a.amount), 0)
              const remainingBalance = Number(item.amount) - totalAllocated

              return {
                id: item.id,
                description: item.description,
                balance: remainingBalance,
                status: (remainingBalance <= 0 ? "paid" : (totalAllocated > 0 ? "partial" : "pending")) as any,
                studentId: invoice.students.id,
                studentName: `${invoice.students.first_name} ${invoice.students.last_name}`,
                invoiceId: invoice.id,
              }
            }).filter(item => item.balance > 0) // Only add items that still have a balance

            setSelectedItems(formattedItems)
          }
        }
      } else if (preSelectedStudentId) {
        const { data, error } = await supabase
          .from("students")
          .select("id, first_name, last_name, middle_name, student_id")
          .eq("id", preSelectedStudentId)
          .single()

        if (data && !error) {
          setSelectedFamily({
            ...data,
            type: "student"
          })
        }
      }
    }
    fetchPreSelected()
  }, [preSelectedStudentId, preSelectedInvoiceId, supabase])

  const handleSelectResult = (result: any, type: "parent" | "student") => {
    setSelectedFamily({
      ...result,
      type,
    })
  }

  const handleSelectDebtor = (student: any) => {
    // Treat as selecting a single student
    setSelectedFamily({
      ...student,
      type: "student",
    })
  }

  const handlePaymentSuccess = () => {
    // Clear selected items to reset the payment builder
    setSelectedItems([])
    // Trigger a refresh of the family card data
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <>
      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Search and Family Card */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div
            className="relative cursor-pointer"
            onClick={() => setSearchModalOpen(true)}
          >
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parent or students by name, ID or phone"
              className="pl-10 cursor-pointer"
              readOnly
              onClick={() => setSearchModalOpen(true)}
            />
          </div>

          {/* Family Card or Debtor List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">
                {selectedFamily ? "Family card" : "Outstanding Invoices"}
              </h3>
              {selectedFamily && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFamily(null)}
                  className="h-auto py-0 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear Selection
                </Button>
              )}
            </div>

            {selectedFamily ? (
              <FamilyCard
                selectedFamily={selectedFamily}
                onSelectFamily={setSelectedFamily}
                onItemsSelected={setSelectedItems}
                userRole={userRole}
                parentId={parentId}
                refreshTrigger={refreshTrigger}
              />
            ) : (
              <DebtorList onSelectStudent={handleSelectDebtor} />
            )}
          </div>
        </div>

        {/* Right Column - Payment Builder or Recent Collections */}
        <div>
          <h3 className="font-semibold text-sm mb-3">
            {selectedFamily ? "Payment builder" : "Recent Activity"}
          </h3>

          {selectedFamily ? (
            <PaymentBuilder
              selectedFamily={selectedFamily}
              selectedItems={selectedItems}
              userRole={userRole}
              onPaymentSuccess={handlePaymentSuccess}
            />
          ) : (
            <RecentCollections onViewPayment={setSelectedPaymentId} />
          )}
        </div>
      </div>

      {/* Search Results Modal */}
      <SearchResultsModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelectResult={handleSelectResult}
      />

      {/* Payment Details Sheet */}
      {selectedPaymentId && (
        <PaymentDetailsSheet
          paymentId={selectedPaymentId}
          open={!!selectedPaymentId}
          onOpenChange={(open) => !open && setSelectedPaymentId(null)}
          userRole={userRole}
        />
      )}
    </>
  )
}
