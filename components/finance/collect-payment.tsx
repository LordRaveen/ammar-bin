"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"
import { FamilyCard } from "@/components/finance/family-card"
import { PaymentBuilder } from "@/components/finance/payment-builder"

interface CollectPaymentProps {
  userRole?: "admin" | "parent" | "accountant"
  parentId?: string
}

export function CollectPayment({ userRole = "admin", parentId }: CollectPaymentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFamily, setSelectedFamily] = useState<any>(null)

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search parent or students by name, ID or phone"
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Family Card */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Family card</h3>
          <FamilyCard
            searchTerm={searchTerm}
            selectedFamily={selectedFamily}
            onSelectFamily={setSelectedFamily}
            userRole={userRole}
            parentId={parentId}
          />
        </div>

        {/* Right Column - Payment Builder */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Payment builder</h3>
          <PaymentBuilder
            selectedFamily={selectedFamily}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  )
}
