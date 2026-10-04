import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger'

import { getCurrentUser } from '@/lib/auth/get-user'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !['super_admin', 'admin', 'teacher', 'principal'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createServerClient()
    const formData = await request.formData()

    const scores: any[] = []

    // Parse all score entries
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('score_')) {
        const [, studentId, assessmentType] = key.split('_')
        
        if (!scores.find(s => s.studentId === studentId && s.type === assessmentType)) {
          scores.push({
            studentId,
            type: assessmentType,
            score: value,
          })
        }
      }
    }

    devLog('Saving scores:', scores)

    // Save each score
    for (const scoreData of scores) {
      const scoreInput = formData.get(`score_${scoreData.studentId}_${scoreData.type}`)
      const assessmentId = (scoreInput as any)?.['data-assessment-id']
      const scoreId = (scoreInput as any)?.['data-score-id']
      
      if (!assessmentId || !scoreData.score) continue

      const scoreValue = parseFloat(scoreData.score as string)
      
      if (scoreId) {
        // Update existing score
        await supabase
          .from('student_scores')
          .update({
            score: scoreValue,
            updated_at: new Date().toISOString(),
          })
          .eq('id', scoreId)
      } else {
        // Insert new score
        await supabase
          .from('student_scores')
          .insert({
            assessment_id: assessmentId,
            student_id: scoreData.studentId,
            score: scoreValue,
            entered_by: user.id,
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    devLog('Error saving scores:', error)
    return NextResponse.json(
      { error: 'Failed to save scores' },
      { status: 500 }
    )
  }
}
