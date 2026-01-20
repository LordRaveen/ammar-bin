"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface FeeStructure {
  id?: string
  fee_category_id: string
  amount: number
  due_date: string
  gender_specific: string | null
  active: boolean
  is_mandatory: boolean
}

interface FeeStructureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingFee: FeeStructure | null
  session: string
  term: string
  classId: string
  onSave: () => void
}

interface FeeCategory {
  id: string
  name: string
}

export function FeeStructureModal({
  open,
  onOpenChange,
  editingFee,
  session,
  term,
  classId,
  onSave,
}: FeeStructureModalProps) {
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FeeStructure>({
    fee_category_id: "",
    amount: 0,
    due_date: "",
    gender_specific: null,
    active: true,
    is_mandatory: false,
  })
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchFeeCategories()
  }, [])

  useEffect(() => {
    if (editingFee) {
      setFormData(editingFee)
    } else {
      setFormData({
        fee_category_id: "",
        amount: 0,
        due_date: "",
        gender_specific: null,
        active: true,
        is_mandatory: false,
      })
    }
  }, [editingFee, open])

  const fetchFeeCategories = async () => {
    try {
      const { data } = await supabase
        .from("fee_categories")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true })

      setFeeCategories(data || [])
    } catch (error) {
      console.error("[v0] Error fetching fee categories:", error)
    }
  }

  const handleSave = async () => {
    if (!formData.fee_category_id || formData.amount <= 0) {
      toast.error("Please fill all required fields")
      return
    }

    setSaving(true)
    try {
      const payload = {
        session_id: session,
        term_id: term,
        class_id: classId,
        fee_category_id: formData.fee_category_id,
        amount: formData.amount,
        due_date: formData.due_date || null,
        gender_specific: formData.gender_specific,
        active: formData.active,
        is_mandatory: formData.is_mandatory,
      }

      if (editingFee?.id) {
        const { error } = await supabase
          .from("fee_structures")
          .update(payload)
          .eq("id", editingFee.id)

        if (error) {
          toast.error("Failed to update fee")
          return
        }
        toast.success("Fee updated successfully")
      } else {
        const { error } = await supabase
          .from("fee_structures")
          .insert([payload])

        if (error) {
          toast.error("Failed to create fee")
          return
        }
        toast.success("Fee created successfully")
      }

      onOpenChange(false)
      onSave()
    } catch (error) {
      console.error("[v0] Error saving fee:", error)
      toast.error("Error saving fee")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingFee?.id ? "Edit Fee" : "Add Fee"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section 1 - Target */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="font-medium text-sm">Target</h3>

            <div>
              <Label htmlFor="category" className="text-sm">
                Fee Category
              </Label>
              <Select
                value={formData.fee_category_id}
                onValueChange={val =>
                  setFormData({ ...formData, fee_category_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {feeCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section 2 - Fee Info */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="font-medium text-sm">Fee Information</h3>

            <div>
              <Label htmlFor="amount" className="text-sm">
                Amount (₦)
              </Label>
              <Input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={e =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-sm">
                Due Date (optional)
              </Label>
              <Input
                type="date"
                id="dueDate"
                value={formData.due_date}
                onChange={e =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Section 3 - Rules */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Rules</h3>

            <div>
              <Label htmlFor="gender" className="text-sm">
                Gender Specific
              </Label>
              <Select
                value={formData.gender_specific || "all"}
                onValueChange={val =>
                  setFormData({
                    ...formData,
                    gender_specific: val === "all" ? null : val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Both / All</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={checked =>
                  setFormData({
                    ...formData,
                    is_mandatory: Boolean(checked),
                  })
                }
              />
              <Label htmlFor="mandatory" className="text-sm font-normal">
                Is Mandatory
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={checked =>
                  setFormData({ ...formData, active: Boolean(checked) })
                }
              />
              <Label htmlFor="active" className="text-sm font-normal">
                Active
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
