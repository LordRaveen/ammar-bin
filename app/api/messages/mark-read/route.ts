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

    const { message_id } = await request.json()

    if (!message_id) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", message_id)
      .eq("recipient_id", user.id) // Ensure user owns this message

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error marking message as read:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
