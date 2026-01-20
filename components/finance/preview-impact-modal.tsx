"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Users, TrendingUp } from "lucide-react"

interface FeeStructure {
  fee_category_id: string
  amount: number
  fee_categories?: { name: string }
}

interface PreviewImpactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: string
  term: string
  classId: string
  feeStructures: FeeStructure[]
}

export function PreviewImpactModal({
  open,
  onOpenChange,
  session,
  term,
  classId,
  feeStructures,
}: PreviewImpactModalProps) {
  const [studentCount, setStudentCount] = useState(0)
  const [expectedRevenue, setExpectedRevenue] = useState(0)
  const [sampleStudents, setSampleStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (open && classId) {
      fetchPreviewData()
    }
  }, [open, classId])

  const fetchPreviewData = async () => {
    setLoading(true)
    try {
      // Get student count and sample students
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("*, students(first_name, last_name, student_id)")
        .eq("class_id", classId)
        .eq("term_id", term)
        .limit(5)

      setStudentCount(enrollments?.length || 0)
      setSampleStudents(enrollments?.map(e => e.students) || [])

      // Calculate total fees per student
      const totalPerStudent = feeStructures.reduce(
        (sum, fee) => sum + Number(fee.amount || 0),
        0
      )

      // Calculate expected revenue
      const expectedTotal = totalPerStudent * (enrollments?.length || 0)
      setExpectedRevenue(expectedTotal)
    } catch (error) {
      console.error("[v0] Error fetching preview data:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalPerStudent = feeStructures.reduce(
    (sum, fee) => sum + Number(fee.amount || 0),
    0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview Invoice Impact</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading preview data...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{studentCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Revenue</p>
                      <p className="text-2xl font-bold">
                        ₦{expectedRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Breakdown */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Fee Breakdown</h3>
              <div className="space-y-2">
                {feeStructures.map((fee, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {fee.fee_categories?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Per student: ₦{Number(fee.amount).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₦{(Number(fee.amount) * studentCount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Students */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Sample Students</h3>
              <div className="space-y-2">
                {sampleStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No students enrolled in this class
                  </p>
                ) : (
                  sampleStudents.map((student, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.student_id}
                        </p>
                      </div>
                      <p className="font-semibold">₦{totalPerStudent.toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Summary Info */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                Generating invoices will create <strong>{studentCount}</strong> invoice
                {studentCount !== 1 ? "s" : ""} with a total billing value of{" "}
                <strong>₦{expectedRevenue.toLocaleString()}</strong>
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
