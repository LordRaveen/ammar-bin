"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { IconCoin, IconEdit } from "@tabler/icons-react"
import { updateFeeCategory, updateClassFeeStructure } from "@/app/(dashboard)/settings/fees/actions"
import { useToast } from "@/hooks/use-toast"

type ClassFees = Record<string, string> // categoryId -> amount

export function FeeManagementTab({
  feeCategories,
  classes,
  activeSession,
  activeTerm,
  existingFeeStructures,
}: {
  feeCategories: any[]
  classes: any[]
  activeSession: any
  activeTerm: any
  existingFeeStructures: any[]
}) {
  const [editingClassFee, setEditingClassFee] = useState<string | null>(null)
  const [classFees, setClassFees] = useState<Record<string, ClassFees>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    setActiveCategoryIds(new Set(feeCategories.filter((c) => c.is_active).map((c) => c.id)))

    const initialFees: Record<string, ClassFees> = {}

    classes.forEach((classItem) => {
      const fees: ClassFees = {}

      feeCategories.forEach((category) => {
        const existingFee = existingFeeStructures.find(
          (f) => f.class_id === classItem.id && f.fee_category_id === category.id,
        )
        if (existingFee) {
          fees[category.id] = existingFee.amount?.toString() || ""
        }
      })

      initialFees[classItem.id] = fees
    })

    setClassFees(initialFees)
  }, [classes, feeCategories, existingFeeStructures])

  const activeFeeCategories = feeCategories.filter((c) => c.is_active)

  const handleSaveFees = async (classId: string) => {
    if (!activeSession || !activeTerm) return

    setIsSaving(true)
    try {
      const fees = classFees[classId]
      if (!fees) return

      const feeData = []

      for (const category of activeFeeCategories) {
        const amount = fees[category.id]
        if (amount && Number.parseFloat(amount) > 0) {
          feeData.push({
            categoryId: category.id,
            amount: Number.parseFloat(amount),
          })
        }
      }

      if (feeData.length === 0) {
        toast({
          title: "No fees to save",
          description: "Please enter at least one fee amount",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      await updateClassFeeStructure(classId, activeSession.id, activeTerm.id, feeData)

      toast({
        title: "Success",
        description: "Fee structure saved successfully",
      })

      setEditingClassFee(null)
    } catch (error) {
      console.error("[v0] Error saving fees:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save fee structure",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFeeChange = (classId: string, categoryId: string, value: string) => {
    setClassFees((prev) => ({
      ...prev,
      [classId]: {
        ...(prev[classId] || {}),
        [categoryId]: value,
      },
    }))
  }

  const handleCategoryToggle = async (categoryId: string, checked: boolean) => {
    try {
      await updateFeeCategory(categoryId, checked)

      // Update local state immediately for reactive UI
      setActiveCategoryIds((prev) => {
        const newSet = new Set(prev)
        if (checked) {
          newSet.add(categoryId)
        } else {
          newSet.delete(categoryId)
        }
        return newSet
      })

      toast({
        title: "Success",
        description: `Fee category ${checked ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      console.error("[v0] Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update fee category",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCoin className="h-5 w-5" />
            Fee Categories
          </CardTitle>
          <CardDescription>Manage fee types and their activation status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {feeCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-muted-foreground">{category.description}</div>
                  {category.is_recurring && (
                    <Badge variant="outline" className="text-xs">
                      Recurring
                    </Badge>
                  )}
                </div>
                <Switch
                  checked={activeCategoryIds.has(category.id)}
                  onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class Fee Structure</CardTitle>
          <CardDescription>
            Set fees for each class (Session: {activeSession?.name || "Not Set"})
            {activeFeeCategories.length === 0 && (
              <span className="block text-destructive mt-1">
                No active fee categories. Please activate at least one category above.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activeSession || !activeTerm ? (
            <div className="text-center py-6 text-muted-foreground">Please set an active session and term first.</div>
          ) : activeFeeCategories.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Please activate at least one fee category to configure class fees.
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Class Name</TableHead>
                    {activeFeeCategories.map((category) => (
                      <TableHead key={category.id} className="min-w-[120px]">
                        {category.name} (₦)
                      </TableHead>
                    ))}
                    <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">
                        {classItem.name}
                        <span className="text-muted-foreground text-sm ml-2">({classItem.section?.name})</span>
                      </TableCell>
                      {activeFeeCategories.map((category) => (
                        <TableCell key={category.id}>
                          {editingClassFee === classItem.id ? (
                            <Input
                              type="number"
                              placeholder="0"
                              className="w-32"
                              value={classFees[classItem.id]?.[category.id] || ""}
                              onChange={(e) => handleFeeChange(classItem.id, category.id, e.target.value)}
                            />
                          ) : (
                            <span>{classFees[classItem.id]?.[category.id] || "—"}</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        {editingClassFee === classItem.id ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => setEditingClassFee(null)}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => handleSaveFees(classItem.id)} disabled={isSaving}>
                              {isSaving ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setEditingClassFee(classItem.id)}>
                            <IconEdit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other Fees</CardTitle>
          <CardDescription>Configure optional fees (uniform, graduation, excursion, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="uniform_fee">School Uniform</Label>
                <Switch id="uniform_active" />
              </div>
              <Input id="uniform_fee" type="number" placeholder="15000" prefix="₦" />
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="graduation_fee">Graduation</Label>
                <Switch id="graduation_active" />
              </div>
              <Input id="graduation_fee" type="number" placeholder="20000" prefix="₦" />
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="excursion_fee">Excursion</Label>
                <Switch id="excursion_active" />
              </div>
              <Input id="excursion_fee" type="number" placeholder="8000" prefix="₦" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Term Fee Activation</CardTitle>
          <CardDescription>Select which fees are applicable for {activeTerm?.name || "current term"}</CardDescription>
        </CardHeader>
        <CardContent>
          {!activeTerm ? (
            <div className="text-center py-6 text-muted-foreground">Please set an active term first.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch id="tuition_active" defaultChecked />
                <Label htmlFor="tuition_active" className="font-normal">
                  Tuition Fees (Required)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="textbooks_active"
                  defaultChecked={activeTerm?.term_number === 1}
                  disabled={activeTerm?.term_number !== 1}
                />
                <Label htmlFor="textbooks_active" className="font-normal">
                  Textbooks (First Term Only)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="uniform_term_active" />
                <Label htmlFor="uniform_term_active" className="font-normal">
                  School Uniform
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="excursion_term_active" />
                <Label htmlFor="excursion_term_active" className="font-normal">
                  Excursion
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="graduation_term_active" />
                <Label htmlFor="graduation_term_active" className="font-normal">
                  Graduation (Final Year Only)
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
