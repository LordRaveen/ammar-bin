/**
 * Duplicate prevention utilities
 * Checks for existing records before creating new ones
 */

import { createClient } from "@/lib/supabase/server"

export async function checkDuplicateStudentId(studentId: string, excludeId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("students")
    .select("id, first_name, last_name")
    .eq("student_id", studentId)
    .is("deleted_at", null)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query

  if (data && data.length > 0) {
    const existing = data[0]
    return {
      exists: true,
      message: `Student ID ${studentId} already exists for ${existing.first_name} ${existing.last_name}`,
      record: existing,
    }
  }

  return { exists: false }
}

export async function checkDuplicateStaffId(staffId: string, excludeId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("teachers")
    .select("id, first_name, last_name")
    .eq("staff_id", staffId)
    .is("deleted_at", null)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query

  if (data && data.length > 0) {
    const existing = data[0]
    return {
      exists: true,
      message: `Staff ID ${staffId} already exists for ${existing.first_name} ${existing.last_name}`,
      record: existing,
    }
  }

  return { exists: false }
}

export async function checkDuplicateEmail(
  email: string,
  table: "students" | "teachers" | "guardians",
  excludeId?: string,
) {
  const supabase = await createClient()

  let query = supabase.from(table).select("id, first_name, last_name").eq("email", email).is("deleted_at", null)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query

  if (data && data.length > 0) {
    const existing = data[0]
    return {
      exists: true,
      message: `Email ${email} already exists for ${existing.first_name} ${existing.last_name}`,
      record: existing,
    }
  }

  return { exists: false }
}

export async function checkDuplicateInvoiceNumber(invoiceNumber: string, excludeId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("invoices")
    .select("id, invoice_number, students(first_name, last_name)")
    .eq("invoice_number", invoiceNumber)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query

  if (data && data.length > 0) {
    return {
      exists: true,
      message: `Invoice number ${invoiceNumber} already exists`,
      record: data[0],
    }
  }

  return { exists: false }
}

export async function checkDuplicateReceiptNumber(receiptNumber: string, excludeId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("payments")
    .select("id, receipt_number, students(first_name, last_name)")
    .eq("receipt_number", receiptNumber)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query

  if (data && data.length > 0) {
    return {
      exists: true,
      message: `Receipt number ${receiptNumber} already exists`,
      record: data[0],
    }
  }

  return { exists: false }
}
