import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json({ error: "Missing student ID" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: guardian } = await supabase.from("guardians").select("id").eq("user_id", user.id).single()

    if (!guardian) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 })
    }

    const { data: studentGuardian } = await supabase
      .from("student_guardians")
      .select("*")
      .eq("guardian_id", guardian.id)
      .eq("student_id", studentId)
      .single()

    if (!studentGuardian) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { data: results } = await supabase
      .from("student_results")
      .select(
        `
        *,
        sessions (name),
        terms (name)
      `,
      )
      .eq("student_id", studentId)
      .order("generated_at", { ascending: false })

    const formattedResults = results?.map((r: any) => ({
      ...r,
      session_name: r.sessions?.name,
      term_name: r.terms?.name,
    }))

    return NextResponse.json({
      results: formattedResults || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching historical results:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
