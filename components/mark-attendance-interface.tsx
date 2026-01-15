"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { markAttendanceForClass, fetchClassAttendanceForDate } from "@/app/(dashboard)/classes/[id]/attendance/actions"
import type { AttendanceStatus, AttendanceInput } from "@/lib/types/attendance"
import { Loader2, CheckCircle2, XCircle, Clock, FileText } from "lucide-react"

interface Student {
  id: string
  first_name: string
  last_name: string
}

interface MarkAttendanceInterfaceProps {
  classId: string
  sessionId: string
  termId: string
  students: Student[]
}

export function MarkAttendanceInterface({ classId, sessionId, termId, students }: MarkAttendanceInterfaceProps) {
  const [attendanceDate, setAttendanceDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, AttendanceStatus>>({})
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [markAllPresent, setMarkAllPresent] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const initialStatus: Record<string, AttendanceStatus> = {}
    students.forEach((student) => {
      initialStatus[student.id] = markAllPresent ? "Present" : "Absent"
    })
    setAttendanceStatus(initialStatus)
  }, [students, markAllPresent])

  useEffect(() => {
    loadAttendanceForDate()
  }, [attendanceDate, classId, sessionId])

  const loadAttendanceForDate = async () => {
    try {
      const result = await fetchClassAttendanceForDate({
        class_id: classId,
        date: attendanceDate,
        session_id: sessionId,
        term_id: termId,
      })

      if (result && result.length > 0) {
        const newStatus: Record<string, AttendanceStatus> = {}
        const newRemarks: Record<string, string> = {}

        result.forEach((record: any) => {
          newStatus[record.student_id] = record.status
          newRemarks[record.student_id] = record.remarks || ""
        })

        setAttendanceStatus(newStatus)
        setRemarks(newRemarks)
      } else {
        const defaultStatus: Record<string, AttendanceStatus> = {}
        students.forEach((student) => {
          defaultStatus[student.id] = "Present"
        })
        setAttendanceStatus(defaultStatus)
        setRemarks({})
      }
    } catch (error) {
      console.error("Failed to load attendance:", error)
    }
  }

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const handleRemarksChange = (studentId: string, remark: string) => {
    setRemarks((prev) => ({
      ...prev,
      [studentId]: remark,
    }))
  }

  const handleMarkAllPresent = () => {
    const newStatus: Record<string, AttendanceStatus> = {}
    students.forEach((student) => {
      newStatus[student.id] = "Present"
    })
    setAttendanceStatus(newStatus)
    toast({ title: "Marked all as Present", description: `${students.length} students marked as present` })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const records: AttendanceInput[] = students.map((student) => ({
        student_id: student.id,
        status: attendanceStatus[student.id] || "Absent",
        remarks: remarks[student.id],
      }))

      const result = await markAttendanceForClass({
        class_id: classId,
        session_id: sessionId,
        term_id: termId,
        date: attendanceDate,
        records,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: `Attendance marked for ${result.count} students`,
        })
        setShowConfirmation(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark attendance",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const statusCounts = {
    present: Object.values(attendanceStatus).filter((s) => s === "Present").length,
    absent: Object.values(attendanceStatus).filter((s) => s === "Absent").length,
    late: Object.values(attendanceStatus).filter((s) => s === "Late").length,
    excused: Object.values(attendanceStatus).filter((s) => s === "Excused").length,
  }

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "Present":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "Absent":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "Late":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "Excused":
        return <FileText className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>Record student attendance for this class</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Total Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <Label htmlFor="attendance-date">Attendance Date</Label>
        </CardHeader>
        <CardContent>
          <Input
            id="attendance-date"
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            max={format(new Date(), "yyyy-MM-dd")}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-600" />
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-2xl font-bold">{statusCounts.present}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto mb-2 h-6 w-6 text-red-600" />
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold">{statusCounts.absent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Late</p>
              <p className="text-2xl font-bold">{statusCounts.late}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-blue-600" />
              <p className="text-sm text-muted-foreground">Excused</p>
              <p className="text-2xl font-bold">{statusCounts.excused}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2">
        <Button onClick={handleMarkAllPresent} variant="outline">
          Mark All Present
        </Button>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(["Present", "Absent", "Late", "Excused"] as const).map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={attendanceStatus[student.id] === status ? "default" : "outline"}
                            onClick={() => handleStatusChange(student.id, status)}
                            className={cn(
                              "text-xs",
                              attendanceStatus[student.id] === status && {
                                "bg-green-600": status === "Present",
                                "bg-red-600": status === "Absent",
                                "bg-yellow-600": status === "Late",
                                "bg-blue-600": status === "Excused",
                              },
                            )}
                          >
                            {getStatusIcon(status)}
                            <span className="ml-1">{status}</span>
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Add remarks..."
                        value={remarks[student.id] || ""}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        className="max-w-xs"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setShowConfirmation(true)} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Attendance"
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Attendance Mark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark attendance for {students.length} students on{" "}
              {format(new Date(attendanceDate), "MMM dd, yyyy")}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
