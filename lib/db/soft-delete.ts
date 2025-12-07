/**
 * Soft delete utilities
 * Provides functions to safely delete and restore records
 */

import { createClient } from "@/lib/supabase/server"

export async function softDeleteStudent(studentId: string, deletedBy: string) {
  const supabase = await createClient()

  // Check if student has active enrollments
  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("is_active", true)

  if (enrollments && enrollments.length > 0) {
    throw new Error("Cannot delete student with active enrollments. Deactivate enrollments first.")
  }

  // Check if student has unpaid invoices
  const { data: unpaidInvoices } = await supabase
    .from("invoices")
    .select("id")
    .eq("student_id", studentId)
    .eq("payment_status", "Unpaid")

  if (unpaidInvoices && unpaidInvoices.length > 0) {
    throw new Error("Cannot delete student with unpaid invoices. Clear all dues first.")
  }

  // Perform soft delete
  const { error } = await supabase
    .from("students")
    .update({
      deleted_at: new Date().toISOString(),
      status: "Inactive",
    })
    .eq("id", studentId)

  if (error) throw error

  return { success: true, message: "Student soft deleted successfully" }
}

export async function softDeleteTeacher(teacherId: string, deletedBy: string) {
  const supabase = await createClient()

  // Check if teacher has assigned classes
  const { data: classes } = await supabase.from("classes").select("id, name").eq("class_teacher_id", teacherId)

  if (classes && classes.length > 0) {
    const classNames = classes.map((c) => c.name).join(", ")
    throw new Error(`Cannot delete teacher. Please reassign these classes first: ${classNames}`)
  }

  // Check if teacher has subject assignments
  const { data: assignments } = await supabase
    .from("teacher_subject_assignments")
    .select("id")
    .eq("teacher_id", teacherId)

  if (assignments && assignments.length > 0) {
    throw new Error("Cannot delete teacher. Please remove all subject assignments first.")
  }

  // Perform soft delete
  const { error } = await supabase
    .from("teachers")
    .update({
      deleted_at: new Date().toISOString(),
      status: "Inactive",
    })
    .eq("id", teacherId)

  if (error) throw error

  return { success: true, message: "Teacher soft deleted successfully" }
}

export async function softDeleteGuardian(guardianId: string, deletedBy: string) {
  const supabase = await createClient()

  // Check if guardian has linked children
  const { data: children } = await supabase
    .from("guardian_students")
    .select("students(first_name, last_name)")
    .eq("guardian_id", guardianId)

  if (children && children.length > 0) {
    throw new Error("Cannot delete guardian with linked children. Remove all child links first.")
  }

  // Perform soft delete
  const { error } = await supabase
    .from("guardians")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", guardianId)

  if (error) throw error

  // Also deactivate their user account if they have portal access
  const { data: guardian } = await supabase.from("guardians").select("user_id").eq("id", guardianId).single()

  if (guardian?.user_id) {
    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(guardian.user_id)
    if (user) {
      await supabase.auth.admin.updateUserById(guardian.user_id, {
        banned: true,
      })
    }
  }

  return { success: true, message: "Guardian soft deleted successfully" }
}

export async function restoreStudent(studentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("students")
    .update({
      deleted_at: null,
      status: "Active",
    })
    .eq("id", studentId)

  if (error) throw error

  return { success: true, message: "Student restored successfully" }
}

export async function restoreTeacher(teacherId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("teachers")
    .update({
      deleted_at: null,
      status: "Active",
    })
    .eq("id", teacherId)

  if (error) throw error

  return { success: true, message: "Teacher restored successfully" }
}

export async function restoreGuardian(guardianId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("guardians")
    .update({
      deleted_at: null,
    })
    .eq("id", guardianId)

  if (error) throw error

  return { success: true, message: "Guardian restored successfully" }
}
