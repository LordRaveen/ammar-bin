"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { FamilyCard } from "@/components/finance/family-card"
import { PaymentBuilder } from "@/components/finance/payment-builder"
import { SearchResultsModal } from "@/components/finance/search-results-modal"

interface CollectPaymentProps {
  userRole?: "admin" | "parent" | "accountant"
  parentId?: string
}

export function CollectPayment({ userRole = "admin", parentId }: CollectPaymentProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<any>(null)

  const handleSelectResult = (result: any, type: "parent" | "student") => {
    setSelectedFamily({
      ...result,
      type,
    })
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

          {/* Family Card */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Family card</h3>
            <FamilyCard
              selectedFamily={selectedFamily}
              onSelectFamily={setSelectedFamily}
              userRole={userRole}
              parentId={parentId}
            />
          </div>
        </div>

        {/* Right Column - Payment Builder */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Payment builder</h3>
          <PaymentBuilder
            selectedFamily={selectedFamily}
            userRole={userRole}
          />
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
