"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { devLog } from "@/lib/logger"

export async function createNewSession(formData: FormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const name = formData.get("name") as string
    const startDate = (formData.get("start_date") as string) || null
    const endDate = (formData.get("end_date") as string) || null

    if (!name) {
      throw new Error("Session name is required")
    }

    devLog.debug("Creating new session:", name)

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        name,
        start_date: startDate,
        end_date: endDate,
        is_active: false,
      })
      .select()
      .single()

    if (sessionError) {
      devLog.error("Failed to create session:", sessionError)
      throw sessionError
    }

    // Automatically create 3 terms for this session
    const terms = [
      { session_id: session.id, name: "First Term", term_number: 1, is_active: false, start_date: null, end_date: null },
      { session_id: session.id, name: "Second Term", term_number: 2, is_active: false, start_date: null, end_date: null },
      { session_id: session.id, name: "Third Term", term_number: 3, is_active: false, start_date: null, end_date: null },
    ]

    const { error: termsError } = await supabase.from("terms").insert(terms)

    if (termsError) {
      devLog.error("Failed to create terms:", termsError)
      throw termsError
    }

    devLog.info("Session and 3 terms created successfully:", session.id)
    revalidatePath("/settings")
  } catch (error: any) {
    devLog.error("Error in createNewSession:", error)
    throw error
  }

  redirect("/settings/sessions")
}

export async function updateTermDates(formData: FormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const termId = formData.get("term_id") as string
    const startDate = (formData.get("start_date") as string) || null
    const endDate = (formData.get("end_date") as string) || null

    const { error } = await supabase
      .from("terms")
      .update({ start_date: startDate, end_date: endDate })
      .eq("id", termId)

    if (error) {
      devLog.error("Failed to update term dates:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    devLog.error("Error in updateTermDates:", error)
    return { success: false, error: error.message || "Failed to update term dates" }
  }
}

export async function setActiveSession(sessionId: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    devLog.debug("Setting active session:", sessionId)

    // Deactivate all sessions
    await supabase.from("sessions").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000")

    // Activate the selected session
    const { error } = await supabase.from("sessions").update({ is_active: true }).eq("id", sessionId)

    if (error) {
      devLog.error("Failed to set active session:", error)
      throw error
    }

    devLog.info("Active session set successfully:", sessionId)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    devLog.error("Error in setActiveSession:", error)
    return { success: false, error: "Failed to set active session" }
  }
}

export async function setActiveTerm(termId: string, sessionId: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    devLog.debug("Setting active term:", termId, "for session:", sessionId)

    // Deactivate all terms in this session
    await supabase.from("terms").update({ is_active: false }).eq("session_id", sessionId)

    // Activate the selected term
    const { error } = await supabase.from("terms").update({ is_active: true }).eq("id", termId)

    if (error) {
      devLog.error("Failed to set active term:", error)
      throw error
    }

    devLog.info("Active term set successfully:", termId)
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    devLog.error("Error in setActiveTerm:", error)
    return { success: false, error: "Failed to set active term" }
  }
}
