import { requireAuth } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get statistics
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')

  const { count: totalTeachers } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')

  const { count: totalGuardians } = await supabase
    .from('guardians')
    .select('*', { count: 'exact', head: true })

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')

  const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

  const { data: invoices } = await supabase
    .from('invoices')
    .select('balance, status')

  const totalOutstanding = invoices?.reduce((sum, i) => sum + parseFloat(i.balance), 0) || 0
  const collectionRate = invoices?.length
    ? ((invoices.filter(i => i.status === 'Paid').length / invoices.length) * 100).toFixed(1)
    : 0

  // Get active session
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('*, terms(*)')
    .eq('is_active', true)
    .maybeSingle()

  const activeTerm = activeSession?.terms?.find((t: any) => t.is_active)

  // Get students by section
  const { data: sections } = await supabase
    .from('sections')
    .select('id, name')
    .eq('is_active', true)

  const sectionStats = await Promise.all(
    (sections || []).map(async (section: any) => {
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('section_id', section.id)
        .eq('is_active', true)

      const classIds = classes?.map(c => c.id) || []
      
      if (classIds.length === 0) return { section: section.name, count: 0 }

      const { count } = await supabase
        .from('student_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds)
        .eq('is_active', true)

      return { section: section.name, count: count || 0 }
    })
  )

  // Get recent activities (last 5 students registered)
  const { data: recentStudents } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
        </p>
      </div>

      {activeSession && activeTerm && (
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Active Session</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Current academic period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{activeSession.name}</p>
              <p className="text-lg">{activeTerm.name}</p>
              <p className="text-sm text-primary-foreground/80">
                {new Date(activeTerm.start_date).toLocaleDateString()} -{' '}
                {new Date(activeTerm.end_date).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Teaching staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guardians</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuardians || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered parents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments?.length || 0} payment(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Revenue and collection metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ₦{totalRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Fees</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₦{totalOutstanding.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold">{collectionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students by Section</CardTitle>
            <CardDescription>Enrollment distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectionStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{stat.section}</span>
                  </div>
                  <span className="text-2xl font-bold">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
          <CardDescription>Latest students added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentStudents && recentStudents.length > 0 ? (
              recentStudents.map((student: any) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.student_id}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(student.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent registrations
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
