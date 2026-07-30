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

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: `A subject with code "${data.code}" already exists.` }
    }
    return { success: false, error: error.message }
  }

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

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: `A subject with code "${data.code}" already exists.` }
    }
    return { success: false, error: error.message }
  }

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

export async function createSubjectComponent(subjectId: string, name: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subject_components")
    .insert({ subject_id: subjectId, name })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { success: true, data }
}

export async function deleteSubjectComponent(componentId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("subject_components")
    .delete()
    .eq("id", componentId)

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { success: true }
}

export async function createBehaviorCategory(name: string, type: "affective" | "psychomotor") {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("behavior_categories")
    .insert({ name, type })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { success: true, data }
}

export async function deleteBehaviorCategory(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("behavior_categories")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { success: true }
}

export async function assignComponentToClass(classId: string, subjectId: string, componentId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("class_subject_components")
    .insert({
      class_id: classId,
      subject_id: subjectId,
      subject_component_id: componentId,
    })

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { success: true }
}

export async function unassignComponentFromClass(classId: string, subjectId: string, componentId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("class_subject_components")
    .delete()
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("subject_component_id", componentId)

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { success: true }
}

export async function updateClassComponentLimits(
  classId: string,
  subjectId: string,
  componentId: string,
  maxCa: number,
  maxExam: number,
  caCount: number
) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("class_subject_components")
    .update({
      max_ca: maxCa,
      max_exam: maxExam,
      ca_count: caCount
    })
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("subject_component_id", componentId)

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { success: true }
}

export async function updateClassSubjectLimits(
  classId: string,
  subjectId: string,
  maxScore: number,
  passMark: number,
  caCount: number
) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from("class_subjects")
    .update({
      max_score: maxScore,
      pass_mark: passMark,
      ca_count: caCount
    })
    .eq("class_id", classId)
    .eq("subject_id", subjectId)

  if (error) throw new Error(error.message)

  revalidatePath("/settings")
  return { success: true }
}
