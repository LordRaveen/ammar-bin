"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

export async function createSubject(data: {
  name: string
  code: string
  description?: string
}) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("subjects").insert({
    name: data.name,
    code: data.code,
    description: data.description || null,
    is_active: true,
  })

  if (error) throw error

  revalidatePath("/settings")
  return { success: true }
}

export async function updateSubject(
  id: string,
  data: {
    name: string
    code: string
    description?: string
  },
) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("subjects")
    .update({
      name: data.name,
      code: data.code,
      description: data.description || null,
    })
    .eq("id", id)

  if (error) throw error

  revalidatePath("/settings")
  return { success: true }
}

export async function deleteSubject(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from("subjects").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/settings")
  return { success: true }
}
