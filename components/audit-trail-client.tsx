"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { FileText, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type AuditLog = {
  id: string
  table_name: string
  record_id: string
  action: string
  performed_by_name: string
  performed_at: string
  old_values: any
  new_values: any
  description: string | null
}

export default function AuditTrailClient({ logs }: { logs: AuditLog[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [tableFilter, setTableFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.performed_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.record_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTable = tableFilter === "all" || log.table_name === tableFilter
    const matchesAction = actionFilter === "all" || log.action === actionFilter

    return matchesSearch && matchesTable && matchesAction
  })

  const actionColors = {
    INSERT: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
  }

  const tables = Array.from(new Set(logs.map((log) => log.table_name)))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Log Records ({filtered.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by user, table, or record ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />

          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">INSERT</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-md overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.performed_at), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action as keyof typeof actionColors]}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[100px]">{log.record_id}</TableCell>
                    <TableCell className="text-sm">{log.performed_by_name}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Action:</span> {log.action}
                              </div>
                              <div>
                                <span className="font-medium">Table:</span> {log.table_name}
                              </div>
                              <div className="col-span-2">
                                <span className="font-medium">Record ID:</span> {log.record_id}
                              </div>
                              <div className="col-span-2">
                                <span className="font-medium">Performed By:</span> {log.performed_by_name}
                              </div>
                              <div className="col-span-2">
                                <span className="font-medium">Timestamp:</span>{" "}
                                {format(new Date(log.performed_at), "MMMM dd, yyyy HH:mm:ss")}
                              </div>
                            </div>

                            {log.old_values && (
                              <div>
                                <h4 className="font-medium mb-2">Old Values</h4>
                                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.new_values && (
                              <div>
                                <h4 className="font-medium mb-2">New Values</h4>
                                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
