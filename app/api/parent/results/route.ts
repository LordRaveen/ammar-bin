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
    const sessionId = searchParams.get("sessionId")
    const termId = searchParams.get("termId")

    if (!studentId || !sessionId || !termId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
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
      return NextResponse.json({ error: "Access denied to this student" }, { status: 403 })
    }

    const { data: result } = await supabase
      .from("student_results")
      .select("*")
      .eq("student_id", studentId)
      .eq("session_id", sessionId)
      .eq("term_id", termId)
      .maybeSingle()

    const { data: scoresData } = await supabase
      .from("student_scores")
      .select(
        `
        *,
        assessments (
          id,
          subject_id,
          assessment_type_id,
          assessment_types (
            name
          ),
          class_subjects (
            subjects (
              name,
              code
            )
          )
        )
      `,
      )
      .eq("student_id", studentId)

    const scores = scoresData?.map((score: any) => ({
      ...score,
      assessment_type: score.assessments?.assessment_types?.name,
      subject_name: score.assessments?.class_subjects?.subjects?.name,
      subject_code: score.assessments?.class_subjects?.subjects?.code,
    }))

    return NextResponse.json({
      result,
      scores: scores || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching parent results:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
