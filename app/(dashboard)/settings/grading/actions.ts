"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

export async function createGradingScheme(data: {
  grade: string
  min_score: number
  max_score: number
  remark: string
}) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("grading_schemes").insert({
    grade: data.grade,
    min_score: data.min_score,
    max_score: data.max_score,
    remark: data.remark,
    is_active: true,
  })

  if (error) throw error

  revalidatePath("/settings")
  return { success: true }
}

export async function updateGradingScheme(
  id: string,
  data: {
    grade: string
    min_score: number
    max_score: number
    remark: string
  },
) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("grading_schemes")
    .update({
      grade: data.grade,
      min_score: data.min_score,
      max_score: data.max_score,
      remark: data.remark,
    })
    .eq("id", id)

  if (error) throw error

  revalidatePath("/settings")
  return { success: true }
}

export async function deleteGradingScheme(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("grading_schemes").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/settings")
  return { success: true }
}
