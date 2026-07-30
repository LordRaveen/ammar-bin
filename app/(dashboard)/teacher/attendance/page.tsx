import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconCalendarEvent, IconUsers, IconClipboardCheck } from "@tabler/icons-react"

export const dynamic = "force-dynamic"

export default async function TeacherAttendancePage() {
  const user = await requireAuth(["teacher"])
  const supabase = await createServerClient()

  // Get teacher record
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .single()

  if (!teacher) {
    return <div>Teacher record not found</div>
  }

  // Get active session and term
  const { data: activeSession } = await supabase
    .from("sessions")
    .select("*, terms(*)")
    .eq("is_active", true)
    .maybeSingle()

  const activeTerm = activeSession?.terms?.find((t: any) => t.is_active)

  // Get teacher's assigned classes
  const { data: classAssignmentsData } = await supabase
    .from("teacher_class_assignments")
    .select(`
      id,
      is_class_teacher,
      classes (
        id,
        name,
        sections (
          name
        )
      )
    `)
    .eq("teacher_id", teacher.id)
    .eq("session_id", activeSession?.id)

  const classAssignments = classAssignmentsData as any[] | null
  const assignedClasses = classAssignments?.map((a) => a.classes).filter(Boolean) || []

  // Get attendance statistics for today
  const today = new Date().toISOString().split("T")[0]
  const { data: todayAttendance } = await supabase
    .from("attendance")
    .select("*")
    .in(
      "class_id",
      assignedClasses.map((c) => c.id),
    )
    .eq("date", today)
    .eq("session_id", activeSession?.id)

  const markedToday = new Set(todayAttendance?.map((a) => a.class_id) || [])

  // Get recent attendance records
  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select(`
      id,
      date,
      status,
      classes (
        name
      ),
      students (
        first_name,
        last_name
      )
    `)
    .in(
      "class_id",
      assignedClasses.map((c) => c.id),
    )
    .eq("recorded_by", user.id)
    .order("date", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
        <p className="text-muted-foreground">Mark and track student attendance</p>
      </div>

      {activeSession && activeTerm && (
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Active Session</CardTitle>
            <CardDescription className="text-primary-foreground/80">Current academic period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{activeSession.name}</p>
              <p className="text-lg">{activeTerm.name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Assigned</CardTitle>
            <IconClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedClasses.length}</div>
            <p className="text-xs text-muted-foreground">Classes this term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marked Today</CardTitle>
            <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{markedToday.size}</div>
            <p className="text-xs text-muted-foreground">of {assignedClasses.length} classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignedClasses.reduce((sum, c: any) => sum + (c.students_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">In your classes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select a class to mark attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignedClasses.length > 0 ? (
              assignedClasses.map((classItem: any) => {
                const isMarkedToday = markedToday.has(classItem.id)
                return (
                  <Link key={classItem.id} href={`/classes/${classItem.id}?tab=attendance`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <IconCalendarEvent className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{classItem.name}</p>
                          <p className="text-sm text-muted-foreground">{classItem.sections?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMarkedToday && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Marked Today</span>
                        )}
                        <Button variant="outline" size="sm">
                          Mark Attendance
                        </Button>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No classes assigned yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>Your latest attendance entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttendance && recentAttendance.length > 0 ? (
              recentAttendance.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {record.students?.first_name} {record.students?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.classes?.name} - {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        record.status === "Present"
                          ? "bg-green-100 text-green-800"
                          : record.status === "Absent"
                            ? "bg-red-100 text-red-800"
                            : record.status === "Late"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
