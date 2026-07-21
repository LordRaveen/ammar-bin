import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("sessionId")
    const termId = searchParams.get("termId")

    let query = supabase
      .from("student_enrollments")
      .select(`
        students (
          id,
          student_id,
          first_name,
          middle_name,
          last_name,
          gender
        )
      `)
      .eq("class_id", params.id)
      .eq("is_active", true)

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    }
    let { data, error } = await query

    if (error) throw error

    // Fallback: If 0 students found with term_id filter, query session-level active enrollments
    if ((!data || data.length === 0) && termId) {
      let fallbackQuery = supabase
        .from("student_enrollments")
        .select(`
          students (
            id,
            student_id,
            first_name,
            middle_name,
            last_name,
            gender
          )
        `)
        .eq("class_id", params.id)
        .eq("is_active", true)

      if (sessionId) {
        fallbackQuery = fallbackQuery.eq("session_id", sessionId)
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery
      if (!fallbackError && fallbackData) {
        data = fallbackData
      }
    }

    const students = data?.map((enrollment: any) => enrollment.students).filter(Boolean) || []

    return NextResponse.json({ students })
  } catch (error: any) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch students" }, { status: 500 })
  }
}
