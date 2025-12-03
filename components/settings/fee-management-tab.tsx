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

type ClassFees = {
  tuition: string
  textbooks: string
  registration: string
}

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
  const { toast } = useToast()

  useEffect(() => {
    const initialFees: Record<string, ClassFees> = {}

    classes.forEach((classItem) => {
      const tuitionCategory = feeCategories.find((c) => c.name.toLowerCase().includes("school fee"))
      const textbooksCategory = feeCategories.find((c) => c.name.toLowerCase().includes("book"))
      const registrationCategory = feeCategories.find((c) => c.name.toLowerCase().includes("registration"))

      const tuitionFee = existingFeeStructures.find(
        (f) => f.class_id === classItem.id && f.fee_category_id === tuitionCategory?.id,
      )
      const textbookFee = existingFeeStructures.find(
        (f) => f.class_id === classItem.id && f.fee_category_id === textbooksCategory?.id,
      )
      const registrationFee = existingFeeStructures.find(
        (f) => f.class_id === classItem.id && f.fee_category_id === registrationCategory?.id,
      )

      initialFees[classItem.id] = {
        tuition: tuitionFee?.amount?.toString() || "",
        textbooks: textbookFee?.amount?.toString() || "",
        registration: registrationFee?.amount?.toString() || "",
      }
    })

    setClassFees(initialFees)
  }, [classes, feeCategories, existingFeeStructures])

  const handleSaveFees = async (classId: string) => {
    if (!activeSession || !activeTerm) return

    setIsSaving(true)
    try {
      const fees = classFees[classId]
      if (!fees) return

      console.log("[v0] Saving fees for class:", classId)
      console.log("[v0] Active session:", activeSession)
      console.log("[v0] Active term:", activeTerm)
      console.log("[v0] Fee data:", fees)

      const tuitionCategory = feeCategories.find((c) => c.name.toLowerCase().includes("school fee"))
      const textbooksCategory = feeCategories.find((c) => c.name.toLowerCase().includes("book"))
      const registrationCategory = feeCategories.find((c) => c.name.toLowerCase().includes("registration"))

      console.log("[v0] Categories found:", { tuitionCategory, textbooksCategory, registrationCategory })

      const feeData = []

      if (fees.tuition && tuitionCategory) {
        feeData.push({
          categoryId: tuitionCategory.id,
          amount: Number.parseFloat(fees.tuition),
        })
      }

      if (fees.textbooks && textbooksCategory) {
        feeData.push({
          categoryId: textbooksCategory.id,
          amount: Number.parseFloat(fees.textbooks),
        })
      }

      if (fees.registration && registrationCategory) {
        feeData.push({
          categoryId: registrationCategory.id,
          amount: Number.parseFloat(fees.registration),
        })
      }

      console.log("[v0] Final fee data to save:", feeData)

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

  const handleFeeChange = (classId: string, field: keyof ClassFees, value: string) => {
    setClassFees((prev) => ({
      ...prev,
      [classId]: {
        ...(prev[classId] || { tuition: "", textbooks: "", registration: "" }),
        [field]: value,
      },
    }))
  }

  return (
    <div className="space-y-4">
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
                  checked={category.is_active}
                  onCheckedChange={(checked) => updateFeeCategory(category.id, checked)}
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
            Set tuition and other fees for each class (Session: {activeSession?.name || "Not Set"})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activeSession || !activeTerm ? (
            <div className="text-center py-6 text-muted-foreground">Please set an active session and term first.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Tuition (₦)</TableHead>
                  <TableHead>Textbooks (₦)</TableHead>
                  <TableHead>Registration (₦)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">
                      {classItem.name}
                      <span className="text-muted-foreground text-sm ml-2">({classItem.section?.name})</span>
                    </TableCell>
                    <TableCell>
                      {editingClassFee === classItem.id ? (
                        <Input
                          type="number"
                          placeholder="50000"
                          className="w-32"
                          value={classFees[classItem.id]?.tuition || ""}
                          onChange={(e) => handleFeeChange(classItem.id, "tuition", e.target.value)}
                        />
                      ) : (
                        <span>{classFees[classItem.id]?.tuition || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingClassFee === classItem.id ? (
                        <Input
                          type="number"
                          placeholder="5000"
                          className="w-32"
                          value={classFees[classItem.id]?.textbooks || ""}
                          onChange={(e) => handleFeeChange(classItem.id, "textbooks", e.target.value)}
                        />
                      ) : (
                        <span>{classFees[classItem.id]?.textbooks || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingClassFee === classItem.id ? (
                        <Input
                          type="number"
                          placeholder="10000"
                          className="w-32"
                          value={classFees[classItem.id]?.registration || ""}
                          onChange={(e) => handleFeeChange(classItem.id, "registration", e.target.value)}
                        />
                      ) : (
                        <span>{classFees[classItem.id]?.registration || "—"}</span>
                      )}
                    </TableCell>
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
