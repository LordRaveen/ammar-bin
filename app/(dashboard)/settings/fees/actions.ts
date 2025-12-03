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

  try {
    for (const fee of fees) {
      const { error } = await supabase.from("fee_structures").upsert(
        {
          class_id: classId,
          session_id: sessionId,
          term_id: termId,
          fee_category_id: fee.categoryId,
          amount: fee.amount,
        },
        {
          onConflict: "class_id,session_id,term_id,fee_category_id",
        },
      )

      if (error) {
        console.error("[v0] Error upserting fee structure:", error)
        throw error
      }
    }

    revalidatePath("/settings")
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
