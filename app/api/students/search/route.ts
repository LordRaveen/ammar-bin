import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    if (!query.trim()) {
      return NextResponse.json({ students: [] })
    }

    // Search by student ID or name
    const { data: students, error } = await supabase
      .from("students")
      .select("id, student_id, first_name, middle_name, last_name, photo_url")
      .eq("status", "Active")
      .or(`student_id.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error("[v0] Error searching students:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    return NextResponse.json({ students })
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
