"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { FamilyCard } from "@/components/finance/family-card"
import { PaymentBuilder } from "@/components/finance/payment-builder"
import { SearchResultsModal } from "@/components/finance/search-results-modal"
import { DebtorList } from "@/components/finance/debtor-list"
import { RecentCollections } from "@/components/finance/recent-collections"

interface CollectPaymentProps {
  userRole?: "admin" | "parent" | "accountant"
  parentId?: string
}

export function CollectPayment({ userRole = "admin", parentId }: CollectPaymentProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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
            <h3 className="font-semibold text-sm mb-3">
              {selectedFamily ? "Family card" : "Outstanding Invoices"}
            </h3>

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
            <RecentCollections />
          )}
        </div>
      </div>

      {/* Search Results Modal */}
      <SearchResultsModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelectResult={handleSelectResult}
      />
    </>
  )
}
