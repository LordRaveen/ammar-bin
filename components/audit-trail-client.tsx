"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Copy, Check, Search, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Sheet State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.performed_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTable = tableFilter === "all" || log.table_name === tableFilter
    const matchesAction = actionFilter === "all" || log.action.toUpperCase() === actionFilter.toUpperCase()

    return matchesSearch && matchesTable && matchesAction
  })

  // Calculate Paginated List
  const totalPages = Math.ceil(filtered.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filtered.length)
  const paginatedLogs = filtered.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handlePageSizeChange = (val: string) => {
    const size = parseInt(val, 10)
    setPageSize(size)
    setCurrentPage(1) // Reset to first page
  }

  const handleCopy = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent row click event
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success("Record ID copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase()
    
    let colorClass = "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-900/30"
    let dotClass = "bg-zinc-500"

    if (act.includes("delete")) {
      colorClass = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30"
      dotClass = "bg-red-500"
    } else if (act.includes("insert") || act.includes("create")) {
      colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30"
      dotClass = "bg-emerald-500"
    } else if (act.includes("update")) {
      colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30"
      dotClass = "bg-blue-500"
    } else if (act.includes("login") || act.includes("signin")) {
      colorClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30"
      dotClass = "bg-purple-500"
    } else if (act.includes("export") || act.includes("restore") || act.includes("approve")) {
      colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30"
      dotClass = "bg-amber-500"
    }

    return (
      <Badge variant="outline" className={cn("text-[10px] font-mono font-medium gap-1.5 px-2 py-0.5 rounded-full capitalize border", colorClass)}>
        <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotClass)} />
        {act}
      </Badge>
    )
  }

  // Calculate Diff between old_values and new_values
  const getChanges = (oldVal: any, newVal: any) => {
    if (!oldVal && !newVal) return null
    const changes: { key: string; old: any; new: any }[] = []
    
    const oldObj = typeof oldVal === "object" && oldVal !== null ? oldVal : {}
    const newObj = typeof newVal === "object" && newVal !== null ? newVal : {}
    
    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
    
    allKeys.forEach((key) => {
      // Ignore timestamp or tracking values that are auto-generated noise if needed
      const o = oldObj[key]
      const n = newObj[key]
      if (JSON.stringify(o) !== JSON.stringify(n)) {
        changes.push({ key, old: o, new: n })
      }
    })
    
    return changes.length > 0 ? changes : null
  }

  const tables = Array.from(new Set(logs.map((log) => log.table_name)))
  const actionsList = Array.from(new Set(logs.map((log) => log.action.toUpperCase())))

  return (
    <Card className="shadow-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
      <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="flex items-center gap-3">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
            Audit Log Records
            <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-4 bg-zinc-100 dark:bg-zinc-800 border-0 text-zinc-600 dark:text-zinc-300">
              {filtered.length}/{logs.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search user, table, record ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8 h-8 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            />
          </div>

          <Select value={tableFilter} onValueChange={(val) => {
            setTableFilter(val)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full sm:w-36">
              <SelectValue placeholder="All Tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Tables</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table} value={table} className="text-xs">
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={(val) => {
            setActionFilter(val)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full sm:w-32">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Actions</SelectItem>
              {actionsList.map((action) => (
                <SelectItem key={action} value={action} className="text-xs capitalize">
                  {action.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/20">
              <TableRow className="h-8 hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 w-16 text-center">SN</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 w-48">Timestamp</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 w-32">Action</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 w-32">Table</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 w-48">Record ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2">Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                    No audit logs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log, idx) => {
                  const serialNumber = startIndex + idx + 1
                  return (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="h-9 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 cursor-pointer text-xs border-b border-zinc-100 dark:border-zinc-900/60 font-mono transition-colors group"
                    >
                      <TableCell className="px-4 py-1 text-center font-bold text-muted-foreground group-hover:text-foreground">
                        {serialNumber}
                      </TableCell>
                      <TableCell className="px-4 py-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                        {format(new Date(log.performed_at), "MMM dd, yyyy hh:mm:ss a")}
                      </TableCell>
                      <TableCell className="px-4 py-1">
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="px-4 py-1 text-foreground font-semibold font-mono">{log.table_name}</TableCell>
                      <TableCell className="px-4 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground truncate max-w-[120px] group-hover:text-foreground">{log.record_id}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleCopy(e, log.record_id)}
                            className="h-5 w-5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedId === log.record_id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-1 text-foreground font-semibold">{log.performed_by_name}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Section */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-4">
              <span>
                Showing <strong className="text-foreground">{startIndex + 1}</strong> to{" "}
                <strong className="text-foreground">{endIndex}</strong> of{" "}
                <strong className="text-foreground">{filtered.length}</strong> entries
              </span>

              <div className="flex items-center gap-2">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-7 w-16 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono">
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
                <span>per page</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-7 w-7 border-zinc-200 dark:border-zinc-800"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              
              <div className="flex items-center gap-1 px-2 font-semibold">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 w-7 border-zinc-200 dark:border-zinc-800"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Audit Log Details Sidepanel */}
      {selectedLog && (
        <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl overflow-hidden">
            <SheetHeader className="p-5 border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-bold text-foreground truncate">Audit Trail Record</SheetTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">{selectedLog.id}</p>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {/* Event Meta Info Card */}
              <div className="p-4 rounded-xl border border-zinc-250 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-950/20 space-y-2.5 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Action</span>
                    <span className="font-semibold text-foreground">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Table Target</span>
                    <span className="font-semibold text-foreground">{selectedLog.table_name}</span>
                  </div>
                </div>
                <Separator className="bg-zinc-200/50 dark:bg-zinc-800/50" />
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Record target ID</span>
                  <span className="font-semibold text-foreground select-all break-all">{selectedLog.record_id}</span>
                </div>
                <Separator className="bg-zinc-200/50 dark:bg-zinc-800/50" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Performed By</span>
                    <span className="font-semibold text-foreground">{selectedLog.performed_by_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Event Timestamp</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(selectedLog.performed_at), "MMMM dd, yyyy hh:mm:ss a")}
                    </span>
                  </div>
                </div>
              </div>

              {/* What Changed Section */}
              {(() => {
                const isUpdate = selectedLog.action.toUpperCase() === "UPDATE"
                if (!isUpdate) return null

                const diff = getChanges(selectedLog.old_values, selectedLog.new_values)
                if (!diff) return null
                
                return (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">What Changed</h4>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950/20 font-mono text-[11px]">
                      <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/20">
                          <TableRow className="h-7 hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                            <TableHead className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5 w-1/3">Field</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5 w-1/3">From</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5 w-1/3">To</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {diff.map((c) => (
                            <TableRow key={c.key} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-900/40">
                              <TableCell className="px-3 py-2 font-bold text-foreground break-all align-top">{c.key}</TableCell>
                              <TableCell className="px-3 py-2 text-red-600 dark:text-red-400 bg-red-500/5 dark:bg-red-950/5 break-all select-all align-top">
                                {c.old === null || c.old === undefined ? <span className="italic text-zinc-400">null</span> : String(c.old)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 dark:bg-emerald-950/5 break-all select-all align-top">
                                {c.new === null || c.new === undefined ? <span className="italic text-zinc-400">null</span> : String(c.new)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              })()}

              {/* Original Payload (Old Values) */}
              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Original Payload (Old Values)</h4>
                  <pre className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl text-[11px] font-mono text-foreground overflow-auto max-h-56 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {/* Modified Payload (New Values) */}
              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modified Payload (New Values)</h4>
                  <pre className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl text-[11px] font-mono text-foreground overflow-auto max-h-56 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </Card>
  )
}
