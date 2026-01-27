"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, RotateCw, CheckCircle2, XCircle } from "lucide-react"

interface FeeCategory {
    id: string
    name: string
    priority: number | null
    is_recurring: boolean
    is_active: boolean
}

export function FeeCategoryManager() {
    const [categories, setCategories] = useState<FeeCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        priority: "0",
        is_recurring: false,
        is_active: true
    })

    const supabase = createBrowserClient()

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name,
                priority: String(editingCategory.priority || 0),
                is_recurring: editingCategory.is_recurring,
                is_active: editingCategory.is_active
            })
        } else {
            setFormData({
                name: "",
                priority: "0",
                is_recurring: false,
                is_active: true
            })
        }
    }, [editingCategory, dialogOpen])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("fee_categories")
                .select("*")
                .order("priority", { ascending: true })
                .order("name", { ascending: true })

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error("Error fetching fee categories:", error)
            toast.error("Failed to load fee categories")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Category name is required")
            return
        }

        setSaving(true)
        try {
            const payload = {
                name: formData.name,
                priority: parseInt(formData.priority) || 0,
                is_recurring: formData.is_recurring,
                is_active: formData.is_active
            }

            if (editingCategory) {
                const { error } = await supabase
                    .from("fee_categories")
                    .update(payload)
                    .eq("id", editingCategory.id)

                if (error) throw error
                toast.success("Category updated successfully")
            } else {
                const { error } = await supabase
                    .from("fee_categories")
                    .insert([payload])

                if (error) throw error
                toast.success("Category created successfully")
            }

            setDialogOpen(false)
            fetchCategories()
        } catch (error) {
            console.error("Error saving category:", error)
            toast.error("Failed to save category")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return

        try {
            const { error } = await supabase
                .from("fee_categories")
                .delete()
                .eq("id", deleteId)

            if (error) {
                // If related to other tables (foreign key constraint), prompt to deactivate instead
                toast.error("Cannot delete category as it may be in use.")
                setDeleteId(null)
                return
            }

            toast.success("Category deleted successfully")
            fetchCategories()
        } catch (error) {
            console.error("Error deleting category:", error)
            toast.error("Failed to delete category")
        } finally {
            setDeleteId(null)
        }
    }

    const openAddDialog = () => {
        setEditingCategory(null)
        setDialogOpen(true)
    }

    const openEditDialog = (category: FeeCategory) => {
        setEditingCategory(category)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium">Fee Categories</h2>
                    <p className="text-sm text-muted-foreground">Manage the types of fees collected (e.g., Tuition, Books, Uniforms)</p>
                </div>
                <Button onClick={openAddDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Category
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Priority</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Recurring</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Loading categories...
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No categories found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="w-[100px] font-mono text-muted-foreground">
                                            {category.priority}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {category.name}
                                        </TableCell>
                                        <TableCell>
                                            {category.is_recurring ? (
                                                <div className="flex items-center gap-2 text-blue-600">
                                                    <RotateCw className="h-4 w-4" />
                                                    <span className="text-xs">Yes</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">No</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {category.is_active ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1.5 text-muted-foreground">
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openEditDialog(category)}
                                                >
                                                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-destructive"
                                                    onClick={() => setDeleteId(category.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Category" : "New Fee Category"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Tuition Fee"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Sorting Priority</Label>
                            <Input
                                id="priority"
                                type="number"
                                placeholder="0"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Lower numbers appear first in lists.</p>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="is_recurring"
                                checked={formData.is_recurring}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: !!checked })}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="is_recurring">Recurring Fee</Label>
                                <p className="text-sm text-muted-foreground">
                                    Check if this fee is charged every term (e.g. Tuition).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="is_active">Active Status</Label>
                                <p className="text-sm text-muted-foreground">
                                    Inactive categories won't appear in selection lists.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the fee category.
                            If it is already in use, you might not be able to delete it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
