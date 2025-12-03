"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

export async function updateFeeCategory(categoryId: string, isActive: boolean) {
  await requireAdmin()

  const supabase = await createClient()

  const { error } = await supabase.from("fee_categories").update({ is_active: isActive }).eq("id", categoryId)

  if (error) {
    console.error("[v0] Error updating fee category:", error)
    throw error
  }

  revalidatePath("/settings")
  return { success: true }
}

export async function updateClassFeeStructure(
  classId: string,
  sessionId: string,
  termId: string,
  fees: { categoryId: string; amount: number }[],
) {
  await requireAdmin()

  const supabase = await createClient()

  console.log("[v0] updateClassFeeStructure called with:", { classId, sessionId, termId, fees })

  try {
    const results = []

    for (const fee of fees) {
      console.log("[v0] Processing fee:", {
        categoryId: fee.categoryId,
        amount: fee.amount,
        classId,
        sessionId,
        termId,
      })

      // Check if fee structure already exists
      const { data: existing, error: selectError } = await supabase
        .from("fee_structures")
        .select("id, amount")
        .eq("class_id", classId)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("fee_category_id", fee.categoryId)
        .maybeSingle()

      if (selectError) {
        console.error("[v0] Error checking existing fee structure:", selectError)
        throw selectError
      }

      console.log("[v0] Existing fee structure check result:", existing)

      if (existing) {
        // Update existing record
        console.log("[v0] Updating existing fee structure with ID:", existing.id)
        const { data: updateData, error: updateError } = await supabase
          .from("fee_structures")
          .update({ amount: fee.amount })
          .eq("id", existing.id)
          .select()

        if (updateError) {
          console.error("[v0] Error updating fee structure:", updateError)
          throw updateError
        }
        console.log("[v0] Successfully updated fee structure:", updateData)
        results.push({ action: "update", id: existing.id, data: updateData })
      } else {
        // Insert new record
        console.log("[v0] Inserting new fee structure")
        const insertData = {
          class_id: classId,
          session_id: sessionId,
          term_id: termId,
          fee_category_id: fee.categoryId,
          amount: fee.amount,
        }
        console.log("[v0] Insert data:", insertData)

        const { data: insertedData, error: insertError } = await supabase
          .from("fee_structures")
          .insert(insertData)
          .select()

        if (insertError) {
          console.error("[v0] Error inserting fee structure:", insertError)
          console.error("[v0] Insert error details:", JSON.stringify(insertError, null, 2))
          throw insertError
        }
        console.log("[v0] Successfully inserted new fee structure:", insertedData)
        results.push({ action: "insert", data: insertedData })
      }
    }

    revalidatePath("/settings")
    console.log("[v0] All fee structures saved successfully:", results)
    return { success: true, results }
  } catch (error) {
    console.error("[v0] Error in updateClassFeeStructure:", error)
    throw error
  }
}

export async function addFeeStructure(data: {
  classId: string
  sessionId: string
  termId: string
  feeCategoryId: string
  amount: number
}) {
  await requireAdmin()

  const supabase = await createClient()

  const { error } = await supabase.from("fee_structures").insert({
    class_id: data.classId,
    session_id: data.sessionId,
    term_id: data.termId,
    fee_category_id: data.feeCategoryId,
    amount: data.amount,
  })

  if (error) {
    console.error("[v0] Error adding fee structure:", error)
    throw error
  }

  revalidatePath("/settings")
  return { success: true }
}
