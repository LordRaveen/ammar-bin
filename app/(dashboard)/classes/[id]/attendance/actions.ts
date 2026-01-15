"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { BulkMarkAttendanceRequest } from "@/lib/types/attendance"

export async function markAttendanceForClass(request: BulkMarkAttendanceRequest) {
  try {
    const supabase = await createServerClient()

    // Get current user for recorded_by field
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Insert attendance records
    const attendanceRecords = request.records.map((record) => ({
      student_id: record.student_id,
      class_id: request.class_id,
      date: request.date,
      status: record.status,
      remarks: record.remarks || null,
      recorded_by: user.id,
    }))

    const { data, error } = await supabase
      .from("attendance")
      .upsert(attendanceRecords, {
        onConflict: "student_id,class_id,date",
      })
      .select()

    if (error) throw error

    // Revalidate cache
    revalidatePath(`/classes/[id]`)

    console.log("[v0] Attendance saved successfully:", data?.length, "records")
    return { success: true, count: data?.length || 0, data }
  } catch (error: any) {
    console.error("[v0] Error marking attendance:", error.message)
    return {
      success: false,
      error: error.message || "Failed to mark attendance",
    }
  }
}

export async function fetchClassAttendanceForDate(classId: string, date: string, sessionId: string, termId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.from("attendance").select("*").eq("class_id", classId).eq("date", date)

    if (error) throw error

    console.log("[v0] Attendance fetched:", data?.length, "records")
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Error fetching attendance:", error.message)
    return { success: false, error: error.message, data: [] }
  }
}

export async function updateAttendanceRecord(attendanceId: string, status: string, remarks?: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("attendance")
      .update({ status, remarks: remarks || null })
      .eq("id", attendanceId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/classes/[id]`)

    console.log("[v0] Attendance updated:", attendanceId)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Error updating attendance:", error.message)
    return { success: false, error: error.message }
  }
}

export async function deleteAttendanceRecord(attendanceId: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("attendance").delete().eq("id", attendanceId)

    if (error) throw error

    revalidatePath(`/classes/[id]`)

    console.log("[v0] Attendance deleted:", attendanceId)
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting attendance:", error.message)
    return { success: false, error: error.message }
  }
}
