"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle2, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { AddGuardianModal } from "@/components/add-guardian-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { GuardianDetailsSheet } from "@/components/guardian-details-sheet"
import { EditGuardianDialog } from "@/components/edit-guardian-dialog"
import { DeleteGuardianDialog } from "@/components/delete-guardian-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GuardiansClientPageProps {
  initialGuardians: any[]
  initialSearch?: string
  totalCount: number
  currentPage: number
  pageSize: number
}

export function GuardiansClientPage({
  initialGuardians,
  initialSearch,
  totalCount,
  currentPage,
  pageSize,
}: GuardiansClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedGuardianId, setSelectedGuardianId] = useState<string | null>(null)
  const [editGuardianId, setEditGuardianId] = useState<string | null>(null)
  const [deleteGuardianId, setDeleteGuardianId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(initialSearch || "")
  const [portalFilter, setPortalFilter] = useState<string>("all")
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const guardians = initialGuardians

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const handlePageSizeChange = (size: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pageSize", size)
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const handleSelectAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {}
    guardians.forEach((guardian) => {
      newSelection[guardian.id] = checked
    })
    setRowSelection(newSelection)
  }

  const handleSelectRow = (guardianId: string, checked: boolean) => {
    setRowSelection((prev) => ({
      ...prev,
      [guardianId]: checked,
    }))
  }

  const selectedCount = Object.values(rowSelection).filter(Boolean).length
  const isAllSelected = guardians.length > 0 && guardians.every((g) => rowSelection[g.id])

  const filteredGuardians = guardians

  const handleEditSuccess = () => {
    window.location.reload()
  }

  const handleDeleteSuccess = () => {
    window.location.reload()
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between gap-4 mt-6 px-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
            guardians
          </span>
          {selectedCount > 0 && <span className="text-sm text-muted-foreground">({selectedCount} selected)</span>}
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
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
            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Guardians</h1>
            <p className="text-muted-foreground">Manage parents and guardians</p>
          </div>
          <AddGuardianModal />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Guardians</CardTitle>
            <CardDescription>View and search all registered guardians</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, phone, or email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Select value={portalFilter} onValueChange={setPortalFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Portal Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Portal Active</SelectItem>
                    <SelectItem value="inactive">Portal Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!filteredGuardians || filteredGuardians.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {searchTerm
                  ? "No guardians found matching your search."
                  : "No guardians registered yet. Add your first guardian to get started."}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-12">SN</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Relationship Type</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Children</TableHead>
                      <TableHead>Portal</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuardians.map((guardian: any, index: number) => {
                      const isSelected = rowSelection[guardian.id] || false
                      return (
                        <TableRow
                          key={guardian.id}
                          onClick={() => setSelectedGuardianId(guardian.id)}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          data-state={isSelected && "selected"}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectRow(guardian.id, !!checked)}
                              aria-label="Select row"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-muted-foreground">
                            {(currentPage - 1) * pageSize + index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {guardian.first_name} {guardian.last_name}
                          </TableCell>
                          <TableCell>{guardian.relationship_type}</TableCell>
                          <TableCell>{guardian.phone}</TableCell>
                          <TableCell>{guardian.email || "—"}</TableCell>
                          <TableCell>{guardian.student_guardians?.[0]?.count || 0} student(s)</TableCell>
                          <TableCell>
                            {guardian.user_id ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditGuardianId(guardian.id)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteGuardianId(guardian.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
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
    </>
  )
}
