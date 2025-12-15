"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle2, Pencil, Trash2 } from "lucide-react"
import { AddGuardianModal } from "@/components/add-guardian-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GuardianDetailsSheet } from "@/components/guardian-details-sheet"
import { EditGuardianDialog } from "@/components/edit-guardian-dialog"
import { DeleteGuardianDialog } from "@/components/delete-guardian-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
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

  const filteredGuardians = guardians

  const handleEditSuccess = () => {
    window.location.reload()
  }

  const handleDeleteSuccess = () => {
    window.location.reload()
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages = []
      const showEllipsis = totalPages > 7

      if (!showEllipsis) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, "ellipsis", totalPages)
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
        } else {
          pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages)
        }
      }

      return pages
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
            guardians
          </span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-24">
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

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => handlePageChange(page as number)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
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
                    {filteredGuardians.map((guardian: any) => (
                      <TableRow key={guardian.id}>
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
                            <Button variant="ghost" size="sm" onClick={() => setSelectedGuardianId(guardian.id)}>
                              View
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditGuardianId(guardian.id)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteGuardianId(guardian.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
