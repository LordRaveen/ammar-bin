import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, ClipboardCheck, TrendingUp, BookOpen, FileText } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function TeacherDashboardPage() {
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
  const { data: classAssignments } = await supabase
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
  const { data: subjectAssignments } = await supabase
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
    .eq("session_id", activeSession?.id)

  // Calculate pending assessments (subjects where scores haven't been entered)
  let pendingAssessments = 0
  if (subjectAssignments && subjectAssignments.length > 0) {
    for (const assignment of subjectAssignments) {
      const { count } = await supabase
        .from("assessments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", assignment.classes?.id)
        .eq("subject_id", assignment.subjects?.id)
        .eq("session_id", activeSession?.id)
        .eq("term_id", activeTerm?.id)

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {teacher.first_name}</h1>
        <p className="text-muted-foreground">Here's an overview of your classes and activities</p>
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
              <p className="text-sm text-primary-foreground/80">
                {new Date(activeTerm.start_date).toLocaleDateString()} -{" "}
                {new Date(activeTerm.end_date).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Assigned</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedClasses.length}</div>
            <p className="text-xs text-muted-foreground">Active classes this term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students you teach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Assigned</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectAssignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Subjects this term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
            <p className="text-xs text-muted-foreground">Recent class average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>Classes assigned to you this term</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedClasses.length > 0 ? (
                assignedClasses.map((classItem: any) => {
                  const assignment = classAssignments?.find((a) => a.classes?.id === classItem.id)
                  return (
                    <Link key={classItem.id} href={`/classes/${classItem.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{classItem.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {classItem.sections?.name}
                              {assignment?.is_class_teacher && (
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Class Teacher
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No classes assigned yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/assessments/score-entry">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Enter Scores</p>
                    <p className="text-xs text-muted-foreground">Add student assessment scores</p>
                  </div>
                </div>
              </Link>

              <Link href="/students">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">View Students</p>
                    <p className="text-xs text-muted-foreground">See your student roster</p>
                  </div>
                </div>
              </Link>

              <Link href="/assessments/results">
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">View Results</p>
                    <p className="text-xs text-muted-foreground">Check student performance</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest score entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Score entered for {activity.students?.first_name} {activity.students?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.assessments?.subjects?.name} - {activity.assessments?.classes?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{activity.score}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
