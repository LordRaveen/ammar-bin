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
      const { data: existing, error: selectError } = await supabase
        .from("fee_structures")
        .select("id")
        .eq("class_id", classId)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("fee_category_id", fee.categoryId)
        .single()

      console.log("[v0] Existing fee structure:", { existing, selectError })

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("fee_structures")
          .update({ amount: fee.amount })
          .eq("id", existing.id)

        if (updateError) {
          console.error("[v0] Error updating fee structure:", updateError)
          throw updateError
        }
        console.log("[v0] Updated existing fee structure:", existing.id)
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from("fee_structures").insert({
          class_id: classId,
          session_id: sessionId,
          term_id: termId,
          fee_category_id: fee.categoryId,
          amount: fee.amount,
        })

        if (insertError) {
          console.error("[v0] Error inserting fee structure:", insertError)
          throw insertError
        }
        console.log("[v0] Inserted new fee structure")
      }
    }

    revalidatePath("/settings")
    console.log("[v0] Fee structures saved successfully")
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
