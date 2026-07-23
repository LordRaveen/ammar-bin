import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const { classId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const sessionId = searchParams.get("sessionId")
    const termId = searchParams.get("termId")

    if (!date || !sessionId || !termId) {
      return NextResponse.json({ error: "Missing required parameters: date, sessionId, termId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: records, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", classId)
      .eq("date", date)
      .eq("session_id", sessionId)
      .eq("term_id", termId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching class attendance:", error)
      return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 })
    }

    const stats = {
      totalRecords: records?.length || 0,
      present: records?.filter((r) => r.status === "Present").length || 0,
      absent: records?.filter((r) => r.status === "Absent").length || 0,
      late: records?.filter((r) => r.status === "Late").length || 0,
      excused: records?.filter((r) => r.status === "Excused").length || 0,
    }

    return NextResponse.json({
      success: true,
      data: records || [],
      stats,
    })
  } catch (error) {
    console.error("[v0] Error in class attendance endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
