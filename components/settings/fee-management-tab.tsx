"use client"

import { FeesTab } from "@/components/finance/fees-tab"

interface FeeManagementTabProps {
  feeCategories?: any[]
  classes?: any[]
  activeSession?: any
  activeTerm?: any
  existingFeeStructures?: any[]
}

export function FeeManagementTab(props: FeeManagementTabProps) {
  return (
    <div className="space-y-4">
      <FeesTab />
    </div>
  )
}
