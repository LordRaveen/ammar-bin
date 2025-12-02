'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generateClassResults(
  classId: string,
  sessionId: string,
  termId: string
) {
  const supabase = await createServerClient()

  try {
    // 1. Get all students in the class
    // We need to check enrollment or just get all students assigned to this class
    // Assuming students table has current class, or we check enrollment history.
    // For simplicity, let's assume we check the 'students' table for current class 
    // OR check 'student_enrollments' if available.
    // Based on schema, 'student_enrollments' links student to class/session/term.
    
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('class_id', classId)
      .eq('session_id', sessionId)
      .eq('term_id', termId)

    if (enrollError) throw enrollError

    if (!enrollments || enrollments.length === 0) {
      return { success: false, error: 'No students found enrolled in this class for the selected session and term.' }
    }

    const studentIds = enrollments.map(e => e.student_id)

    // 2. Get class subjects to know pass marks
    const { data: classSubjects, error: subjectsError } = await supabase
      .from('class_subjects')
      .select('subject_id, pass_mark')
      .eq('class_id', classId)

    if (subjectsError) throw subjectsError
    
    const passMarks = new Map(classSubjects?.map(s => [s.subject_id, s.pass_mark || 50]) || [])

    // 3. Get all scores for these students
    // We need to join with assessments to filter by session/term/class
    const { data: scores, error: scoresError } = await supabase
      .from('student_scores')
      .select(`
        student_id,
        score,
        assessments!inner (
          subject_id,
          session_id,
          term_id,
          class_id
        )
      `)
      .in('student_id', studentIds)
      .eq('assessments.session_id', sessionId)
      .eq('assessments.term_id', termId)
      .eq('assessments.class_id', classId)

    if (scoresError) throw scoresError

    // 4. Process scores per student
    const studentResults = new Map()

    // Initialize results for all enrolled students (even those with no scores)
    studentIds.forEach(id => {
      studentResults.set(id, {
        totalScore: 0,
        subjects: new Map(), // subject_id -> total score for that subject
      })
    })

    // Aggregate scores by student and subject
    scores?.forEach((record: any) => {
      const studentId = record.student_id
      const subjectId = record.assessments.subject_id
      const score = Number(record.score) || 0

      const studentData = studentResults.get(studentId)
      if (studentData) {
        const currentSubjectScore = studentData.subjects.get(subjectId) || 0
        studentData.subjects.set(subjectId, currentSubjectScore + score)
      }
    })

    // Calculate final stats for each student
    const finalResults = []

    for (const [studentId, data] of studentResults.entries()) {
      let totalScore = 0
      let subjectsPassed = 0
      let subjectsFailed = 0
      let totalSubjects = data.subjects.size

      for (const [subjectId, score] of data.subjects.entries()) {
        totalScore += score
        const passMark = passMarks.get(subjectId) || 50
        if (score >= passMark) {
          subjectsPassed++
        } else {
          subjectsFailed++
        }
      }

      const averageScore = totalSubjects > 0 ? totalScore / totalSubjects : 0

      finalResults.push({
        student_id: studentId,
        class_id: classId,
        session_id: sessionId,
        term_id: termId,
        total_score: totalScore,
        average_score: averageScore,
        total_subjects: totalSubjects,
        subjects_passed: subjectsPassed,
        subjects_failed: subjectsFailed,
        generated_at: new Date().toISOString()
      })
    }

    // 5. Calculate positions
    // Sort by average score descending
    finalResults.sort((a, b) => b.average_score - a.average_score)

    // Assign positions (handling ties if needed, but simple rank for now)
    finalResults.forEach((result, index) => {
      // @ts-ignore
      result.position = index + 1
    })

    // 6. Upsert into student_results
    // We'll do this in a loop or bulk upsert if possible. 
    // Supabase upsert works well.
    
    // We need to handle the case where we want to update existing records based on student_id, class, session, term
    // The unique constraint might not be set up on these 4 fields combined in the DB schema provided.
    // So we might need to delete existing for this batch and insert new, OR rely on an ID.
    // Let's try to delete existing results for this class/session/term first to be safe and avoid duplicates if no unique constraint exists.
    
    const { error: deleteError } = await supabase
      .from('student_results')
      .delete()
      .eq('class_id', classId)
      .eq('session_id', sessionId)
      .eq('term_id', termId)
    
    if (deleteError) throw deleteError

    if (finalResults.length > 0) {
      const { error: insertError } = await supabase
        .from('student_results')
        .insert(finalResults)
      
      if (insertError) throw insertError
    }

    revalidatePath('/assessments/results')
    return { success: true, message: `Results generated for ${finalResults.length} students.` }

  } catch (error: any) {
    console.error('Error generating results:', error)
    return { success: false, error: error.message }
  }
}
