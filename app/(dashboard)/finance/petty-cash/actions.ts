"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface RecordPettyCashTransactionInput {
  transactionType: "IN" | "OUT"
  amount: number
  description: string
  transactionDate: string
  currentBalance: number
}

export async function recordPettyCashTransaction(input: RecordPettyCashTransactionInput) {
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

    // Calculate new balance
    const balanceAfter =
      input.transactionType === "IN" ? input.currentBalance + input.amount : input.currentBalance - input.amount

    if (balanceAfter < 0) {
      return { success: false, message: "Insufficient petty cash balance" }
    }

    // Insert transaction
    const { error } = await supabase.from("petty_cash_transactions").insert({
      transaction_type: input.transactionType,
      amount: input.amount,
      description: input.description,
      balance_after: balanceAfter,
      transaction_date: input.transactionDate,
      recorded_by: teacher?.id,
    })

    if (error) {
      console.error("Error recording petty cash transaction:", error)
      return { success: false, message: "Failed to record transaction" }
    }

    revalidatePath("/finance/petty-cash")

    return {
      success: true,
      message: `Transaction recorded successfully. New balance: ₦${balanceAfter.toLocaleString()}`,
    }
  } catch (error) {
    console.error("Error recording petty cash transaction:", error)
    return { success: false, message: "An error occurred" }
  }
}
