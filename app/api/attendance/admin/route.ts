import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only admins can access
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    const classId = searchParams.get("classId")
    const status = searchParams.get("status")

    let query = supabase.from("attendance").select(`
        id,
        date,
        status,
        remarks,
        recorded_by,
        students (first_name, last_name, student_id),
        classes (name)
      `)

    if (date) {
      query = query.eq("date", date)
    }

    if (classId) {
      query = query.eq("class_id", classId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query.order("date", { ascending: false })

    if (error) throw error

    // Transform data
    const records =
      data?.map((record: any) => ({
        id: record.id,
        date: record.date,
        student_id: record.students.student_id,
        student_name: `${record.students.first_name} ${record.students.last_name}`,
        class_name: record.classes.name,
        status: record.status,
        remarks: record.remarks,
        recorded_by: record.recorded_by,
      })) || []

    return NextResponse.json({ records })
  } catch (error) {
    console.error("[Admin Attendance API]", error)
    return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 })
  }
}
