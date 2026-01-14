import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { classId, date, records, sessionId, termId } = body

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const attendanceDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (attendanceDate > today) {
      return NextResponse.json({ error: "Cannot mark attendance for future dates" }, { status: 400 })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingDates = new Set()
    const { data: existingRecords } = await supabase
      .from("attendance")
      .select("id, student_id")
      .eq("class_id", classId)
      .eq("date", date)
      .eq("session_id", sessionId)
      .eq("term_id", termId)

    if (existingRecords) {
      existingRecords.forEach((record: any) => {
        existingDates.add(record.student_id)
      })
    }

    const attendanceRecords = records.map((record: any) => ({
      class_id: classId,
      student_id: record.studentId,
      date,
      status: record.status,
      remarks: record.remarks || null,
      session_id: sessionId,
      term_id: termId,
      recorded_by: user.id,
      created_at: new Date().toISOString(),
    }))

    if (existingRecords && existingRecords.length > 0) {
      const existingIds = existingRecords.map((r: any) => r.id)
      await supabase.from("attendance").delete().in("id", existingIds)
    }

    const { data, error } = await supabase.from("attendance").insert(attendanceRecords).select()

    if (error) {
      console.error("[v0] Error inserting attendance:", error)
      return NextResponse.json({ error: "Failed to mark attendance: " + error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Attendance marked for ${records.length} students`,
    })
  } catch (error) {
    console.error("[v0] Error in attendance mark endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
