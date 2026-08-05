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

export async function updateSection(sectionId: string, name: string, description: string) {
  try {
    const supabase = await createServerClient()

    if (!name) {
      return { error: "Section name is required" }
    }

    const { data, error } = await supabase
      .from("sections")
      .update({
        name,
        description: description || null,
      })
      .eq("id", sectionId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating section:", error)
      throw new Error("Failed to update section")
    }

    revalidatePath("/classes")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in updateSection action:", error)
    throw error
  }
}

export async function deleteSection(sectionId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from("sections")
      .update({ is_active: false })
      .eq("id", sectionId)

    if (error) {
      console.error("[v0] Error deleting section:", error)
      throw new Error("Failed to delete section")
    }

    revalidatePath("/classes")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deleteSection action:", error)
    throw error
  }
}

export async function updateClass(
  classId: string,
  name: string,
  capacity: number,
  classTeacherId: string | null,
  sectionId: string
) {
  try {
    const supabase = await createServerClient()

    if (!name || !capacity || !sectionId) {
      return { error: "Name, capacity, and section are required" }
    }

    const { data, error } = await supabase
      .from("classes")
      .update({
        name,
        capacity,
        class_teacher_id: classTeacherId || null,
        section_id: sectionId,
      })
      .eq("id", classId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating class:", error)
      return { error: "Failed to update class" }
    }

    revalidatePath("/classes")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in updateClass action:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function deleteClass(classId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from("classes")
      .update({ is_active: false })
      .eq("id", classId)

    if (error) {
      console.error("[v0] Error deleting class:", error)
      return { error: "Failed to delete class" }
    }

    revalidatePath("/classes")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in deleteClass action:", error)
    return { error: "An unexpected error occurred" }
  }
}

