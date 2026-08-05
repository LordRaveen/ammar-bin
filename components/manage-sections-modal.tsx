"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconSettings, IconPencil, IconTrash, IconCheck, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { updateSection, deleteSection } from "@/app/(dashboard)/classes/actions"
import { AddSectionModal } from "./add-section-modal"
import { useEffect } from "react"

interface Section {
  id: string
  name: string
  description: string | null
}

interface ManageSectionsModalProps {
  sections: Section[]
}

export function ManageSectionsModal({ sections }: ManageSectionsModalProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Section[]>(sections)
  const [tempData, setTempData] = useState<Record<string, { name: string; description: string }>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null)
  const router = useRouter()

  useEffect(() => {
    setData(sections)
  }, [sections])

  const handleEdit = (section: Section) => {
    setEditingId(section.id)
    setTempData((prev) => ({
      ...prev,
      [section.id]: {
        name: section.name,
        description: section.description || "",
      },
    }))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTempData({})
  }

  const handleSaveRow = async (sectionId: string) => {
    setLoading(true)
    try {
      const updatedData = tempData[sectionId]
      await updateSection(sectionId, updatedData.name, updatedData.description)

      // Update local state
      setData((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
              ...s,
              name: updatedData.name,
              description: updatedData.description || null,
            }
            : s
        )
      )

      setEditingId(null)
      setTempData({})
      router.refresh()
    } catch (error) {
      console.error("Error saving section:", error)
      alert("Failed to save section. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (section: Section) => {
    setSectionToDelete(section)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!sectionToDelete) return

    setLoading(true)
    try {
      await deleteSection(sectionToDelete.id)
      setData((prev) => prev.filter((s) => s.id !== sectionToDelete.id))
      router.refresh()
    } catch (error) {
      console.error("Error deleting section:", error)
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setSectionToDelete(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <IconSettings className="h-4 w-4" />
          Manage Sections
        </Button>
      </DialogTrigger>
      <DialogContent className="!sm:max-w-3xl w-full max-w-3xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 mb-4">
          <div>
            <DialogTitle>Manage Sections</DialogTitle>
          </div>
          <div className="mr-8">
            <AddSectionModal />
          </div>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12 py-2">SN</TableHead>
                  <TableHead className="py-2">Name</TableHead>
                  <TableHead className="py-2">Description</TableHead>
                  <TableHead className="text-right py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((section, index) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium py-2">{index + 1}</TableCell>
                    <TableCell className="py-2">
                      {editingId === section.id ? (
                        <Input
                          value={tempData[section.id]?.name || ""}
                          onChange={(e) =>
                            setTempData((prev) => ({
                              ...prev,
                              [section.id]: {
                                ...(prev[section.id] || { name: "", description: "" }),
                                name: e.target.value,
                              },
                            }))
                          }
                          className="w-full h-8"
                        />
                      ) : (
                        section.name
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {editingId === section.id ? (
                        <Input
                          value={tempData[section.id]?.description || ""}
                          onChange={(e) =>
                            setTempData((prev) => ({
                              ...prev,
                              [section.id]: {
                                ...(prev[section.id] || { name: "", description: "" }),
                                description: e.target.value,
                              },
                            }))
                          }
                          className="w-full h-8"
                        />
                      ) : (
                        <span className="line-clamp-1">{section.description || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === section.id ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={loading}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Cancel"
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveRow(section.id)}
                              disabled={loading}
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Save"
                            >
                              <IconCheck className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(section)}
                              disabled={loading}
                              className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit"
                            >
                              <IconPencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteClick(section)}
                              disabled={loading}
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No sections available.</div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the section &quot;{sectionToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
