"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { BulkMarkAttendanceRequest } from "@/lib/types/attendance"

export async function markAttendanceForClass(request: BulkMarkAttendanceRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Auth user:", user?.id, user?.email)

    if (!user) throw new Error("User not authenticated")

    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    console.log("[v0] Teacher lookup:", { teacherData, teacherError })

    if (teacherError || !teacherData) {
      throw new Error(`Teacher record not found for user ${user.id}. Error: ${teacherError?.message}`)
    }

    const teacherId = teacherData.id

    // Insert attendance records
    const attendanceRecords = request.records.map((record) => ({
      student_id: record.student_id,
      class_id: request.class_id,
      date: request.date,
      status: record.status,
      remarks: record.remarks || null,
      recorded_by: teacherId,
    }))

    console.log("[v0] Inserting attendance records:", {
      count: attendanceRecords.length,
      date: request.date,
      class_id: request.class_id,
      teacherId: teacherId,
    })

    const { data, error } = await supabase.from("attendance").insert(attendanceRecords).select()

    if (error) {
      console.error("[v0] Database error:", error.code, error.message, error.details)
      throw error
    }

    console.log("[v0] Attendance saved successfully:", data?.length, "records")

    revalidatePath(`/classes`)

    return { success: true, count: data?.length || 0, data }
  } catch (error: any) {
    console.error("[v0] Error marking attendance:", {
      message: error.message,
      code: error.code,
      details: error.details,
    })
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

    revalidatePath(`/classes`)

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

    revalidatePath(`/classes`)

    console.log("[v0] Attendance deleted:", attendanceId)
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting attendance:", error.message)
    return { success: false, error: error.message }
  }
}
