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

export async function duplicateFeeTemplate(data: {
  sourceClassId: string
  targetClassId: string
  sourceSessionId: string
  targetSessionId: string
}) {
  await requireAdmin()

  const supabase = await createClient()

  try {
    // Fetch source fee structures
    const { data: sourceFees, error: fetchError } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("class_id", data.sourceClassId)
      .eq("session_id", data.sourceSessionId)

    if (fetchError) throw fetchError

    if (!sourceFees || sourceFees.length === 0) {
      throw new Error("No fee structures found in source template")
    }

    // Get terms for target session
    const { data: targetTerms, error: termsError } = await supabase
      .from("terms")
      .select("id")
      .eq("session_id", data.targetSessionId)

    if (termsError) throw termsError

    // Create new fee structures for target
    const newFeeStructures = sourceFees.flatMap(
      (fee) =>
        targetTerms?.map((term: any) => ({
          class_id: data.targetClassId,
          session_id: data.targetSessionId,
          term_id: term.id,
          fee_category_id: fee.fee_category_id,
          amount: fee.amount,
          gender_specific: fee.gender_specific,
        })) || [],
    )

    const { error: insertError } = await supabase.from("fee_structures").insert(newFeeStructures)

    if (insertError) throw insertError

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function applyBulkTemplate(data: {
  sourceClassId: string
  targetClassIds: string[]
  sourceSessionId: string
  targetSessionId: string
  percentageAdjustment: number
}) {
  await requireAdmin()

  const supabase = await createClient()

  try {
    // Fetch source fee structures
    const { data: sourceFees, error: fetchError } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("class_id", data.sourceClassId)
      .eq("session_id", data.sourceSessionId)

    if (fetchError) throw fetchError

    if (!sourceFees || sourceFees.length === 0) {
      throw new Error("No fee structures found in source template")
    }

    // Get terms for target session
    const { data: targetTerms, error: termsError } = await supabase
      .from("terms")
      .select("id")
      .eq("session_id", data.targetSessionId)

    if (termsError) throw termsError

    // Create fee structures for each target class
    const newFeeStructures = data.targetClassIds.flatMap((classId) =>
      sourceFees.flatMap(
        (fee) =>
          targetTerms?.map((term: any) => {
            let amount = fee.amount
            if (data.percentageAdjustment !== 0) {
              amount = amount * (1 + data.percentageAdjustment / 100)
            }
            return {
              class_id: classId,
              session_id: data.targetSessionId,
              term_id: term.id,
              fee_category_id: fee.fee_category_id,
              amount: Math.round(amount * 100) / 100, // Round to 2 decimals
              gender_specific: fee.gender_specific,
            }
          }) || [],
      ),
    )

    const { error: insertError } = await supabase.from("fee_structures").insert(newFeeStructures)

    if (insertError) throw insertError

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    throw error
  }
}

export async function deleteFeeTemplate(classId: string, sessionId: string) {
  await requireAdmin()

  const supabase = await createClient()

  const { error } = await supabase.from("fee_structures").delete().eq("class_id", classId).eq("session_id", sessionId)

  if (error) throw error

  revalidatePath("/settings")
  return { success: true }
}
