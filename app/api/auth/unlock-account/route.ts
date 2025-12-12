import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: teacher } = await supabase.from("teachers").select("role").eq("user_id", user.id).maybeSingle()

    if (!teacher || teacher.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Delete lockout record
    const { error: deleteError } = await supabase.from("account_lockouts").delete().eq("email", email.toLowerCase())

    if (deleteError) {
      console.error("Error unlocking account:", deleteError)
      return NextResponse.json({ error: "Failed to unlock account" }, { status: 500 })
    }

    // Also clear failed login attempts
    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    await supabase
      .from("login_attempts")
      .delete()
      .eq("email", email.toLowerCase())
      .eq("success", false)
      .gte("created_at", windowStart)

    return NextResponse.json({ success: true, message: "Account unlocked successfully" })
  } catch (error) {
    console.error("Error in unlock-account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
