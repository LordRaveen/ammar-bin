"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Download, TrendingUp } from "lucide-react"

interface RevenueReportClientProps {
  sessions: Array<{ id: string; name: string }>
  feeCategories: Array<{ id: string; name: string }>
}

interface RevenueSummary {
  category: string
  invoiced: number
  collected: number
  outstanding: number
  collection_rate: number
}

export function RevenueReportClient({ sessions, feeCategories }: RevenueReportClientProps) {
  const [summary, setSummary] = useState<RevenueSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionFilter, setSessionFilter] = useState<string>(sessions[0]?.id || "")

  useEffect(() => {
    if (sessionFilter) {
      fetchRevenueSummary()
    }
  }, [sessionFilter])

  const fetchRevenueSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/revenue?sessionId=${sessionFilter}`)
      const data = await response.json()
      setSummary(data.summary || [])
    } catch (error) {
      console.error("Error fetching revenue summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalInvoiced = summary.reduce((sum, s) => sum + s.invoiced, 0)
  const totalCollected = summary.reduce((sum, s) => sum + s.collected, 0)
  const totalOutstanding = summary.reduce((sum, s) => sum + s.outstanding, 0)
  const overallCollectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const csv = [
      ["Fee Category", "Invoiced", "Collected", "Outstanding", "Collection Rate (%)"],
      ...summary.map((s) => [s.category, s.invoiced, s.collected, s.outstanding, s.collection_rate.toFixed(2)]),
      ["TOTAL", totalInvoiced, totalCollected, totalOutstanding, overallCollectionRate.toFixed(2)],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `revenue-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <>
      <div className="print:hidden grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Invoiced</CardDescription>
            <CardTitle className="text-2xl">₦{totalInvoiced.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Collected</CardDescription>
            <CardTitle className="text-2xl text-green-600">₦{totalCollected.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Outstanding</CardDescription>
            <CardTitle className="text-2xl text-orange-600">₦{totalOutstanding.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Collection Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              {overallCollectionRate.toFixed(1)}%
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
          <CardTitle>Revenue Summary by Fee Category</CardTitle>
          <CardDescription>{sessions.find((s) => s.id === sessionFilter)?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading revenue summary...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Category</TableHead>
                    <TableHead className="text-right">Invoiced</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Collection Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">₦{item.invoiced.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">₦{item.collected.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-orange-600">₦{item.outstanding.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.collection_rate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">₦{totalInvoiced.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">₦{totalCollected.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-orange-600">₦{totalOutstanding.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{overallCollectionRate.toFixed(1)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
