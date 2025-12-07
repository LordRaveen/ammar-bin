import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, class_id, subject_id, teacher_id, session_id, term_id, due_date, total_marks } = body

    if (!title || !class_id || !subject_id || !teacher_id || !session_id || !term_id || !due_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        title,
        description,
        class_id,
        subject_id,
        teacher_id,
        session_id,
        term_id,
        due_date,
        total_marks: Number.parseInt(total_marks) || 100,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, assignment: data })
  } catch (error: any) {
    console.error("Error creating assignment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
