"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/get-user"

export async function addStudentToClass(studentId: string, classId: string, sessionId: string, termId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("student_enrollments").insert({
    student_id: studentId,
    class_id: classId,
    session_id: sessionId,
    term_id: termId,
    is_active: true,
  })

  if (error) throw new Error(error.message)
}

export async function removeStudentFromClass(enrollmentId: string, classId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("student_enrollments").delete().eq("id", enrollmentId)

  if (error) throw new Error(error.message)
  // Realtime subscription handles updates
}

export async function moveStudentToClass(enrollmentId: string, newClassId: string, oldClassId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("student_enrollments").update({ class_id: newClassId }).eq("id", enrollmentId)

  if (error) throw new Error(error.message)
}

export async function addSubjectToClass(classId: string, subjectId: string, maxScore: number, passMark: number) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("class_subjects").insert({
    class_id: classId,
    subject_id: subjectId,
    max_score: maxScore,
    pass_mark: passMark,
  })

  if (error) throw new Error(error.message)
}

export async function removeSubjectFromClass(classSubjectId: string, classId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("class_subjects").delete().eq("id", classSubjectId)

  if (error) throw new Error(error.message)
  // Realtime subscription handles updates
}

export async function updateClassSubject(classSubjectId: string, maxScore: number, passMark: number, classId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("class_subjects")
    .update({ max_score: maxScore, pass_mark: passMark })
    .eq("id", classSubjectId)

  if (error) throw new Error(error.message)
}

export async function assignClassTeacher(classId: string, teacherId: string, sessionId: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Update the class record
  const { error: classError } = await supabase.from("classes").update({ class_teacher_id: teacherId }).eq("id", classId)

  if (classError) throw new Error(classError.message)

  // Create teacher assignment record
  const { error: assignmentError } = await supabase.from("teacher_class_assignments").upsert({
    teacher_id: teacherId,
    class_id: classId,
    session_id: sessionId,
    is_class_teacher: true,
  })

  if (assignmentError) throw new Error(assignmentError.message)
}

export async function assignSubjectTeacher(classId: string, teacherId: string, subjectId: string, sessionId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("teacher_subject_assignments").upsert({
    teacher_id: teacherId,
    class_id: classId,
    subject_id: subjectId,
    session_id: sessionId,
  })

  if (error) throw new Error(error.message)
}

export async function removeSubjectTeacher(classId: string, subjectId: string, sessionId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("teacher_subject_assignments")
    .delete()
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("session_id", sessionId)

  if (error) throw new Error(error.message)
  // Realtime subscription handles updates
}

export async function saveStudentScore(
  studentId: string,
  subjectId: string,
  classId: string,
  sessionId: string,
  termId: string,
  scores: {
    ca1: number
    ca2: number
    exam: number
  },
  remarks?: string,
) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError) {
      return { success: false, error: `Authentication failed: ${authError.message}` }
    }
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const enteredById = user.id

    // Calculate total and grade
    const total = scores.ca1 + scores.ca2 + scores.exam
    const grade = calculateGrade(total)
    const remark = remarks || generateRemark(total)

    // Assessment types we'll use (create if needed)
    const assessmentConfigs = [
      { name: "CA Test 1", maxMarks: 20, score: scores.ca1 },
      { name: "CA Test 2", maxMarks: 20, score: scores.ca2 },
      { name: "Exam", maxMarks: 60, score: scores.exam },
    ]

    for (const config of assessmentConfigs) {
      // Get or create assessment type
      let assessmentTypeId: string

      const { data: existingType, error: typeQueryError } = await supabase
        .from("assessment_types")
        .select("id")
        .eq("name", config.name)
        .eq("is_active", true)
        .maybeSingle()

      if (typeQueryError) {
        return { success: false, error: `Failed to query assessment type: ${typeQueryError.message}` }
      }

      if (existingType) {
        assessmentTypeId = existingType.id
      } else {
        // Create assessment type if it doesn't exist
        const { data: newType, error: typeError } = await supabase
          .from("assessment_types")
          .insert({
            name: config.name,
            max_score: config.maxMarks,
            description: `${config.name} assessment`,
            is_active: true,
          })
          .select()
          .single()

        if (typeError) {
          return { success: false, error: `Failed to create assessment type: ${typeError.message}` }
        }
        assessmentTypeId = newType.id
      }

      // Get or create assessment
      const { data: existingAssessment, error: assessmentQueryError } = await supabase
        .from("assessments")
        .select("id")
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("assessment_type_id", assessmentTypeId)
        .maybeSingle()

      if (assessmentQueryError) {
        return { success: false, error: `Failed to query assessment: ${assessmentQueryError.message}` }
      }

      let assessmentId: string

      if (existingAssessment) {
        assessmentId = existingAssessment.id
      } else {
        // Create new assessment
        const { data: newAssessment, error: assessmentError } = await supabase
          .from("assessments")
          .insert({
            class_id: classId,
            subject_id: subjectId,
            session_id: sessionId,
            term_id: termId,
            assessment_type_id: assessmentTypeId,
            total_marks: config.maxMarks,
            date: new Date().toISOString().split("T")[0],
          })
          .select()
          .single()

        if (assessmentError) {
          return { success: false, error: `Failed to create assessment: ${assessmentError.message}` }
        }
        assessmentId = newAssessment.id
      }

      // Upsert student score
      const { error: scoreError } = await supabase.from("student_scores").upsert(
        {
          student_id: studentId,
          assessment_id: assessmentId,
          score: config.score,
          grade: grade,
          remarks: remark,
          entered_by: enteredById,
        },
        {
          onConflict: "student_id,assessment_id",
        },
      )

      if (scoreError) {
        return { success: false, error: `Failed to save score: ${scoreError.message}` }
      }
    }

    // Update or create student result summary
    await updateStudentResult(studentId, classId, sessionId, termId, supabase)

    return { success: true, total, grade, remark }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "An unexpected error occurred while saving score" }
  }
}

async function updateStudentResult(
  studentId: string,
  classId: string,
  sessionId: string,
  termId: string,
  supabase: any,
) {
  // Fetch all scores for this student in this term
  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, subject_id")
    .eq("class_id", classId)
    .eq("session_id", sessionId)
    .eq("term_id", termId)

  if (!assessments || assessments.length === 0) return

  const assessmentIds = assessments.map((a) => a.id)
  const { data: scores } = await supabase
    .from("student_scores")
    .select("score, assessment_id")
    .eq("student_id", studentId)
    .in("assessment_id", assessmentIds)

  if (!scores) return

  // Group by subject
  const subjectScores = new Map<string, number[]>()
  assessments.forEach((assessment) => {
    const subjectScores_arr = scores.filter((s) => s.assessment_id === assessment.id).map((s) => s.score)

    if (subjectScores_arr.length > 0) {
      if (!subjectScores.has(assessment.subject_id)) {
        subjectScores.set(assessment.subject_id, [])
      }
      subjectScores.get(assessment.subject_id)!.push(...subjectScores_arr)
    }
  })

  // Calculate total and average
  let totalScore = 0
  let totalSubjects = 0
  let subjectsPassed = 0
  let subjectsFailed = 0

  const { data: classSubjects } = await supabase
    .from("class_subjects")
    .select("subject_id, pass_mark")
    .eq("class_id", classId)

  const passMarkMap = new Map((classSubjects || []).map((cs) => [cs.subject_id, cs.pass_mark]))

  subjectScores.forEach((scores, subjectId) => {
    const subjectTotal = scores.reduce((sum, score) => sum + score, 0)
    totalScore += subjectTotal
    totalSubjects++

    const passMark = passMarkMap.get(subjectId) || 40
    if (subjectTotal >= passMark) {
      subjectsPassed++
    } else {
      subjectsFailed++
    }
  })

  const averageScore = totalSubjects > 0 ? totalScore / totalSubjects : 0

  // Upsert student result
  await supabase.from("student_results").upsert(
    {
      student_id: studentId,
      class_id: classId,
      session_id: sessionId,
      term_id: termId,
      total_score: totalScore,
      average_score: averageScore,
      total_subjects: totalSubjects,
      subjects_passed: subjectsPassed,
      subjects_failed: subjectsFailed,
      generated_at: new Date().toISOString(),
    },
    {
      onConflict: "student_id,class_id,session_id,term_id",
    },
  )
}

export async function fetchGradingScheme() {
  const supabase = await createClient()

  const { data } = await supabase.from("grading_schemes").select("*").order("min_score", { ascending: false })

  return data || []
}

function calculateGrade(score: number): string {
  if (score >= 90) return "A+"
  if (score >= 80) return "A"
  if (score >= 70) return "B+"
  if (score >= 60) return "B"
  if (score >= 50) return "C"
  if (score >= 40) return "D"
  return "F"
}

function generateRemark(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Very Good"
  if (score >= 70) return "Good"
  if (score >= 60) return "Fair"
  if (score >= 50) return "Pass"
  if (score >= 40) return "Weak"
  return "Fail"
}
