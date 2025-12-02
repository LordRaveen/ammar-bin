"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createClass(formData: FormData) {
  try {
    const supabase = await createServerClient()

    const name = formData.get("name") as string
    const sectionId = formData.get("section_id") as string
    const capacity = parseInt(formData.get("capacity") as string)
    const classTeacherId = formData.get("class_teacher_id") as string

    // Validate inputs
    if (!name || !sectionId || !capacity) {
      return { error: "Name, section, and capacity are required" }
    }

    // Insert class
    const { data, error } = await supabase
      .from("classes")
      .insert({
        name,
        section_id: sectionId,
        capacity,
        class_teacher_id: classTeacherId || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating class:", error)
      return { error: "Failed to create class" }
    }

    revalidatePath("/classes")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in createClass action:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function createSection(formData: FormData) {
  try {
    const supabase = await createServerClient()

    const name = formData.get("name") as string
    const description = formData.get("description") as string

    // Validate inputs
    if (!name) {
      return { error: "Section name is required" }
    }

    // Insert section
    const { data, error } = await supabase
      .from("sections")
      .insert({
        name,
        description: description || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating section:", error)
      return { error: "Failed to create section" }
    }

    revalidatePath("/classes")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in createSection action:", error)
    return { error: "An unexpected error occurred" }
  }
}
