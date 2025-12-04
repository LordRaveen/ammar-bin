"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Download, CreditCard, Banknote, Smartphone } from "lucide-react"

interface PaymentCollectionSummaryClientProps {
  sessions: Array<{ id: string; name: string }>
}

interface CollectionData {
  payment_method: string
  count: number
  total_amount: number
}

export function PaymentCollectionSummaryClient({ sessions }: PaymentCollectionSummaryClientProps) {
  const [collections, setCollections] = useState<CollectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionFilter, setSessionFilter] = useState<string>(sessions[0]?.id || "")

  useEffect(() => {
    if (sessionFilter) {
      fetchCollectionSummary()
    }
  }, [sessionFilter])

  const fetchCollectionSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/collection?sessionId=${sessionFilter}`)
      const data = await response.json()
      setCollections(data.collections || [])
    } catch (error) {
      console.error("Error fetching collection summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = collections.reduce((sum, c) => sum + c.total_amount, 0)
  const totalCount = collections.reduce((sum, c) => sum + c.count, 0)

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const csv = [
      ["Payment Method", "Transaction Count", "Total Amount"],
      ...collections.map((c) => [c.payment_method, c.count, c.total_amount]),
      ["TOTAL", totalCount, totalAmount],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `collection-summary-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "Cash":
        return <Banknote className="h-5 w-5" />
      case "Bank Transfer":
        return <CreditCard className="h-5 w-5" />
      case "POS":
        return <Smartphone className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <>
      <div className="print:hidden grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Collections</CardDescription>
            <CardTitle className="text-3xl">₦{totalAmount.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-3xl">{totalCount.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Transaction</CardDescription>
            <CardTitle className="text-3xl">
              ₦{totalCount > 0 ? Math.round(totalAmount / totalCount).toLocaleString() : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="print:hidden flex items-center justify-between">
        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Summary by Payment Method</CardTitle>
          <CardDescription>{sessions.find((s) => s.id === sessionFilter)?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading collection summary...</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Transaction Count</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getPaymentIcon(item.payment_method)}
                            {item.payment_method}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.count.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₦{item.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalAmount > 0 ? ((item.total_amount / totalAmount) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{totalCount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₦{totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
