"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface RecordExpenseInput {
  categoryId: string
  description: string
  amount: number
  paymentMethod: "Cash" | "Bank Transfer" | "Cheque"
  paymentDate: string
}

export async function recordExpense(input: RecordExpenseInput) {
  const supabase = await createServerClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: "Unauthorized" }
    }

    // Get teacher ID
    const { data: teacher } = await supabase.from("teachers").select("id").eq("user_id", user.id).single()

    // Generate expense number
    const { count } = await supabase.from("expenses").select("*", { count: "exact", head: true })

    const expenseNumber = `EXP/${new Date().getFullYear()}/${String((count || 0) + 1).padStart(4, "0")}`

    // Insert expense
    const { error } = await supabase.from("expenses").insert({
      expense_number: expenseNumber,
      category_id: input.categoryId,
      description: input.description,
      amount: input.amount,
      payment_method: input.paymentMethod,
      payment_date: input.paymentDate,
      recorded_by: teacher?.id,
    })

    if (error) {
      console.error("Error recording expense:", error)
      return { success: false, message: "Failed to record expense" }
    }

    revalidatePath("/finance/expenses")

    return {
      success: true,
      message: `Expense recorded successfully (${expenseNumber})`,
    }
  } catch (error) {
    console.error("Error recording expense:", error)
    return { success: false, message: "An error occurred" }
  }
}
