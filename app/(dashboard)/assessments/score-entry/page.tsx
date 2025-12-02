import { requireAuth } from '@/lib/auth/get-user'
import { createServerClient } from '@/lib/supabase/server'
import { ScoreEntryWithClassSelector } from '@/components/score-entry-with-class-selector'

export const dynamic = 'force-dynamic'

export default async function ScoreEntryPage({
  searchParams,
}: {
  searchParams: { class?: string }
}) {
  await requireAuth(['super_admin', 'admin', 'teacher'])
  const supabase = await createServerClient()

  // Get active session and term
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('*, terms(*)')
    .eq('is_active', true)
    .single()

  const activeTerm = activeSession?.terms?.find((t: any) => t.is_active)

  if (!activeSession || !activeTerm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Score Entry</h1>
          <p className="text-muted-foreground">
            Enter student assessment scores
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No active session or term found. Please activate a session and term first.
          </p>
        </div>
      </div>
    )
  }

  // Get all classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, sections(name)')
    .eq('is_active', true)
    .order('name')

  return (
    <ScoreEntryWithClassSelector
      classes={classes || []}
      sessionId={activeSession.id}
      sessionName={activeSession.name}
      termId={activeTerm.id}
      termName={activeTerm.name}
      initialClassId={searchParams.class}
    />
  )
}
