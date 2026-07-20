import { requireAuth } from '@/lib/auth/get-user'
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReportCardClient } from '@/components/report-card-client'

export const dynamic = 'force-dynamic'

export default async function ReportCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ session?: string; term?: string }>
}) {
  await requireAuth(['super_admin', 'admin', 'teacher'])
  const supabase = await createServerClient()

  const { studentId } = await params
  const { session: sessionId, term: termId } = await searchParams

  if (!sessionId || !termId) {
    return notFound()
  }

  // Fetch student details with active class enrollment
  const { data: student } = await supabase
    .from('students')
    .select(`
      *,
      student_enrollments(
        is_active,
        class:classes(
          id,
          name,
          section:sections(name)
        )
      )
    `)
    .eq('id', studentId)
    .single()

  if (!student) {
    return notFound()
  }

  // Find active or first enrollment class mapping to match component expected student.classes
  const activeEnrollment = student.student_enrollments?.find((e: any) => e.is_active) || student.student_enrollments?.[0]
  const studentClass = activeEnrollment?.class || null

  const studentWithClass = {
    ...student,
    classes: studentClass ? {
      name: studentClass.name,
      sections: studentClass.section
    } : null
  }

  // Fetch session and term details
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  const { data: term } = await supabase
    .from('terms')
    .select('*')
    .eq('id', termId)
    .single()

  // Fetch student result summary
  const { data: result } = await supabase
    .from('student_results')
    .select('*')
    .eq('student_id', studentId)
    .eq('session_id', sessionId)
    .eq('term_id', termId)
    .single()

  // Fetch all subject scores
  const { data: scores, error: scoresError } = await supabase
    .from('student_scores')
    .select(`
      *,
      assessments!inner(
        id,
        assessment_type_id,
        session_id,
        term_id,
        subjects(
          name,
          code
        ),
        assessment_types(name, max_score)
      )
    `)
    .eq('student_id', studentId)
    .eq('assessments.session_id', sessionId)
    .eq('assessments.term_id', termId)

  // Write debug log
  try {
    const fs = require('fs')
    const path = require('path')
    const logPath = path.join(process.cwd(), 'query_debug.log')
    const logData = {
      timestamp: new Date().toISOString(),
      studentId,
      sessionId,
      termId,
      result,
      scoresLength: scores?.length || 0,
      scoresError,
      scoresSample: scores ? scores.slice(0, 2) : null
    }
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2))
  } catch (e) {
    console.error("Failed to write query debug log:", e)
  }

  // Fetch school details
  const { data: school } = await supabase
    .from('school_settings')
    .select('*')
    .single()

  // Fetch student skills
  const { data: skills } = await supabase
    .from('student_skills')
    .select('*')
    .eq('student_id', studentId)
    .eq('session_id', sessionId)
    .eq('term_id', termId)

  // Group scores by subject
  const subjectScores: Record<string, any> = {}
  scores?.forEach((score: any) => {
    const subjectName = score.assessments?.subjects?.name
    const subjectCode = score.assessments?.subjects?.code
    const assessmentType = score.assessments?.assessment_types?.name

    if (!subjectName) return

    if (!subjectScores[subjectName]) {
      subjectScores[subjectName] = {
        code: subjectCode,
        ca1: 0,
        ca2: 0,
        exam: 0,
        total: 0,
        grade: '',
        remark: '',
      }
    }

    if (assessmentType === 'CA Test 1') {
      subjectScores[subjectName].ca1 = score.score || 0
    } else if (assessmentType === 'CA Test 2') {
      subjectScores[subjectName].ca2 = score.score || 0
    } else if (assessmentType === 'Exam') {
      subjectScores[subjectName].exam = score.score || 0
    }

    subjectScores[subjectName].total =
      subjectScores[subjectName].ca1 +
      subjectScores[subjectName].ca2 +
      subjectScores[subjectName].exam
      
    if (score.grade) {
      subjectScores[subjectName].grade = score.grade
    }
    if (score.remarks) {
      subjectScores[subjectName].remark = score.remarks
    }
  })

  return (
    <ReportCardClient
      student={studentWithClass}
      session={session}
      term={term}
      result={result}
      subjectScores={subjectScores}
      school={school}
      skills={skills || []}
    />
  )
}
