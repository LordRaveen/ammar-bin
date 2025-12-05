import { requireAuth } from "@/lib/auth/get-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, BarChart3, TrendingUp } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  await requireAuth(["super_admin", "admin", "accountant", "teacher"])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate and download various reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Student Reports
            </CardTitle>
            <CardDescription>Generate reports related to students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/reports/students/list">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Student List Report
              </Button>
            </Link>
            <Link href="/reports/students/enrollment">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Enrollment Report
              </Button>
            </Link>
            <Link href="/reports/students/class-list">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Class List by Section
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Academic Reports
            </CardTitle>
            <CardDescription>Performance and assessment reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/reports/academic/results">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Termly Results Report
              </Button>
            </Link>
            <Link href="/reports/academic/performance">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Class Performance Analysis
              </Button>
            </Link>
            <Link href="/reports/academic/pass-rate">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Pass/Fail Statistics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Financial Reports
            </CardTitle>
            <CardDescription>Revenue and payment reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/reports/finance/daily-cash">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Daily Cash Report
              </Button>
            </Link>
            <Link href="/reports/finance/revenue">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Revenue Report
              </Button>
            </Link>
            <Link href="/reports/finance/outstanding">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Outstanding Fees Report
              </Button>
            </Link>
            <Link href="/reports/finance/defaulters">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Defaulters List
              </Button>
            </Link>
            <Link href="/reports/finance/payment-history">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Payment History Report
              </Button>
            </Link>
            <Link href="/reports/finance/collection">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Payment Collection Summary
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Staff Reports
            </CardTitle>
            <CardDescription>Teacher and staff information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/reports/staff/list">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Teacher List Report
              </Button>
            </Link>
            <Link href="/reports/staff/assignments">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Teacher Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
