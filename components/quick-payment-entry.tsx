"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Receipt } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function QuickPaymentEntry() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a student ID or name")
      return
    }

    setSearching(true)

    // Redirect to payment page with search query
    router.push(`/finance/payments/record?search=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Quick Payment Entry
        </CardTitle>
        <CardDescription>Search for a student to record payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Student ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Enter student ID or name to find their pending invoices and record a payment.
        </div>
      </CardContent>
    </Card>
  )
}
