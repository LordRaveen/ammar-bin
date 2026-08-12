"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Search,
  CheckCircle2,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  SlidersHorizontal,
  X,
  Plus,
  FileSpreadsheet,
} from "lucide-react"
import { AddGuardianModal } from "@/components/add-guardian-modal"
import { BulkAddGuardiansModal } from "@/components/bulk-add-guardians-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { GuardianDetailsSheet } from "@/components/guardian-details-sheet"
import { EditGuardianDialog } from "@/components/edit-guardian-dialog"
import { DeleteGuardianDialog } from "@/components/delete-guardian-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface GuardiansClientPageProps {
  initialGuardians: any[]
  initialSearch?: string
  totalCount?: number
}

interface Filters {
  relationshipType: string // "all" | relationship
  hasWhatsapp: string // "all" | "yes" | "no"
  hasChildren: string // "all" | "yes" | "no"
}

const DEFAULT_FILTERS: Filters = {
  relationshipType: "all",
  hasWhatsapp: "all",
  hasChildren: "all",
}

export function GuardiansClientPage({ initialGuardians, initialSearch = "" }: GuardiansClientPageProps) {
  const [guardians, setGuardians] = useState(initialGuardians)
  const [selectedGuardianId, setSelectedGuardianId] = useState<string | null>(null)
  const [editGuardianId, setEditGuardianId] = useState<string | null>(null)
  const [deleteGuardianId, setDeleteGuardianId] = useState<string | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [filterTab, setFilterTab] = useState<string>("all")
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // KPI Calculations
  const totalGuardians = guardians.length
  const activePortalCount = guardians.filter((g) => g.user_id).length
  const inactivePortalCount = totalGuardians - activePortalCount
  const totalChildrenLinks = guardians.reduce((sum, g) => sum + (g.student_guardians?.[0]?.count || 0), 0)

  const filteredGuardians = useMemo(() => {
    return guardians.filter((guardian) => {
      const search = searchTerm.toLowerCase()

      // Search matching
      const matchesSearch =
        !searchTerm ||
        guardian.first_name?.toLowerCase().includes(search) ||
        guardian.last_name?.toLowerCase().includes(search) ||
        guardian.phone?.includes(search) ||
        guardian.email?.toLowerCase().includes(search)

      // Tab status matching
      let matchesTab = true
      if (filterTab === "active") {
        matchesTab = !!guardian.user_id
      } else if (filterTab === "inactive") {
        matchesTab = !guardian.user_id
      }

      // Relationship Type matching
      const matchesRelationship =
        filters.relationshipType === "all" ||
        guardian.relationship_type?.toLowerCase() === filters.relationshipType.toLowerCase()

      // WhatsApp matching
      let matchesWhatsapp = true
      if (filters.hasWhatsapp !== "all") {
        const hasWa = !!guardian.whatsapp_number
        matchesWhatsapp = filters.hasWhatsapp === "yes" ? hasWa : !hasWa
      }

      // Children connection matching
      let matchesChildren = true
      if (filters.hasChildren !== "all") {
        const count = guardian.student_guardians?.[0]?.count || 0
        matchesChildren = filters.hasChildren === "yes" ? count > 0 : count === 0
      }

      return matchesSearch && matchesTab && matchesRelationship && matchesWhatsapp && matchesChildren
    })
  }, [guardians, searchTerm, filterTab, filters])

  const totalPages = Math.max(1, Math.ceil(filteredGuardians.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedGuardians = filteredGuardians.slice(startIndex, endIndex)

  const activeFilterCount = Object.entries(filters).filter(([_, v]) => v !== "all").length

  useEffect(() => {
    setCurrentPage(1)
    setRowSelection({})
  }, [searchTerm, filterTab, filters])

  const handlePageSizeChange = (size: string) => {
    setRowsPerPage(Number(size))
    setCurrentPage(1)
  }

  const handleSelectAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {}
    if (checked) {
      paginatedGuardians.forEach((guardian) => {
        newSelection[guardian.id] = true
      })
    }
    setRowSelection(newSelection)
  }

  const handleSelectRow = (guardianId: string, checked: boolean) => {
    setRowSelection((prev) => ({
      ...prev,
      [guardianId]: checked,
    }))
  }

  const selectedCount = Object.values(rowSelection).filter(Boolean).length
  const allSelected = paginatedGuardians.length > 0 && paginatedGuardians.every((g) => rowSelection[g.id])

  const handleEditSuccess = () => {
    window.location.reload()
  }

  const handleDeleteSuccess = () => {
    window.location.reload()
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between gap-4 mt-6 px-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
            Showing {filteredGuardians.length === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(endIndex, filteredGuardians.length)} of {filteredGuardians.length} guardians
          </span>
          {selectedCount > 0 && <span className="text-xs text-emerald-600 font-semibold">({selectedCount} selected)</span>}
          <Select value={rowsPerPage.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-28 h-8 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 15, 20, 50].map((size) => (
                <SelectItem key={size} value={size.toString()} className="text-xs">
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-3">
        {/* Header Section */}
        <div className="flex mt-3 flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight">Guardians Directory</h1>
            <p className="text-xs text-muted-foreground">
              Manage parent and guardian profiles, portal accounts, and family student links
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setBulkImportOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs font-semibold border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Bulk Import
            </Button>
            <AddGuardianModal />
          </div>
        </div>

        {/* KPI Row */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="p-3 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Total Guardians
              </span>
              <p className="text-xl font-bold mt-0.5">{totalGuardians}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground/40" />
          </div>

          <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Portal Active
              </span>
              <p className="text-xl font-bold mt-0.5 text-emerald-700 dark:text-emerald-300">{activePortalCount}</p>
            </div>
            <UserCheck className="h-5 w-5 text-emerald-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-zinc-500/5 border-zinc-500/20 text-zinc-950 dark:text-zinc-100 flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-400 block">
                Portal Inactive
              </span>
              <p className="text-xl font-bold mt-0.5 text-zinc-700 dark:text-zinc-300">{inactivePortalCount}</p>
            </div>
            <UserX className="h-5 w-5 text-zinc-500/40" />
          </div>

          <div className="p-3 rounded-xl border bg-purple-500/5 border-purple-500/20 text-purple-950 dark:text-purple-100 flex items-center justify-between min-w-[150px] sm:min-w-0 shrink-0 sm:shrink">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                Student Links
              </span>
              <p className="text-xl font-bold mt-0.5 text-purple-700 dark:text-purple-300">{totalChildrenLinks}</p>
            </div>
            <Users className="h-5 w-5 text-purple-500/40" />
          </div>
        </div>

        {/* Main Content Area card */}
        <Card className="shadow-none border">
          <CardContent className="p-3.5 space-y-3">
            {/* Tab Filters and Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Quick status tabs */}
              <div className="flex h-9 items-center rounded-lg border bg-muted/40 p-1 gap-1">
                {[
                  { id: "all", label: `All (${guardians.length})` },
                  { id: "active", label: `Portal Active (${activePortalCount})` },
                  { id: "inactive", label: `Portal Inactive (${inactivePortalCount})` },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterTab(item.id)}
                    className={cn(
                      "h-full px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                      filterTab === item.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search name, phone, email..."
                    className="pl-8 h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filters Popover */}
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Filters</span>
                      {activeFilterCount > 0 && (
                        <Badge className="ml-1.5 h-5 px-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl" align="end">
                    <div className="p-4 pb-2 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950 rounded-t-xl">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Filter Options</h4>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          onClick={clearFilters}
                          className="h-6 px-1.5 text-[10px] font-semibold text-red-650 hover:bg-red-500/10 gap-1"
                        >
                          <X className="h-3 w-3" />
                          <span>Clear</span>
                        </Button>
                      )}
                    </div>
                    <Separator className="bg-zinc-100 dark:bg-zinc-900" />
                    <div className="p-4 space-y-4">
                      {/* Relationship type */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pop_relation" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Relationship</Label>
                        <Select
                          value={filters.relationshipType}
                          onValueChange={(val) => setFilters((p) => ({ ...p, relationshipType: val }))}
                        >
                          <SelectTrigger id="pop_relation" className="h-8 text-xs bg-white dark:bg-zinc-950">
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs">All types</SelectItem>
                            <SelectItem value="Father" className="text-xs">Father</SelectItem>
                            <SelectItem value="Mother" className="text-xs">Mother</SelectItem>
                            <SelectItem value="Guardian" className="text-xs">Guardian</SelectItem>
                            <SelectItem value="Other" className="text-xs">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* WhatsApp Status */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pop_wa" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp Number</Label>
                        <Select
                          value={filters.hasWhatsapp}
                          onValueChange={(val) => setFilters((p) => ({ ...p, hasWhatsapp: val }))}
                        >
                          <SelectTrigger id="pop_wa" className="h-8 text-xs bg-white dark:bg-zinc-950">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs">All</SelectItem>
                            <SelectItem value="yes" className="text-xs">Registered WhatsApp</SelectItem>
                            <SelectItem value="no" className="text-xs">No WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Children Links */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pop_children" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Student Connections</Label>
                        <Select
                          value={filters.hasChildren}
                          onValueChange={(val) => setFilters((p) => ({ ...p, hasChildren: val }))}
                        >
                          <SelectTrigger id="pop_children" className="h-8 text-xs bg-white dark:bg-zinc-950">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs">All connections</SelectItem>
                            <SelectItem value="yes" className="text-xs">Has connected students</SelectItem>
                            <SelectItem value="no" className="text-xs">No connected students</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Table */}
            {filteredGuardians.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground bg-zinc-50/50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl">
                No guardians found matching current query filters.
              </div>
            ) : (
              <>
                <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
                  <Table>
                    <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                      <TableRow className="border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-bold uppercase tracking-wider">
                        <TableHead className="w-12 h-9">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
                          />
                        </TableHead>
                        <TableHead className="w-12 h-9">SN</TableHead>
                        <TableHead className="h-9">Name</TableHead>
                        <TableHead className="h-9">Relation</TableHead>
                        <TableHead className="h-9">Phone</TableHead>
                        <TableHead className="h-9">Email</TableHead>
                        <TableHead className="h-9">Linked Kids</TableHead>
                        <TableHead className="h-9">Portal Access</TableHead>
                        <TableHead className="text-right h-9 pr-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedGuardians.map((guardian: any, index: number) => {
                        const isSelected = rowSelection[guardian.id] || false
                        const childrenCount = guardian.student_guardians?.[0]?.count || 0
                        return (
                          <TableRow
                            key={guardian.id}
                            onClick={() => setSelectedGuardianId(guardian.id)}
                            className="cursor-pointer border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20 text-xs transition-colors"
                            data-state={isSelected && "selected"}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()} className="py-2.5">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectRow(guardian.id, !!checked)}
                                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground py-2.5">{startIndex + index + 1}</TableCell>
                            <TableCell className="font-bold py-2.5">
                              {guardian.first_name} {guardian.last_name}
                            </TableCell>
                            <TableCell className="font-semibold py-2.5">
                              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-zinc-50/20 text-muted-foreground border-zinc-200">
                                {guardian.relationship_type || "Other"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold py-2.5">{guardian.phone}</TableCell>
                            <TableCell className="text-muted-foreground py-2.5">{guardian.email || "—"}</TableCell>
                            <TableCell className="font-bold py-2.5">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-emerald-500" />
                                <span>{childrenCount} student(s)</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5">
                              {guardian.user_id ? (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-650 dark:text-emerald-400 border-emerald-500/20 font-medium gap-1">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-zinc-50 dark:bg-zinc-950 text-muted-foreground border-zinc-200 dark:border-zinc-800">
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-2.5 pr-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md"
                                  onClick={() => setEditGuardianId(guardian.id)}
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-red-500/10 rounded-md"
                                  onClick={() => setDeleteGuardianId(guardian.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600 hover:text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {renderPagination()}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <GuardianDetailsSheet
        guardianId={selectedGuardianId}
        open={!!selectedGuardianId}
        onOpenChange={(open) => {
          if (!open) setSelectedGuardianId(null)
        }}
      />

      <EditGuardianDialog
        guardianId={editGuardianId}
        open={!!editGuardianId}
        onOpenChange={(open) => {
          if (!open) setEditGuardianId(null)
        }}
        onSuccess={handleEditSuccess}
      />

      <DeleteGuardianDialog
        guardianId={deleteGuardianId}
        open={!!deleteGuardianId}
        onOpenChange={(open) => {
          if (!open) setDeleteGuardianId(null)
        }}
        onSuccess={handleDeleteSuccess}
      />

      <BulkAddGuardiansModal
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onSuccess={() => window.location.reload()}
      />
    </>
  )
}
