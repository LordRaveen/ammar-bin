import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in change-password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
