import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!studentId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch attendance records for the date range
    const { data: records, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching attendance:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate statistics
    const totalDays = records?.length || 0
    const present = records?.filter((r) => r.status === "Present").length || 0
    const absent = records?.filter((r) => r.status === "Absent").length || 0
    const late = records?.filter((r) => r.status === "Late").length || 0
    const excused = records?.filter((r) => r.status === "Excused").length || 0
    const percentage = totalDays > 0 ? (present / totalDays) * 100 : 0

    return NextResponse.json({
      records,
      stats: {
        totalDays,
        present,
        absent,
        late,
        excused,
        percentage,
      },
    })
  } catch (error) {
    console.error("Error in attendance API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
