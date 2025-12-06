import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, category, priority, target_audience, expires_at } = body

    const supabase = await createClient()

    // Get teacher ID if user is admin/super_admin
    const { data: teacherData } = await supabase.from("teachers").select("id").eq("user_id", user.id).single()

    const { data: announcement, error } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
        category,
        priority,
        target_audience,
        expires_at: expires_at || null,
        created_by: teacherData?.id || null,
      })
      .select(`
        *,
        teacher:teachers(first_name, last_name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error("[v0] Error creating announcement:", error)
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 })
  }
}
