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
  className: string
  feeStructures: FeeStructure[]
}

export function PreviewImpactModal({
  open,
  onOpenChange,
  session,
  term,
  classId,
  className,
  feeStructures,
}: PreviewImpactModalProps) {
  const [studentCount, setStudentCount] = useState(0)
  const [expectedRevenue, setExpectedRevenue] = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (open && classId && session && term) {
      fetchPreviewData()
    }
  }, [open, classId, session, term])

  const fetchPreviewData = async () => {
    setLoading(true)
    try {
      // Get student count for this class/term
      const { data: enrollments, error } = await supabase
        .from("student_enrollments")
        .select("id")
        .eq("class_id", classId)
        .eq("term_id", term)
        .eq("session_id", session)

      if (error) {
        console.error("[v0] Error fetching enrollments:", error)
        return
      }

      const count = enrollments?.length || 0
      setStudentCount(count)

      // Calculate total fees per student
      const totalPerStudent = feeStructures.reduce(
        (sum, fee) => sum + Number(fee.amount || 0),
        0
      )

      // Calculate expected revenue
      const expectedTotal = totalPerStudent * count
      setExpectedRevenue(expectedTotal)
    } catch (error) {
      console.error("[v0] Error fetching preview data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preview Invoice Impact</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading preview data...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">{className}</p>
              <p className="text-xs text-muted-foreground">
                {/* Term info would go here */}
              </p>
            </div>

            {/* Summary Cards - Compact */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="border shadow-none">
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-2xl font-semibold leading-none">
                      {studentCount}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">Students</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-none">
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-lg font-semibold leading-none">
                      ₦{expectedRevenue.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Expected Revenue
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Breakdown */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Fee break down</h3>
              <div className="space-y-2">
                {feeStructures.map((fee, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-muted flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {fee.fee_categories?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₦{Number(fee.amount).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      ₦{(Number(fee.amount) * studentCount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
