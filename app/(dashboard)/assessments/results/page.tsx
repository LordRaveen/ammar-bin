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
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { ResultsFilter } from '@/components/results-filter'
import { GenerateResultsButton } from '@/components/generate-results-button'

export const dynamic = 'force-dynamic'

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; session?: string; term?: string }>
}) {
  await requireAuth(['super_admin', 'admin', 'teacher'])
  const params = await searchParams
  const supabase = await createServerClient()

  console.log('[v0] Results page searchParams:', params)

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, is_active')
    .order('start_date', { ascending: false })

  const { data: terms } = await supabase
    .from('terms')
    .select('id, name, session_id, is_active')
    .order('start_date', { ascending: false })

  let selectedSession = params.session
  let selectedTerm = params.term

  if (!selectedSession) {
    const activeSession = sessions?.find((s: any) => s.is_active)
    selectedSession = activeSession?.id
  }

  if (!selectedTerm && selectedSession) {
    const activeTerm = terms?.find(
      (t: any) => t.session_id === selectedSession && t.is_active
    )
    selectedTerm = activeTerm?.id
  }

  // Get all classes
  const { data: classes } = await supabase
    .from('classes')
    .select('*, sections(name)')
    .eq('is_active', true)
    .order('name')

  // Get results if class, session, and term selected
  let results = null
  if (params.class && selectedSession && selectedTerm) {
    console.log('[v0] Fetching results for:', {
      class: params.class,
      session: selectedSession,
      term: selectedTerm,
    })

    const { data, error } = await supabase
      .from('student_results')
      .select(`
        *,
        students (
          id,
          student_id,
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('class_id', params.class)
      .eq('session_id', selectedSession)
      .eq('term_id', selectedTerm)
      .order('position')

    if (error) {
      console.error('[v0] Error fetching results:', error)
    } else {
      console.log('[v0] Fetched results:', data?.length || 0, 'records')
    }

    results = data || []
  }

  const hasResults = results && results.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/assessments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">View Results</h1>
            <p className="text-muted-foreground">
              Process and view student results
            </p>
          </div>
        </div>
        
        {params.class && selectedSession && selectedTerm && (
          <GenerateResultsButton 
            classId={params.class}
            sessionId={selectedSession}
            termId={selectedTerm}
            hasResults={!!hasResults}
          />
        )}
      </div>

      <ResultsFilter 
        sessions={sessions || []}
        terms={terms || []}
        classes={classes || []}
        defaultSession={selectedSession}
        defaultTerm={selectedTerm}
      />

      {params.class && selectedSession && selectedTerm && (!results || results.length === 0) && (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center py-10 space-y-4">
            <p className="text-muted-foreground text-center">
              No results found for the selected class, session, and term. 
              Results need to be generated first from student scores.
            </p>
            <GenerateResultsButton 
              classId={params.class}
              sessionId={selectedSession}
              termId={selectedTerm}
              hasResults={false}
            />
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Class Results</CardTitle>
            <CardDescription>
              {results.length} student(s) in class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Position</th>
                    <th className="text-left p-2">Student ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-center p-2">Total Score</th>
                    <th className="text-center p-2">Average</th>
                    <th className="text-center p-2">Subjects</th>
                    <th className="text-center p-2">Passed</th>
                    <th className="text-center p-2">Failed</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result: any) => (
                    <tr key={result.id} className="border-b">
                      <td className="p-2">
                        <Badge>{result.position}</Badge>
                      </td>
                      <td className="p-2">{result.students.student_id}</td>
                      <td className="p-2">
                        {result.students.first_name} {result.students.last_name}
                      </td>
                      <td className="p-2 text-center font-medium">
                        {result.total_score?.toFixed(1) || '0.0'}
                      </td>
                      <td className="p-2 text-center">
                        {result.average_score?.toFixed(1) || '0.0'}%
                      </td>
                      <td className="p-2 text-center">
                        {result.total_subjects || 0}
                      </td>
                      <td className="p-2 text-center text-green-600 font-medium">
                        {result.subjects_passed || 0}
                      </td>
                      <td className="p-2 text-center text-red-600 font-medium">
                        {result.subjects_failed || 0}
                      </td>
                      <td className="p-2">
                        <Link
                          href={`/assessments/results/${result.student_id}?session=${selectedSession}&term=${selectedTerm}`}
                        >
                          <Button size="sm" variant="outline">
                            <Printer className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
