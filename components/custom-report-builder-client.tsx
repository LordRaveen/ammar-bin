"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, Play, Trash2, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface CustomReportBuilderClientProps {
  savedReports: any[]
}

const AVAILABLE_TABLES = [
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "classes", label: "Classes" },
  { value: "results", label: "Results" },
  { value: "payments", label: "Payments" },
  { value: "invoices", label: "Invoices" },
  { value: "attendance", label: "Attendance" },
]

const TABLE_COLUMNS = {
  students: ["student_id", "first_name", "last_name", "date_of_birth", "gender", "status", "class_id"],
  teachers: ["staff_id", "first_name", "last_name", "phone", "email", "qualification", "status"],
  classes: ["name", "level", "capacity", "status"],
  results: ["student_id", "subject_id", "total_score", "grade", "session_id"],
  payments: ["amount", "payment_method", "payment_date", "status"],
  invoices: ["invoice_number", "total_amount", "amount_paid", "balance", "status", "due_date"],
  attendance: ["student_id", "date", "status", "time_in", "time_out"],
}

export default function CustomReportBuilderClient({ savedReports }: CustomReportBuilderClientProps) {
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [selectedTable, setSelectedTable] = useState("")
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  const handleColumnToggle = (column: string) => {
    setSelectedColumns((prev) => (prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]))
  }

  const handleSaveReport = async () => {
    if (!reportName || !selectedTable || selectedColumns.length === 0) {
      toast.error("Please fill in all required fields")
      return
    }

    const configuration = {
      table: selectedTable,
      columns: selectedColumns,
    }

    try {
      const response = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          report_type: "custom",
          configuration,
        }),
      })

      if (response.ok) {
        toast.success("Report saved successfully")
        // Reset form
        setReportName("")
        setReportDescription("")
        setSelectedTable("")
        setSelectedColumns([])
      } else {
        toast.error("Failed to save report")
      }
    } catch (error) {
      toast.error("An error occurred while saving the report")
    }
  }

  const handleExecuteReport = async () => {
    if (!selectedTable || selectedColumns.length === 0) {
      toast.error("Please select a table and at least one column")
      return
    }

    setIsExecuting(true)
    try {
      const response = await fetch("/api/reports/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: selectedTable,
          columns: selectedColumns,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Report executed successfully. ${data.count} records found.`)
        // Here you would typically display the results or download them
      } else {
        toast.error("Failed to execute report")
      }
    } catch (error) {
      toast.error("An error occurred while executing the report")
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Tabs defaultValue="builder" className="space-y-6">
      <TabsList>
        <TabsTrigger value="builder">Report Builder</TabsTrigger>
        <TabsTrigger value="saved">Saved Reports ({savedReports.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="builder" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Build New Report</CardTitle>
            <CardDescription>Select data sources and columns to create a custom report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="e.g., Monthly Student Enrollment"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="report-description">Description (Optional)</Label>
                <Input
                  id="report-description"
                  placeholder="Brief description of the report"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Table Selection */}
            <div>
              <Label>Select Data Source</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a table" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TABLES.map((table) => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column Selection */}
            {selectedTable && (
              <div>
                <Label>Select Columns to Include</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-auto">
                  {TABLE_COLUMNS[selectedTable as keyof typeof TABLE_COLUMNS]?.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={column}
                        checked={selectedColumns.includes(column)}
                        onCheckedChange={() => handleColumnToggle(column)}
                      />
                      <label htmlFor={column} className="text-sm font-medium cursor-pointer">
                        {column.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{selectedColumns.length} column(s) selected</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSaveReport}
                disabled={!reportName || !selectedTable || selectedColumns.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Report
              </Button>
              <Button
                variant="outline"
                onClick={handleExecuteReport}
                disabled={!selectedTable || selectedColumns.length === 0 || isExecuting}
              >
                <Play className="h-4 w-4 mr-2" />
                {isExecuting ? "Executing..." : "Execute Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="saved" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
            <CardDescription>Manage and execute your saved custom reports</CardDescription>
          </CardHeader>
          <CardContent>
            {savedReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No saved reports yet</p>
                <p className="text-sm">Create your first custom report to get started</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {report.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.report_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(report.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
