"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

export async function updateFeeCategory(categoryId: string, isActive: boolean) {
  await requireAdmin()

  const supabase = await createClient()

  const { error } = await supabase.from("fee_categories").update({ is_active: isActive }).eq("id", categoryId)

  if (error) {
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

  try {
    const results = []

    for (const fee of fees) {
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
        throw selectError
      }

      if (existing) {
        // Update existing record
        const { data: updateData, error: updateError } = await supabase
          .from("fee_structures")
          .update({ amount: fee.amount })
          .eq("id", existing.id)
          .select()

        if (updateError) {
          throw updateError
        }
        results.push({ action: "update", id: existing.id, data: updateData })
      } else {
        // Insert new record
        const insertData = {
          class_id: classId,
          session_id: sessionId,
          term_id: termId,
          fee_category_id: fee.categoryId,
          amount: fee.amount,
        }

        const { data: insertedData, error: insertError } = await supabase
          .from("fee_structures")
          .insert(insertData)
          .select()

        if (insertError) {
          throw insertError
        }
        results.push({ action: "insert", data: insertedData })
      }
    }

    revalidatePath("/settings")
    return { success: true, results }
  } catch (error) {
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
    throw error
  }

  revalidatePath("/settings")
  return { success: true }
}
