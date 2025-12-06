import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, content, category, priority, target_audience, expires_at } = body

    const supabase = await createClient()

    const { data: announcement, error } = await supabase
      .from("announcements")
      .update({
        title,
        content,
        category,
        priority,
        target_audience,
        expires_at: expires_at || null,
      })
      .eq("id", id)
      .select(`
        *,
        teacher:teachers(first_name, last_name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error("[v0] Error updating announcement:", error)
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 })
  }
}
