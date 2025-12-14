"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

export async function registerStudent(formData: FormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const studentId = formData.get("student_id") as string

    if (!studentId || studentId.trim() === "") {
      throw new Error("Student ID is required")
    }

    const { data: existingStudent } = await supabase.from("students").select("id").eq("student_id", studentId).single()

    if (existingStudent) {
      throw new Error("Student ID already exists. Please use a different ID.")
    }

    const studentData = {
      student_id: studentId,
      first_name: formData.get("first_name") as string,
      middle_name: (formData.get("middle_name") as string) || null,
      last_name: formData.get("last_name") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      gender: formData.get("gender") as string,
      address: formData.get("address") as string,
      state_of_origin: (formData.get("state_of_origin") as string) || null,
      nationality: (formData.get("nationality") as string) || "Nigerian",
      medical_info: (formData.get("medical_info") as string) || null,
      admission_date: (formData.get("admission_date") as string) || new Date().toISOString().split("T")[0],
      status: "Active",
    }

    // Insert student
    const { data: student, error: studentError } = await supabase.from("students").insert(studentData).select().single()

    if (studentError) {
      throw studentError
    }

    // Link to guardian if provided
    const guardianId = formData.get("guardian_id") as string
    const relationship = formData.get("relationship") as string

    if (guardianId && relationship) {
      await supabase.from("student_guardians").insert({
        student_id: student.id,
        guardian_id: guardianId,
        relationship: relationship,
        is_primary: true,
      })
    }

    revalidatePath("/students")
    return { success: true, student }
  } catch (error: any) {
    console.error("Error in registerStudent:", error)
    throw error
  }
}

export async function updateStudent(formData: FormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const studentId = formData.get("student_id") as string

    const studentData = {
      first_name: formData.get("first_name") as string,
      middle_name: (formData.get("middle_name") as string) || null,
      last_name: formData.get("last_name") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      gender: formData.get("gender") as string,
      address: formData.get("address") as string,
      state_of_origin: (formData.get("state_of_origin") as string) || null,
      nationality: (formData.get("nationality") as string) || "Nigerian",
      medical_info: (formData.get("medical_info") as string) || null,
      admission_date: formData.get("admission_date") as string,
      status: formData.get("status") as string,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("students").update(studentData).eq("id", studentId)

    if (error) {
      console.error("Update error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateStudent:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteStudent(studentId: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from("students")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", studentId)

    if (error) {
      console.error("Delete error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteStudent:", error)
    return { success: false, error: error.message }
  }
}

export async function updateGuardianRelation(relationId: string, relationship: string, isPrimary: boolean) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from("student_guardians")
      .update({
        relationship,
        is_primary: isPrimary,
      })
      .eq("id", relationId)

    if (error) {
      console.error("Update guardian relation error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateGuardianRelation:", error)
    return { success: false, error: error.message }
  }
}

export async function removeGuardianRelation(relationId: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase.from("student_guardians").delete().eq("id", relationId)

    if (error) {
      console.error("Remove guardian relation error:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/students")
    return { success: true }
  } catch (error: any) {
    console.error("Error in removeGuardianRelation:", error)
    return { success: false, error: error.message }
  }
}

export async function enrollStudent(formData: FormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const studentId = formData.get("student_id") as string
    const sessionId = formData.get("session_id") as string
    const termId = formData.get("term_id") as string
    const classId = formData.get("class_id") as string

    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from("student_enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("session_id", sessionId)
      .eq("term_id", termId)
      .eq("class_id", classId)
      .single()

    if (existing) {
      return { error: "Student is already enrolled in this class for this session/term" }
    }

    // Create enrollment
    const { error } = await supabase.from("student_enrollments").insert({
      student_id: studentId,
      session_id: sessionId,
      term_id: termId,
      class_id: classId,
      is_active: true,
      enrollment_date: new Date().toISOString().split("T")[0],
    })

    if (error) {
      console.error("Enrollment error:", error)
      return { error: "Failed to enroll student" }
    }

    revalidatePath("/students")
    return { success: true }
  } catch (error) {
    console.error("Error enrolling student:", error)
    return { error: "Failed to enroll student" }
  }
}
