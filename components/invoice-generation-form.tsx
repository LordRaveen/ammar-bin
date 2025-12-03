"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { generateInvoices } from "@/app/(dashboard)/finance/invoices/generate/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface InvoiceGenerationFormProps {
  activeSession: any
  activeTerm: any
  classes: any[]
  feeStructures: any[]
}

export function InvoiceGenerationForm({
  activeSession,
  activeTerm,
  classes,
  feeStructures,
}: InvoiceGenerationFormProps) {
  const [generationType, setGenerationType] = useState<"class" | "individual">("class")
  const [selectedClass, setSelectedClass] = useState("")
  const [studentId, setStudentId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [selectedFees, setSelectedFees] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Get fee structures for selected class
  const classFees = selectedClass ? feeStructures?.filter((fs: any) => fs.class_id === selectedClass) : []

  const handleGenerateInvoices = async () => {
    if (!dueDate) {
      toast.error("Please select a due date")
      return
    }

    if (generationType === "class" && !selectedClass) {
      toast.error("Please select a class")
      return
    }

    if (generationType === "individual" && !studentId) {
      toast.error("Please enter a student ID")
      return
    }

    if (selectedFees.length === 0) {
      toast.error("Please select at least one fee category")
      return
    }

    setLoading(true)

    try {
      const result = await generateInvoices({
        sessionId: activeSession.id,
        termId: activeTerm.id,
        generationType,
        classId: selectedClass,
        studentId,
        dueDate,
        feeStructureIds: selectedFees,
      })

      if (result.success) {
        toast.success(result.message)
        router.push("/finance/invoices")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to generate invoices")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Generation Type */}
      <div className="space-y-2">
        <Label>Generation Type</Label>
        <Select value={generationType} onValueChange={(value: any) => setGenerationType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="class">By Class</SelectItem>
            <SelectItem value="individual">Individual Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Class Selection or Student ID */}
      {generationType === "class" ? (
        <div className="space-y-2">
          <Label>Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.sections?.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="student-id">Student ID</Label>
          <Input
            id="student-id"
            placeholder="Enter student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>
      )}

      {/* Due Date */}
      <div className="space-y-2">
        <Label htmlFor="due-date">Due Date</Label>
        <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      {/* Fee Selection */}
      {selectedClass && classFees.length > 0 && (
        <div className="space-y-4">
          <Label>Select Fee Categories</Label>
          <div className="border rounded-lg p-4 space-y-3">
            {classFees.map((fee: any) => (
              <div key={fee.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={fee.id}
                    checked={selectedFees.includes(fee.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFees([...selectedFees, fee.id])
                      } else {
                        setSelectedFees(selectedFees.filter((id) => id !== fee.id))
                      }
                    }}
                  />
                  <Label htmlFor={fee.id} className="cursor-pointer">
                    {fee.fee_categories?.name}
                  </Label>
                </div>
                <span className="font-semibold">₦{Number.parseFloat(fee.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Total: ₦
            {selectedFees
              .reduce((sum, feeId) => {
                const fee = classFees.find((f: any) => f.id === feeId)
                return sum + (fee ? Number.parseFloat(fee.amount) : 0)
              }, 0)
              .toLocaleString()}
          </p>
        </div>
      )}

      {/* Generate Button */}
      <Button onClick={handleGenerateInvoices} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Invoices"
        )}
      </Button>
    </div>
  )
}
