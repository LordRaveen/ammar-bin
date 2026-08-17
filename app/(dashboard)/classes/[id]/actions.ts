"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin, requireUser } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

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

export async function unassignClassTeacher(classId: string, teacherId: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Update class record if class_teacher_id matches
  await supabase
    .from("classes")
    .update({ class_teacher_id: null })
    .eq("id", classId)
    .eq("class_teacher_id", teacherId)

  // Remove teacher_class_assignments record
  const { error } = await supabase
    .from("teacher_class_assignments")
    .delete()
    .eq("class_id", classId)
    .eq("teacher_id", teacherId)

  if (error) throw new Error(error.message)
}

export async function assignSubjectTeacher(classId: string, teacherId: string, subjectId: string, sessionId: string) {
  await requireAdmin()
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("teacher_subject_assignments").upsert(
      {
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
        session_id: sessionId,
      },
      { onConflict: "teacher_id,class_id,subject_id" }
    )

    if (error) throw error
  } catch (err: any) {
    const isUniqueViolation = 
      err.code === "23505" || 
      (err.message && err.message.includes("teacher_subject_assignments_teacher_id_class_id_subject_id_key"))
    
    if (!isUniqueViolation) {
      throw new Error(err.message || "Failed to assign subject teacher")
    }
  }
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
    ca1: number | null
    ca2: number | null
    exam: number | null
  },
  remarks?: string,
  subjectComponentId?: string | null,
) {
  try {
    await requireUser()
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

    let maxCa = 40
    let maxExam = 60
    let caCount = 2

    if (subjectComponentId) {
      const { data: compLimits } = await supabase
        .from("class_subject_components")
        .select("max_ca, max_exam, ca_count")
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .eq("subject_component_id", subjectComponentId)
        .maybeSingle()

      if (compLimits) {
        if (compLimits.max_ca !== null && compLimits.max_ca !== undefined) maxCa = compLimits.max_ca
        if (compLimits.max_exam !== null && compLimits.max_exam !== undefined) maxExam = compLimits.max_exam
        if (compLimits.ca_count !== null && compLimits.ca_count !== undefined) caCount = compLimits.ca_count
      }
    } else {
      const { data: subjLimits } = await supabase
        .from("class_subjects")
        .select("ca_count")
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .maybeSingle()

      if (subjLimits) {
        if (subjLimits.ca_count !== null && subjLimits.ca_count !== undefined) caCount = subjLimits.ca_count
      }
    }

    // Calculate total and grade
    const ca1Val = scores.ca1 || 0
    const ca2Val = caCount === 1 ? 0 : (scores.ca2 || 0)
    const examVal = scores.exam || 0
    const total = ca1Val + ca2Val + examVal
    const grade = calculateGrade(total)
    const remark = remarks || generateRemark(total)

    // Assessment types we'll use (create if needed)
    const assessmentConfigs = []
    if (caCount === 1) {
      assessmentConfigs.push({ name: "CA Test 1", maxMarks: maxCa, score: scores.ca1 })
    } else {
      assessmentConfigs.push({ name: "CA Test 1", maxMarks: maxCa / 2, score: scores.ca1 })
      assessmentConfigs.push({ name: "CA Test 2", maxMarks: maxCa / 2, score: scores.ca2 })
    }
    assessmentConfigs.push({ name: "Exam", maxMarks: maxExam, score: scores.exam })

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
      let query = supabase
        .from("assessments")
        .select("id")
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("assessment_type_id", assessmentTypeId)

      if (subjectComponentId) {
        query = query.eq("subject_component_id", subjectComponentId)
      } else {
        query = query.is("subject_component_id", null)
      }

      const { data: existingAssessment, error: assessmentQueryError } = await query.maybeSingle()

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
            subject_component_id: subjectComponentId || null,
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

  const assessmentIds = assessments.map((a: any) => a.id)
  const { data: scores } = await supabase
    .from("student_scores")
    .select("score, assessment_id")
    .eq("student_id", studentId)
    .in("assessment_id", assessmentIds)

  if (!scores) return

  // Group by subject
  const subjectScores = new Map<string, number[]>()
  assessments.forEach((assessment: any) => {
    const subjectScores_arr = scores.filter((s: any) => s.assessment_id === assessment.id).map((s: any) => s.score)

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

  const passMarkMap = new Map((classSubjects || []).map((cs: any) => [cs.subject_id, cs.pass_mark]))

  subjectScores.forEach((scores, subjectId) => {
    const subjectTotal = scores.reduce((sum, score) => sum + score, 0)
    totalScore += subjectTotal
    totalSubjects++

    const passMark = Number(passMarkMap.get(subjectId)) || 40
    if (subjectTotal >= passMark) {
      subjectsPassed++
    } else {
      subjectsFailed++
    }
  })

  const averageScore = totalSubjects > 0 ? totalScore / totalSubjects : 0

  // Fetch existing student_result to preserve remarks & attendance
  const { data: existingResult } = await supabase
    .from("student_results")
    .select("teacher_remark, principal_remark, attendance_present, total_school_days")
    .eq("student_id", studentId)
    .eq("class_id", classId)
    .eq("session_id", sessionId)
    .eq("term_id", termId)
    .maybeSingle()

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
      teacher_remark: existingResult?.teacher_remark ?? null,
      principal_remark: existingResult?.principal_remark ?? null,
      attendance_present: existingResult?.attendance_present ?? null,
      total_school_days: existingResult?.total_school_days ?? null,
      generated_at: new Date().toISOString(),
    },
    {
      onConflict: "student_id,session_id,term_id",
    },
  )
}

export async function fetchGradingScheme() {
  const supabase = await createClient()

  const { data } = await supabase.from("grading_schemes").select("*").order("min_score", { ascending: false })

  return data || []
}

export async function updateClass(classId: string, data: { name?: string, capacity?: number, section_id?: string, is_active?: boolean }) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("classes")
    .update(data)
    .eq("id", classId)

  if (error) throw new Error(error.message)
}

export async function deleteClass(classId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId)

  if (error) throw new Error(error.message)
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

export async function saveBatchSubjectScores(payload: {
  classId: string
  sessionId: string
  termId: string
  subjectId: string
  scores: Array<{
    studentId: string
    ca1?: number | null
    ca2?: number | null
    exam?: number | null
    remark?: string
  }>
}) {
  const userSupabase = await createClient()

  const {
    data: { user },
  } = await userSupabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized user session" }
  }

  const { classId, sessionId, termId, subjectId, scores } = payload

  if (!classId || !sessionId || !termId || !subjectId) {
    return { success: false, error: "Missing required parameters (class, session, term, subject)" }
  }

  // Use Admin Client with service role key to bypass RLS restrictions (42501) on assessment creation & score upsert
  const db = createAdminClient()

  // 1. Get or create assessment types using canonical names
  const { data: typeList } = await db
    .from("assessment_types")
    .select("id, name")
    .in("name", ["CA Test 1", "CA Test 2", "Exam"])

  let ca1TypeId = typeList?.find((t: any) => t.name === "CA Test 1")?.id
  let ca2TypeId = typeList?.find((t: any) => t.name === "CA Test 2")?.id
  let examTypeId = typeList?.find((t: any) => t.name === "Exam")?.id

  if (!ca1TypeId) {
    const { data: newType, error: tErr1 } = await db
      .from("assessment_types")
      .insert({ name: "CA Test 1", max_score: 20, is_active: true })
      .select("id")
      .single()
    if (tErr1) console.error("Error creating CA Test 1 type:", tErr1)
    ca1TypeId = newType?.id
  }
  if (!ca2TypeId) {
    const { data: newType, error: tErr2 } = await db
      .from("assessment_types")
      .insert({ name: "CA Test 2", max_score: 20, is_active: true })
      .select("id")
      .single()
    if (tErr2) console.error("Error creating CA Test 2 type:", tErr2)
    ca2TypeId = newType?.id
  }
  if (!examTypeId) {
    const { data: newType, error: tErr3 } = await db
      .from("assessment_types")
      .insert({ name: "Exam", max_score: 60, is_active: true })
      .select("id")
      .single()
    if (tErr3) console.error("Error creating Exam type:", tErr3)
    examTypeId = newType?.id
  }

  // 2. Fetch existing assessments for this subject
  const { data: existingAssessments, error: fetchAssErr } = await db
    .from("assessments")
    .select("id, assessment_type_id")
    .eq("class_id", classId)
    .eq("session_id", sessionId)
    .eq("term_id", termId)
    .eq("subject_id", subjectId)

  if (fetchAssErr) {
    console.error("Error fetching existing assessments:", fetchAssErr)
  }

  let ca1AssessmentId = existingAssessments?.find((a: any) => a.assessment_type_id === ca1TypeId)?.id
  let ca2AssessmentId = existingAssessments?.find((a: any) => a.assessment_type_id === ca2TypeId)?.id
  let examAssessmentId = existingAssessments?.find((a: any) => a.assessment_type_id === examTypeId)?.id

  const today = new Date().toISOString().split("T")[0]

  // Create assessments if missing
  if (!ca1AssessmentId && ca1TypeId) {
    const { data: newAss, error: err1 } = await db
      .from("assessments")
      .insert({
        class_id: classId,
        session_id: sessionId,
        term_id: termId,
        subject_id: subjectId,
        assessment_type_id: ca1TypeId,
        total_marks: 20,
        date: today,
      })
      .select("id")
      .single()

    if (err1) {
      console.error("Error creating CA1 assessment:", err1)
    } else {
      ca1AssessmentId = newAss?.id
    }
  }

  if (!ca2AssessmentId && ca2TypeId) {
    const { data: newAss, error: err2 } = await db
      .from("assessments")
      .insert({
        class_id: classId,
        session_id: sessionId,
        term_id: termId,
        subject_id: subjectId,
        assessment_type_id: ca2TypeId,
        total_marks: 20,
        date: today,
      })
      .select("id")
      .single()

    if (err2) {
      console.error("Error creating CA2 assessment:", err2)
    } else {
      ca2AssessmentId = newAss?.id
    }
  }

  if (!examAssessmentId && examTypeId) {
    const { data: newAss, error: err3 } = await db
      .from("assessments")
      .insert({
        class_id: classId,
        session_id: sessionId,
        term_id: termId,
        subject_id: subjectId,
        assessment_type_id: examTypeId,
        total_marks: 60,
        date: today,
      })
      .select("id")
      .single()

    if (err3) {
      console.error("Error creating Exam assessment:", err3)
    } else {
      examAssessmentId = newAss?.id
    }
  }

  // 3. Build score rows to upsert
  const scoreRowsToUpsert: any[] = []

  const calcGrade = (total: number): string => {
    if (total >= 90) return "A+"
    if (total >= 80) return "A"
    if (total >= 70) return "B+"
    if (total >= 60) return "B"
    if (total >= 50) return "C"
    if (total >= 40) return "D"
    return "F"
  }

  const getAutoRemark = (grd: string): string => {
    switch (grd) {
      case "A+": return "Excellent Performance"
      case "A": return "Very Good"
      case "B+": return "Good Effort"
      case "B": return "Above Average"
      case "C": return "Fair"
      case "D": return "Needs Improvement"
      default: return "Unsatisfactory"
    }
  }

  scores.forEach((s) => {
    const ca1Num = s.ca1 !== undefined && s.ca1 !== null ? Number(s.ca1) : null
    const ca2Num = s.ca2 !== undefined && s.ca2 !== null ? Number(s.ca2) : null
    const examNum = s.exam !== undefined && s.exam !== null ? Number(s.exam) : null

    const total = (ca1Num || 0) + (ca2Num || 0) + (examNum || 0)
    const grade = calcGrade(total)
    const remark = s.remark || getAutoRemark(grade)

    if (ca1Num !== null && ca1AssessmentId) {
      scoreRowsToUpsert.push({
        student_id: s.studentId,
        assessment_id: ca1AssessmentId,
        score: ca1Num,
        grade,
        remarks: remark,
        entered_by: user.id,
      })
    }
    if (ca2Num !== null && ca2AssessmentId) {
      scoreRowsToUpsert.push({
        student_id: s.studentId,
        assessment_id: ca2AssessmentId,
        score: ca2Num,
        grade,
        remarks: remark,
        entered_by: user.id,
      })
    }
    if (examNum !== null && examAssessmentId) {
      scoreRowsToUpsert.push({
        student_id: s.studentId,
        assessment_id: examAssessmentId,
        score: examNum,
        grade,
        remarks: remark,
        entered_by: user.id,
      })
    }
  })

  if (scoreRowsToUpsert.length > 0) {
    const { error: batchErr } = await db
      .from("student_scores")
      .upsert(scoreRowsToUpsert, { onConflict: "student_id,assessment_id" })

    if (batchErr) {
      console.error("Batch score upsert error:", batchErr)
      return { success: false, error: `Failed to save scores: ${batchErr.message}` }
    }
  } else {
    return { success: false, error: "No score entries were generated to save" }
  }

  revalidatePath("/teacher/results")
  revalidatePath("/assessments/results/finalize")
  revalidatePath(`/classes/${classId}`)

  return { success: true, count: scoreRowsToUpsert.length }
}

export async function addStudentsToClass(studentIds: string[], classId: string, sessionId: string, termId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const records = studentIds.map((id) => ({
    student_id: id,
    class_id: classId,
    session_id: sessionId,
    term_id: termId,
    is_active: true,
  }))

  const { error } = await supabase.from("student_enrollments").insert(records)

  if (error) throw new Error(error.message)
}
