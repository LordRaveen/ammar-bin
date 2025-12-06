"use client"

import { useState } from "react"
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

interface GuardiansClientPageProps {
  initialGuardians: any[]
  initialSearch?: string
}

export function GuardiansClientPage({ initialGuardians, initialSearch }: GuardiansClientPageProps) {
  const [selectedGuardianId, setSelectedGuardianId] = useState<string | null>(null)
  const [editGuardianId, setEditGuardianId] = useState<string | null>(null)
  const [deleteGuardianId, setDeleteGuardianId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(initialSearch || "")
  const [guardians, setGuardians] = useState(initialGuardians)

  const filteredGuardians = guardians.filter((guardian) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      guardian.first_name?.toLowerCase().includes(search) ||
      guardian.last_name?.toLowerCase().includes(search) ||
      guardian.phone?.toLowerCase().includes(search) ||
      guardian.email?.toLowerCase().includes(search)
    )
  })

  const handleEditSuccess = () => {
    window.location.reload()
  }

  const handleDeleteSuccess = () => {
    setGuardians((prev) => prev.filter((g) => g.id !== deleteGuardianId))
    setDeleteGuardianId(null)
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
