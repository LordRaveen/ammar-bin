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
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Calendar,
  Search,
  Check,
  UserPlus,
  Users,
  ChevronRight,
  Filter
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Student {
  id: string
  first_name: string
  last_name: string
  photo_url?: string | null
  student_id?: string
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
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    <div className="space-y-6 pb-20 relative">
      {/* High-Efficiency Header Ribbon */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground leading-none">Attendance Log</h3>
            <div className="mt-1.5 flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-2 py-0.5">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                className="bg-transparent border-none text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 focus:ring-0 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Global Stats Strip */}
        <div className="flex items-center gap-6 px-6 border-x border-slate-100 dark:border-slate-800 hidden lg:flex">
          <div className="text-center">
            <span className="text-[9px] font-black text-emerald-500 uppercase block tracking-tighter">Present</span>
            <span className="text-xl font-black">{statusCounts.present}</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-black text-red-500 uppercase block tracking-tighter">Absent</span>
            <span className="text-xl font-black">{statusCounts.absent}</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-black text-amber-500 uppercase block tracking-tighter">Late</span>
            <span className="text-xl font-black">{statusCounts.late}</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-black text-blue-500 uppercase block tracking-tighter">Total Students</span>
            <span className="text-xl font-black italic">{students.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student..."
              className="h-10 pl-9 w-[180px] bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleMarkAllPresent}
            variant="outline"
            size="sm"
            className="h-10 border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl"
          >
            Mark All Present
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <Card className="border shadow-none bg-white dark:bg-slate-950 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow className="border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-widest pl-8">Student Identity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Attendance Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest pr-8 text-right">Notes/Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const status = attendanceStatus[student.id] || "Absent"

                    return (
                      <TableRow key={student.id} className="group border-b border-slate-50 dark:border-slate-900/50 hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                        <TableCell className="pl-8 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                              {student.photo_url && <AvatarImage src={student.photo_url} />}
                              <AvatarFallback className="text-[10px] font-black bg-slate-900 text-white">
                                {student.first_name[0]}{student.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-black tracking-tight leading-none mb-1">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{student.student_id || 'STD-00' + student.id.slice(0, 3).toUpperCase()}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl w-fit border border-slate-100 dark:border-slate-800">
                            {([
                              { id: "Present", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500 text-white" },
                              { id: "Absent", icon: XCircle, color: "text-red-500", bg: "bg-red-500 text-white" },
                              { id: "Late", icon: Clock, color: "text-amber-500", bg: "bg-amber-500 text-white" },
                              { id: "Excused", icon: FileText, color: "text-blue-500", bg: "bg-blue-500 text-white" }
                            ] as const).map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => handleStatusChange(student.id, opt.id)}
                                className={cn(
                                  "h-8 px-3 rounded-lg flex items-center justify-center transition-all duration-300",
                                  status === opt.id
                                    ? cn(opt.bg, "shadow-md scale-105")
                                    : cn("text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800")
                                )}
                                title={opt.id}
                              >
                                <opt.icon className={cn("h-4 w-4", status !== opt.id && opt.color)} />
                                {status === opt.id && <span className="ml-1.5 text-[9px] font-black uppercase tracking-tight">{opt.id}</span>}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="relative group/input inline-block">
                            <Input
                              type="text"
                              placeholder="Add notes..."
                              value={remarks[student.id] || ""}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              className="max-w-[200px] h-8 bg-transparent border-none text-[11px] font-medium text-right focus:bg-slate-50 dark:focus:bg-slate-900 transition-colors"
                            />
                            <div className="absolute right-0 bottom-0 w-0 h-[1px] bg-slate-200 dark:bg-slate-700 transition-all group-focus-within/input:w-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-24">
                      <div className="h-12 w-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                        <Users className="h-6 w-6 text-slate-300" />
                      </div>
                      <h3 className="text-sm font-bold">No students found</h3>
                      <p className="text-xs text-muted-foreground mt-1">Adjust your search to find students in this class.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Floating Action Ribbon */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-500">
        <div className="bg-slate-900 dark:bg-white text-white dark:text-black py-2.5 px-6 rounded-2xl shadow-2xl shadow-black/20 flex items-center gap-6 border-4 border-white/10 dark:border-slate-100">
          <div className="flex items-center gap-4 border-r border-white/20 dark:border-slate-200 pr-6 mr-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-black uppercase italic">{statusCounts.present} Handled</span>
            </div>
          </div>
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:text-white h-9 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Submit Daily Log
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog - Modernized */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="border-none dark:bg-slate-950 rounded-3xl p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-orange-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-black italic">Finalize Log?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              You are about to record attendance for <span className="text-foreground font-bold">{students.length} students</span> for date <span className="text-foreground font-bold">{format(new Date(attendanceDate), "MMM dd, yyyy")}</span>. This action will update the master academic records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 border-none bg-slate-100 dark:bg-slate-900 text-xs font-black uppercase rounded-2xl">Re-check</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={loading}
              className="h-12 bg-slate-900 dark:bg-white dark:text-black text-xs font-black uppercase rounded-2xl px-8"
            >
              {loading ? "Processing..." : "Confirm & Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
