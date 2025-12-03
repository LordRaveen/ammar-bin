"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface GenerateInvoicesInput {
  sessionId: string
  termId: string
  generationType: "class" | "individual"
  classId?: string
  studentId?: string
  dueDate: string
  feeStructureIds: string[]
}

export async function generateInvoices(input: GenerateInvoicesInput) {
  const supabase = await createServerClient()

  try {
    // Get students based on generation type
    let students: any[] = []

    if (input.generationType === "class" && input.classId) {
      // Get all students in the class
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("student_id, students(*)")
        .eq("class_id", input.classId)
        .eq("session_id", input.sessionId)
        .eq("is_active", true)

      students = enrollments?.map((e: any) => e.students) || []
    } else if (input.generationType === "individual" && input.studentId) {
      // Get single student
      const { data: student } = await supabase.from("students").select("*").eq("student_id", input.studentId).single()

      if (student) {
        students = [student]
      }
    }

    if (students.length === 0) {
      return { success: false, message: "No students found" }
    }

    // Get fee structures
    const { data: feeStructures } = await supabase
      .from("fee_structures")
      .select("*, fee_categories(name)")
      .in("id", input.feeStructureIds)

    if (!feeStructures || feeStructures.length === 0) {
      return { success: false, message: "No fee structures found" }
    }

    // Calculate total amount
    const totalAmount = feeStructures.reduce((sum: number, fs: any) => sum + Number.parseFloat(fs.amount), 0)

    // Generate invoices
    let successCount = 0
    let errorCount = 0

    for (const student of students) {
      // Check if invoice already exists
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("student_id", student.id)
        .eq("session_id", input.sessionId)
        .eq("term_id", input.termId)
        .maybeSingle()

      if (existingInvoice) {
        errorCount++
        continue
      }

      // Generate invoice number
      const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true })

      const invoiceNumber = `INV/${new Date().getFullYear()}/${String((count || 0) + successCount + 1).padStart(
        4,
        "0",
      )}`

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          student_id: student.id,
          session_id: input.sessionId,
          term_id: input.termId,
          total_amount: totalAmount,
          amount_paid: 0,
          balance: totalAmount,
          status: "Pending",
          due_date: input.dueDate,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (invoiceError || !invoice) {
        errorCount++
        continue
      }

      // Create invoice items
      const invoiceItems = feeStructures.map((fs: any) => ({
        invoice_id: invoice.id,
        fee_category_id: fs.fee_category_id,
        description: fs.fee_categories?.name,
        amount: fs.amount,
      }))

      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)

      if (itemsError) {
        errorCount++
      } else {
        successCount++
      }
    }

    revalidatePath("/finance/invoices")

    return {
      success: true,
      message: `Generated ${successCount} invoice(s) successfully${
        errorCount > 0 ? `. ${errorCount} invoice(s) already exist or failed.` : ""
      }`,
    }
  } catch (error) {
    console.error("Error generating invoices:", error)
    return { success: false, message: "Failed to generate invoices" }
  }
}
