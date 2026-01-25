"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconSettings } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  const router = useRouter()

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

  const handleDelete = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return

    setLoading(true)
    try {
      await deleteSection(sectionId)
      setData((prev) => prev.filter((s) => s.id !== sectionId))
      router.refresh()
    } catch (error) {
      console.error("Error deleting section:", error)
      alert("Failed to delete section. Please try again.")
    } finally {
      setLoading(false)
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Sections</DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">SN</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((section, index) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
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
                        className="w-full"
                      />
                    ) : (
                      section.name
                    )}
                  </TableCell>
                  <TableCell>
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
                        className="w-full"
                      />
                    ) : (
                      section.description || "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2 flex justify-end">
                    {editingId === section.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={loading}
                          className="text-gray-500"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveRow(section.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(section)}
                          disabled={loading}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(section.id)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </Dialog>
  )
}
