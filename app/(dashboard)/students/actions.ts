"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"
import { devLog } from "@/lib/logger"

export interface BulkStudentRow {
  first_name: string
  middle_name: string | null
  last_name: string
  student_id: string
  class_name: string
  gender?: string
}

export interface BulkImportPayload {
  sectionId: string
  sectionName?: string
  students: BulkStudentRow[]
}

export async function bulkImportStudents(payload: BulkImportPayload) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    const { sectionId, sectionName, students } = payload

    if (!students || students.length === 0) {
      return { success: false, error: "No student records provided to import." }
    }

    // 1. Resolve Section
    let targetSectionId = sectionId

    if (!targetSectionId && sectionName) {
      // Find section by name
      const { data: existingSec } = await adminClient
        .from("sections")
        .select("id")
        .ilike("name", sectionName.trim())
        .single()

      if (existingSec) {
        targetSectionId = existingSec.id
      } else {
        // Create new section
        const { data: newSec, error: secErr } = await adminClient
          .from("sections")
          .insert({
            name: sectionName.trim(),
            description: `${sectionName.trim()} Section`,
            is_active: true,
          })
          .select("id")
          .single()

        if (secErr) {
          throw new Error(`Failed to create section '${sectionName}': ${secErr.message}`)
        }
        targetSectionId = newSec.id
      }
    }

    if (!targetSectionId) {
      return { success: false, error: "Target section is required." }
    }

    // 2. Resolve Active Session & Term
    const { data: activeSession } = await adminClient
      .from("sessions")
      .select("id")
      .eq("is_active", true)
      .single()

    const sessionId = activeSession?.id
    if (!sessionId) {
      return { success: false, error: "No active academic session found. Please activate a session first." }
    }

    const { data: activeTerm } = await adminClient
      .from("terms")
      .select("id")
      .eq("session_id", sessionId)
      .eq("is_active", true)
      .single()

    const termId = activeTerm?.id

    // 3. Resolve & Auto-Create Classes for this Section
    const { data: existingClasses } = await adminClient
      .from("classes")
      .select("id, name")
      .eq("section_id", targetSectionId)

    const classMap = new Map<string, string>() // normalized lower_name -> class_id
    existingClasses?.forEach((c: any) => {
      classMap.set(c.name.trim().toLowerCase(), c.id)
    })

    // Find distinct class names in payload
    const distinctClassNames = Array.from(
      new Set(students.map((s) => s.class_name.trim()).filter(Boolean))
    )

    let createdClassesCount = 0

    for (const rawClassName of distinctClassNames) {
      const normalized = rawClassName.toLowerCase()
      if (!classMap.has(normalized)) {
        // Create missing class for this section
        const { data: newClass, error: classErr } = await adminClient
          .from("classes")
          .insert({
            name: rawClassName,
            section_id: targetSectionId,
            is_active: true,
          })
          .select("id, name")
          .single()

        if (classErr) {
          devLog.error(`Error creating class ${rawClassName}:`, classErr)
          throw new Error(`Failed to create class '${rawClassName}': ${classErr.message}`)
        }

        classMap.set(normalized, newClass.id)
        createdClassesCount++
      }
    }

    // 4. Batch Upsert Students
    const studentsPayload = students.map((s) => ({
      student_id: s.student_id.trim(),
      first_name: s.first_name.trim(),
      middle_name: s.middle_name ? s.middle_name.trim() : null,
      last_name: s.last_name.trim(),
      gender: s.gender || "Male",
      status: "Active",
      nationality: "Nigerian",
      admission_date: new Date().toISOString().split("T")[0],
    }))

    const { data: insertedStudents, error: studentErr } = await adminClient
      .from("students")
      .upsert(studentsPayload, { onConflict: "student_id" })
      .select("id, student_id")

    if (studentErr) {
      devLog.error("Error batch inserting students:", studentErr)
      throw new Error(`Failed to insert students: ${studentErr.message}`)
    }

    // Map inserted student_id to database ID
    const studentDbIdMap = new Map<string, string>()
    insertedStudents?.forEach((st: any) => {
      studentDbIdMap.set(st.student_id, st.id)
    })

    // 5. Batch Upsert Enrollments
    const enrollmentsPayload: any[] = []

    students.forEach((s) => {
      const dbStudentId = studentDbIdMap.get(s.student_id.trim())
      const targetClassId = classMap.get(s.class_name.trim().toLowerCase())

      if (dbStudentId && targetClassId) {
        enrollmentsPayload.push({
          student_id: dbStudentId,
          class_id: targetClassId,
          session_id: sessionId,
          term_id: termId || null,
          is_active: true,
        })
      }
    })

    if (enrollmentsPayload.length > 0) {
      const { error: enrollErr } = await adminClient
        .from("student_enrollments")
        .upsert(enrollmentsPayload, { onConflict: "student_id,session_id" })

      if (enrollErr) {
        devLog.error("Error batch inserting enrollments:", enrollErr)
        try {
          await adminClient.from("student_enrollments").insert(enrollmentsPayload)
        } catch (e) {
          devLog.warn("Notice inserting enrollments fallback:", e)
        }
      }
    }

    revalidatePath("/students")
    return {
      success: true,
      count: insertedStudents?.length || students.length,
      createdClassesCount,
    }
  } catch (error: any) {
    devLog.error("Error in bulkImportStudents:", error)
    return { success: false, error: error.message || "Failed to bulk import students." }
  }
}

export async function deleteStudent(studentId: string) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("students")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", studentId)

    if (error) throw error
    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateStudent(arg1: any, arg2?: any) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    let studentId: string | null = null
    let firstName: string | null = null
    let middleName: string | null = null
    let lastName: string | null = null
    let gender: string | null = null
    let dateOfBirth: string | null = null

    if (arg1 instanceof FormData) {
      studentId = arg1.get("student_id") as string || arg1.get("id") as string
      firstName = arg1.get("first_name") as string
      middleName = arg1.get("middle_name") as string
      lastName = arg1.get("last_name") as string
      gender = arg1.get("gender") as string
      dateOfBirth = arg1.get("date_of_birth") as string
    } else {
      studentId = arg1
      if (arg2 instanceof FormData) {
        firstName = arg2.get("first_name") as string
        middleName = arg2.get("middle_name") as string
        lastName = arg2.get("last_name") as string
        gender = arg2.get("gender") as string
        dateOfBirth = arg2.get("date_of_birth") as string
      } else if (typeof arg2 === "object" && arg2 !== null) {
        firstName = arg2.first_name
        middleName = arg2.middle_name
        lastName = arg2.last_name
        gender = arg2.gender
        dateOfBirth = arg2.date_of_birth
      }
    }

    if (!studentId) {
      return { success: false, error: "Student ID is required." }
    }

    const { error } = await adminClient
      .from("students")
      .update({
        ...(firstName && { first_name: firstName }),
        ...(middleName !== undefined && { middle_name: middleName || null }),
        ...(lastName && { last_name: lastName }),
        ...(gender && { gender }),
        ...(dateOfBirth !== undefined && { date_of_birth: dateOfBirth || null }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId)

    if (error) throw error
    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function enrollStudent(arg1: any, arg2?: any, arg3?: any, arg4?: any) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    let studentId: string | null = null
    let classId: string | null = null
    let tahfeezClassId: string | null = null
    let sessionId: string | null = null
    let termId: string | null = null

    if (arg1 instanceof FormData) {
      studentId = arg1.get("student_id") as string
      classId = arg1.get("class_id") as string
      tahfeezClassId = arg1.get("tahfeez_class_id") as string
      sessionId = arg1.get("session_id") as string
      termId = arg1.get("term_id") as string
    } else {
      studentId = arg1
      classId = arg2
      sessionId = arg3
      termId = arg4
    }

    if (!studentId || (!classId && !tahfeezClassId)) {
      return { success: false, error: "Student ID and Class ID are required for enrollment." }
    }

    // Resolve active session if missing
    if (!sessionId) {
      const { data: actSession } = await adminClient
        .from("sessions")
        .select("id")
        .eq("is_active", true)
        .single()
      sessionId = actSession?.id || null
    }

    if (!sessionId) {
      return { success: false, error: "No active session found." }
    }

    // Fetch student profile to get enrollment_type
    const { data: student } = await adminClient
      .from("students")
      .select("enrollment_type")
      .eq("id", studentId)
      .single()

    const enrollmentType = student?.enrollment_type || "islamiyya"

    // Set previous enrollments of the same section in this session to inactive
    const classIdsToCheck = [classId, tahfeezClassId].filter(Boolean) as string[]
    
    if (classIdsToCheck.length > 0) {
      // 1. Fetch sections of the classes being enrolled into
      const { data: classesWithSections } = await adminClient
        .from("classes")
        .select("id, section_id")
        .in("id", classIdsToCheck)

      const sectionIdsToDeactivate = classesWithSections?.map(c => c.section_id).filter(Boolean) || []

      if (sectionIdsToDeactivate.length > 0) {
        // 2. Fetch active enrollments for this student in this session
        const { data: activeEnrollments } = await adminClient
          .from("student_enrollments")
          .select("id, class_id, classes(section_id)")
          .eq("student_id", studentId)
          .eq("session_id", sessionId)
          .eq("is_active", true)

        // 3. Filter enrollments that belong to the target sections
        const enrollmentIdsToDeactivate = activeEnrollments
          ?.filter((e: any) => e.classes && sectionIdsToDeactivate.includes(e.classes.section_id))
          .map((e: any) => e.id) || []

        if (enrollmentIdsToDeactivate.length > 0) {
          // 4. Set only those enrollments to inactive
          await adminClient
            .from("student_enrollments")
            .update({ is_active: false })
            .in("id", enrollmentIdsToDeactivate)
        }
      }
    }

    const enrollmentsToUpsert = []

    if (enrollmentType === "combined") {
      if (classId) {
        enrollmentsToUpsert.push({
          student_id: studentId,
          class_id: classId,
          session_id: sessionId,
          term_id: termId || null,
          is_active: true,
        })
      }
      if (tahfeezClassId) {
        enrollmentsToUpsert.push({
          student_id: studentId,
          class_id: tahfeezClassId,
          session_id: sessionId,
          term_id: termId || null,
          is_active: true,
        })
      }
    } else {
      const selectedClassId = classId || tahfeezClassId
      if (selectedClassId) {
        enrollmentsToUpsert.push({
          student_id: studentId,
          class_id: selectedClassId,
          session_id: sessionId,
          term_id: termId || null,
          is_active: true,
        })
      }
    }

    if (enrollmentsToUpsert.length > 0) {
      const { error } = await adminClient
        .from("student_enrollments")
        .upsert(enrollmentsToUpsert, { onConflict: "student_id,session_id,class_id" })

      if (error) throw error
    }

    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function removeEnrollment(enrollmentId: string) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("student_enrollments")
      .delete()
      .eq("id", enrollmentId)

    if (error) throw error
    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateGuardianRelation(relationId: string, relationType?: string, isPrimary?: boolean) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("student_guardians")
      .update({
        ...(relationType && { relationship: relationType }),
        ...(isPrimary !== undefined && { is_primary: isPrimary }),
      })
      .eq("id", relationId)

    if (error) throw error
    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function removeGuardianRelation(relationId: string) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("student_guardians")
      .delete()
      .eq("id", relationId)

    if (error) throw error
    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
