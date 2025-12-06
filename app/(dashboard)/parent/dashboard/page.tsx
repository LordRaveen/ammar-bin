import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, FileText, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function ParentDashboardPage() {
  const user = await requireAuth()

  // Redirect non-parents
  if (user.role !== "parent") {
    return <div>Access Denied</div>
  }

  const supabase = await createClient()

  // Get guardian record linked to this user
  const { data: guardian } = await supabase.from("guardians").select("*").eq("user_id", user.id).single()

  if (!guardian) {
    return <div>Guardian record not found</div>
  }

  // Get all children linked to this guardian
  const { data: studentGuardians } = await supabase
    .from("student_guardians")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name,
        photo_url,
        gender,
        date_of_birth,
        status
      )
    `)
    .eq("guardian_id", guardian.id)

  const children = studentGuardians?.map((sg: any) => sg.students) || []

  // Get active session and term
  const { data: activeSession } = await supabase
    .from("sessions")
    .select("*, terms(*)")
    .eq("is_active", true)
    .maybeSingle()

  const activeTerm = activeSession?.terms?.find((t: any) => t.is_active)

  // Get total outstanding fees for all children
  let totalOutstanding = 0
  let totalInvoices = 0
  let overdueInvoices = 0

  for (const child of children) {
    const { data: invoices } = await supabase
      .from("invoices")
      .select("balance, status, due_date")
      .eq("student_id", child.id)

    if (invoices) {
      totalInvoices += invoices.length
      totalOutstanding += invoices.reduce((sum, inv) => sum + Number.parseFloat(inv.balance || "0"), 0)

      // Count overdue invoices
      const now = new Date()
      overdueInvoices += invoices.filter(
        (inv) => inv.status !== "Paid" && Number.parseFloat(inv.balance) > 0 && new Date(inv.due_date) < now,
      ).length
    }
  }

  // Get enrollment info for each child
  const childrenWithEnrollment = await Promise.all(
    children.map(async (child: any) => {
      const { data: enrollment } = await supabase
        .from("student_enrollments")
        .select(`
          *,
          classes (
            name,
            sections (
              name
            )
          )
        `)
        .eq("student_id", child.id)
        .eq("is_active", true)
        .maybeSingle()

      return { ...child, enrollment }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {guardian.first_name} {guardian.last_name}
        </p>
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
            <CardTitle className="text-sm font-medium">My Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₦{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{totalInvoices} invoice(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {overdueInvoices > 0 ? "Requires attention" : "All up to date"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/parent/payments">
                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  View Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Children</CardTitle>
          <CardDescription>All students linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {childrenWithEnrollment.length > 0 ? (
              childrenWithEnrollment.map((child: any) => (
                <div key={child.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={child.photo_url || "/placeholder.svg"}
                      alt={`${child.first_name} ${child.last_name}`}
                    />
                    <AvatarFallback>
                      {child.first_name?.[0]}
                      {child.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {child.first_name} {child.middle_name} {child.last_name}
                      </p>
                      <Badge variant={child.status === "Active" ? "default" : "secondary"}>{child.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Student ID: {child.student_id}</p>
                    {child.enrollment && (
                      <p className="text-sm text-muted-foreground">
                        Class: {child.enrollment.classes?.sections?.name} - {child.enrollment.classes?.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/parent/results?student=${child.id}`}>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Results
                      </Button>
                    </Link>
                    <Link href={`/parent/payments?student=${child.id}`}>
                      <Button size="sm">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Fees
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No children found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Updates and announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">No recent notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Important dates and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
