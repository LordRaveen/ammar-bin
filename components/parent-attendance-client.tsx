"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Student {
  id: string
  student_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  photo_url: string | null
}

interface AttendanceRecord {
  id: string
  date: string
  status: string
  remarks: string | null
}

interface AttendanceStats {
  totalDays: number
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
}

export function ParentAttendanceClient({ children }: { children: Student[] }) {
  const [selectedChild, setSelectedChild] = useState<string>(children[0]?.id || "")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0,
  })
  const [loading, setLoading] = useState(false)

  const selectedStudent = children.find((c) => c.id === selectedChild)

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  useEffect(() => {
    if (selectedChild) {
      fetchAttendance()
    }
  }, [selectedChild, selectedMonth, selectedYear])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1)
      const endDate = new Date(selectedYear, selectedMonth + 1, 0)

      const response = await fetch(
        `/api/attendance/student?studentId=${selectedChild}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      )
      const data = await response.json()

      setAttendanceRecords(data.records || [])
      setStats(data.stats || { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 })
    } catch (error) {
      console.error("Failed to fetch attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-500"
      case "Absent":
        return "bg-red-500"
      case "Late":
        return "bg-yellow-500"
      case "Excused":
        return "bg-blue-500"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      Present: "default",
      Absent: "destructive",
      Late: "secondary",
      Excused: "outline",
    }
    return variants[status] || "outline"
  }

  // Generate calendar days
  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const getAttendanceForDay = (day: number) => {
    const dateStr = new Date(selectedYear, selectedMonth, day).toISOString().split("T")[0]
    return attendanceRecords.find((record) => record.date === dateStr)
  }

  const days = getDaysInMonth(selectedMonth, selectedYear)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">View attendance records and statistics</p>
      </div>

      {/* Student Selector */}
      {selectedStudent && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedStudent.photo_url || "/placeholder.svg"} alt={selectedStudent.first_name} />
                <AvatarFallback>
                  {selectedStudent.first_name[0]}
                  {selectedStudent.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.first_name} {child.middle_name} {child.last_name} - {child.student_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month/Year Selector */}
      <div className="flex gap-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" className="ml-auto bg-transparent">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.percentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.present} / {stats.totalDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground mt-1">Days attended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">Days missed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.late}</div>
            <p className="text-xs text-muted-foreground mt-1">Late arrivals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Excused</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.excused}</div>
            <p className="text-xs text-muted-foreground mt-1">Excused absences</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {months[selectedMonth]} {selectedYear} Calendar
          </CardTitle>
          <CardDescription>Daily attendance status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading attendance...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const attendance = getAttendanceForDay(day)
                const today = new Date()
                const isToday =
                  day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear()

                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded-lg p-2 flex flex-col items-center justify-center relative ${
                      isToday ? "border-primary border-2" : ""
                    } ${attendance ? "cursor-pointer hover:bg-accent" : ""}`}
                    title={
                      attendance ? `${attendance.status}${attendance.remarks ? `: ${attendance.remarks}` : ""}` : ""
                    }
                  >
                    <div className="text-sm font-medium">{day}</div>
                    {attendance && <div className={`w-2 h-2 rounded-full mt-1 ${getStatusColor(attendance.status)}`} />}
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">Excused</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Absences */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Absences & Late Arrivals</CardTitle>
          <CardDescription>Last 10 non-present records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.filter((r) => r.status !== "Present").length > 0 ? (
            <div className="space-y-3">
              {attendanceRecords
                .filter((r) => r.status !== "Present")
                .slice(0, 10)
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadge(record.status)}>{record.status}</Badge>
                      <div>
                        <p className="text-sm font-medium">{new Date(record.date).toLocaleDateString()}</p>
                        {record.remarks && <p className="text-xs text-muted-foreground">{record.remarks}</p>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Perfect attendance! No absences or late arrivals this month.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
