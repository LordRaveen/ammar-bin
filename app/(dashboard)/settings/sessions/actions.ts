"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { devLog } from "@/lib/logger"

export async function createSession(formData: FormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const sessionData = {
      name: formData.get("name") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      is_active: formData.get("is_active") === "on",
    }

    devLog.debug("Creating session:", sessionData)

    // Create session
    const { data: session, error: sessionError } = await supabase.from("sessions").insert(sessionData).select().single()

    if (sessionError) {
      devLog.error("Failed to create session:", sessionError)
      throw sessionError
    }

    // Create terms
    const terms = []
    for (let i = 1; i <= 3; i++) {
      const termData = {
        session_id: session.id,
        name: formData.get(`term_${i}_name`) as string,
        term_number: i,
        start_date: formData.get(`term_${i}_start`) as string,
        end_date: formData.get(`term_${i}_end`) as string,
        is_active: formData.get(`term_${i}_active`) === "on",
      }
      terms.push(termData)
    }

    const { error: termsError } = await supabase.from("terms").insert(terms)

    if (termsError) {
      devLog.error("Failed to create terms:", termsError)
      throw termsError
    }

    devLog.info("Session created successfully:", session.id)
    revalidatePath("/settings/sessions")
  } catch (error) {
    devLog.error("Error in createSession:", error)
    throw error
  }

  redirect("/settings/sessions")
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
  } catch (error) {
    devLog.error("Error in setActiveSession:", error)
    throw error
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
  } catch (error) {
    devLog.error("Error in setActiveTerm:", error)
    throw error
  }
}
