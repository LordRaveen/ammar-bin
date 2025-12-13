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

    const { data: teacher } = await supabase.from("teachers").select("role").eq("user_id", user.id).single()

    if (!teacher || (teacher.role !== "admin" && teacher.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the lockout record
    const { error: deleteError } = await supabase.from("account_lockouts").delete().eq("email", email.toLowerCase())

    if (deleteError) {
      console.error("Error unlocking account:", deleteError)
      return NextResponse.json({ error: "Failed to unlock account" }, { status: 500 })
    }

    // Log the unlock action in audit trail
    await supabase.from("audit_logs").insert({
      action: "UPDATE",
      table_name: "account_lockouts",
      description: `Admin unlocked account: ${email}`,
      performed_by: user.id,
    })

    return NextResponse.json({ success: true, message: "Account unlocked successfully" })
  } catch (error) {
    console.error("Error unlocking account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
