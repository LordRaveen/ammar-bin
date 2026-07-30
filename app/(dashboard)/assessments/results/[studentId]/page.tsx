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
        assessment_types(name, max_score),
        subject_component:subject_components(id, name)
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

  // Fetch class-wide subject statistics (min, max, average)
  const classId = activeEnrollment?.class_id
  const classStats: Record<string, { min: number; max: number; average: number }> = {}

  if (classId) {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, subject:subjects(name)')
      .eq('class_id', classId)
      .eq('session_id', sessionId)
      .eq('term_id', termId)

    if (assessments && assessments.length > 0) {
      const assSubjMap = new Map(assessments.map((a: any) => [a.id, a.subject?.name]))
      const assessmentIds = assessments.map((a: any) => a.id)

      const { data: classScores } = await supabase
        .from('student_scores')
        .select('student_id, score, assessment_id')
        .in('assessment_id', assessmentIds)

      const subjectStudentTotals: Record<string, Record<string, number>> = {}

      classScores?.forEach((item: any) => {
        const subjName = assSubjMap.get(item.assessment_id)
        const stId = item.student_id
        if (!subjName || !stId) return

        if (!subjectStudentTotals[subjName]) {
          subjectStudentTotals[subjName] = {}
        }
        if (!subjectStudentTotals[subjName][stId]) {
          subjectStudentTotals[subjName][stId] = 0
        }
        subjectStudentTotals[subjName][stId] += item.score || 0
      })

      Object.entries(subjectStudentTotals).forEach(([subjName, stTotals]) => {
        const studentCount = Object.keys(stTotals).length
        if (studentCount > 0) {
          const totalScores = Object.values(stTotals)
          const totalSum = totalScores.reduce((sum, val) => sum + val, 0)
          classStats[subjName] = {
            min: Math.min(...totalScores),
            max: Math.max(...totalScores),
            average: Math.round((totalSum / studentCount) * 100) / 100
          }
        }
      })
    }
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
    const subjectNameRaw = score.assessments?.subjects?.name
    const subjectCode = score.assessments?.subjects?.code
    const subjectComponent = score.assessments?.subject_component
    const subjectName = subjectComponent
      ? `${subjectNameRaw}: ${subjectComponent.name}`
      : subjectNameRaw
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
        classMin: classStats[subjectNameRaw]?.min ?? null,
        classMax: classStats[subjectNameRaw]?.max ?? null,
        classAvg: classStats[subjectNameRaw]?.average ?? null,
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
