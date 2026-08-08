import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, ClipboardCheck, TrendingUp, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function TeacherDashboardPage() {
  const user = await requireAuth(["teacher"])
  const supabase = await createServerClient()

  // Get teacher record
  let { data: teacher } = await supabase
    .from("teachers")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle()

  // Self-healing: if teacher is not found in teachers table, but user is a teacher in user_profiles
  if (!teacher) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile && profile.role?.toLowerCase() === "teacher") {
      const adminClient = createAdminClient()

      // Try to find if teacher already exists by email
      const { data: existingTeacherByEmail } = await adminClient
        .from("teachers")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle()

      if (existingTeacherByEmail) {
        // Link existing teacher record to the user_id
        const { data: updatedTeacher } = await adminClient
          .from("teachers")
          .update({ user_id: user.id })
          .eq("id", existingTeacherByEmail.id)
          .select("id, first_name, last_name")
          .maybeSingle()

        if (updatedTeacher) {
          teacher = updatedTeacher
        }
      } else {
        // Insert new teacher record
        const { data: newTeacher } = await adminClient
          .from("teachers")
          .insert({
            user_id: user.id,
            staff_id: profile.staff_id,
            first_name: profile.first_name,
            middle_name: profile.middle_name,
            last_name: profile.last_name,
            email: profile.email,
            phone: profile.phone,
            gender: profile.gender,
            date_of_birth: profile.date_of_birth,
            address: profile.address,
            qualification: profile.qualification,
            specialization: profile.specialization,
            employment_type: profile.employment_type,
            status: profile.status || "Active",
          })
          .select("id, first_name, last_name")
          .maybeSingle()

        if (newTeacher) {
          teacher = newTeacher
        }
      }
    }
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <GraduationCap className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-lg font-bold">Teacher Profile Not Synchronized</h2>
        <p className="text-xs text-muted-foreground max-w-[360px] mt-1">
          Your user account is active, but your teacher directory record is not fully set up. Please ask the administrator to verify your profile details.
        </p>
      </div>
    )
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
    .eq("session_id", activeSession?.id || null)

  const classAssignments = classAssignmentsData as any[] | null
  const assignedClasses = classAssignments?.map((a) => a.classes).filter(Boolean) || []

  // Get total students count across all assigned classes
  let totalStudents = 0
  if (assignedClasses.length > 0) {
    const classIds = assignedClasses.map((c) => c.id)
    const { count } = await supabase
      .from("student_enrollments")
      .select("*", { count: "exact", head: true })
      .in("class_id", classIds)
      .eq("is_active", true)
    totalStudents = count || 0
  }

  // Get subject assignments
  const { data: subjectAssignmentsData } = await supabase
    .from("teacher_subject_assignments")
    .select(`
      id,
      classes (
        id,
        name
      ),
      subjects (
        id,
        name
      )
    `)
    .eq("teacher_id", teacher.id)
    .eq("session_id", activeSession?.id || null)

  const subjectAssignments = subjectAssignmentsData as any[] | null

  // Calculate pending assessments (subjects where scores haven't been entered)
  let pendingAssessments = 0
  if (subjectAssignments && subjectAssignments.length > 0 && activeSession?.id && activeTerm?.id) {
    for (const assignment of subjectAssignments) {
      const { count } = await supabase
        .from("assessments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", assignment.classes?.id)
        .eq("subject_id", assignment.subjects?.id)
        .eq("session_id", activeSession.id)
        .eq("term_id", activeTerm.id)

      // This is a simplified count - would need to check if scores are entered
      pendingAssessments += count || 0
    }
  }

  // Calculate average class performance (simplified)
  const { data: recentScores } = await supabase
    .from("student_scores")
    .select("score")
    .eq("entered_by", user.id)
    .limit(100)

  const averageScore =
    recentScores && recentScores.length > 0
      ? (recentScores.reduce((sum, s) => sum + Number(s.score || 0), 0) / recentScores.length).toFixed(1)
      : "0"

  // Get recent activities
  const { data: recentActivities } = await supabase
    .from("student_scores")
    .select(`
      id,
      score,
      created_at,
      students (
        first_name,
        last_name
      ),
      assessments (
        subjects (
          name
        ),
        classes (
          name
        )
      )
    `)
    .eq("entered_by", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Header section with Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight font-mono">Dashboard</h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
            Welcome back, <span className="text-foreground font-semibold">{teacher.first_name} {teacher.last_name}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Academic Status Bar */}
      {activeSession && activeTerm && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-3 border-1 border-emerald-700 shadow-none bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <GraduationCap className="h-32 w-32" />
            </div>
            <CardContent className="py-4 px-6 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold">CURRENT SESSION</Badge>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold">{activeSession.name}</h2>
                    <p className="text-slate-400 font-medium text-md mt-1">{activeTerm.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex items-center gap-8 text-right">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Session Ends</p>
                    <p className="text-lg font-bold">{new Date(activeTerm.end_date || activeSession.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="space-y-1 border-l border-slate-700 pl-8 text-left md:text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Term Range</p>
                    <p className="text-sm font-semibold text-slate-300">
                      {new Date(activeTerm.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(activeTerm.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Classes Assigned */}
        <Card className="gap-0 py-2 border shadow-none group hover:border-primary/20 transition-all duration-300">
          <CardHeader className="px-3 flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Classes Assigned</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <GraduationCap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pt-1">
            <div className="text-xl font-bold">{assignedClasses.length}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Active classes this term</p>
          </CardContent>
        </Card>

        {/* Total Students */}
        <Card className="gap-0 py-2 border shadow-none group hover:border-primary/20 transition-all duration-300">
          <CardHeader className="px-3 flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Students</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pt-1">
            <div className="text-xl font-bold">{totalStudents}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Students in your classes</p>
          </CardContent>
        </Card>

        {/* Subjects Assigned */}
        <Card className="gap-0 py-2 border shadow-none group hover:border-primary/20 transition-all duration-300">
          <CardHeader className="px-3 flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Subjects Assigned</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pt-1">
            <div className="text-xl font-bold">{subjectAssignments?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Subjects taught this term</p>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="gap-0 py-2 border shadow-none group hover:border-primary/20 transition-all duration-300">
          <CardHeader className="px-3 flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Average Score</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pt-1">
            <div className="text-xl font-bold">{averageScore}%</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Recent class average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Classes */}
        <Card className="shadow-none border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">My Classes</CardTitle>
            <CardDescription className="text-xs">Classes assigned to you this term</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {assignedClasses.length > 0 ? (
                assignedClasses.map((classItem: any) => {
                  const assignment = classAssignments?.find((a) => a.classes?.id === classItem.id)
                  return (
                    <Link key={classItem.id} href={`/classes/${classItem.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          <div>
                            <p className="text-xs font-bold text-foreground">{classItem.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {classItem.sections?.name}
                              </span>
                              {assignment?.is_class_teacher && (
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-[9px] h-4 py-0 font-bold border-none">
                                  Class Teacher
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No classes assigned yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-none border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-2.5">
              <Link href="/teacher/results">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group">
                  <ClipboardCheck className="h-5 w-5 text-primary group-hover:scale-105 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Class Results & Scores</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Manage and entry assessment scores</p>
                  </div>
                </div>
              </Link>

              <Link href="/teacher/attendance">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group">
                  <Users className="h-5 w-5 text-primary group-hover:scale-105 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Class Attendance</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Mark daily student attendance</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-none border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Recent Activity</CardTitle>
          <CardDescription className="text-xs">Your latest score entries</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2.5">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Score entered for {activity.students?.first_name} {activity.students?.last_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {activity.assessments?.subjects?.name} - {activity.assessments?.classes?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{activity.score}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">No recent activities</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
