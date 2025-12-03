"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateFeeCategory(categoryId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase.from("fee_categories").update({ is_active: isActive }).eq("id", categoryId)

  if (error) throw error

  revalidatePath("/settings")
}

export async function updateClassFeeStructure(
  classId: string,
  sessionId: string,
  termId: string,
  fees: { categoryId: string; amount: number }[],
) {
  const supabase = await createClient()

  console.log("[v0] updateClassFeeStructure called with:", { classId, sessionId, termId, fees })

  try {
    for (const fee of fees) {
      console.log("[v0] Processing fee:", fee)

      const { data: existing, error: selectError } = await supabase
        .from("fee_structures")
        .select("id")
        .eq("class_id", classId)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("fee_category_id", fee.categoryId)
        .maybeSingle()

      if (selectError) {
        console.error("[v0] Error checking existing fee structure:", selectError)
        throw selectError
      }

      console.log("[v0] Existing fee structure:", existing)

      if (existing) {
        // Update existing record
        console.log("[v0] Updating existing fee structure:", existing.id)
        const { error: updateError } = await supabase
          .from("fee_structures")
          .update({ amount: fee.amount })
          .eq("id", existing.id)

        if (updateError) {
          console.error("[v0] Error updating fee structure:", updateError)
          throw updateError
        }
        console.log("[v0] Successfully updated fee structure:", existing.id)
      } else {
        // Insert new record
        console.log("[v0] Inserting new fee structure for category:", fee.categoryId)
        const { data: insertedData, error: insertError } = await supabase
          .from("fee_structures")
          .insert({
            class_id: classId,
            session_id: sessionId,
            term_id: termId,
            fee_category_id: fee.categoryId,
            amount: fee.amount,
          })
          .select()

        if (insertError) {
          console.error("[v0] Error inserting fee structure:", insertError)
          throw insertError
        }
        console.log("[v0] Successfully inserted new fee structure:", insertedData)
      }
    }

    revalidatePath("/settings")
    console.log("[v0] All fee structures saved successfully")
    return { success: true }
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
  const supabase = await createClient()

  const { error } = await supabase.from("fee_structures").insert({
    class_id: data.classId,
    session_id: data.sessionId,
    term_id: data.termId,
    fee_category_id: data.feeCategoryId,
    amount: data.amount,
  })

  if (error) throw error

  revalidatePath("/settings")
}
