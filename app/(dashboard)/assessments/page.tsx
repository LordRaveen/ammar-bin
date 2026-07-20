import { requireAuth } from '@/lib/auth/get-user'
import { createServerClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AssessmentsPage() {
  await requireAuth(['super_admin', 'admin', 'teacher'])
  const supabase = await createServerClient()

  // Get active session and term
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('*, terms(*)')
    .eq('is_active', true)
    .single()

  const activeTerm = activeSession?.terms?.find((t: any) => t.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assessments & Grading
          </h1>
          <p className="text-muted-foreground">
            Enter scores and generate results
          </p>
        </div>
      </div>

      {activeSession && activeTerm ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/assessments/score-entry">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Score Entry
                </CardTitle>
                <CardDescription>
                  Enter student scores for assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Current: {activeSession.name} - {activeTerm.name}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/assessments/results">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex text-xl items-center gap-2">
                  View Results
                </CardTitle>
                <CardDescription>
                  Process and view student results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate report cards and view performance
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Session</CardTitle>
            <CardDescription>
              Please activate a session and term to start entering scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/sessions">
              <Button>Go to Sessions</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
