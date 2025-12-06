import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { guardianId } = await request.json()

    // Get guardian details
    const { data: guardian, error: guardianError } = await supabase
      .from("guardians")
      .select("*")
      .eq("id", guardianId)
      .single()

    if (guardianError || !guardian) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 })
    }

    if (!guardian.user_id) {
      return NextResponse.json({ error: "Portal access not activated for this guardian" }, { status: 400 })
    }

    // Generate new temporary password based on phone number
    const tempPassword = `${guardian.phone.replace(/[^\d]/g, "")}@Parent`

    // Update password for the Supabase auth user
    const { error: updateError } = await supabase.auth.admin.updateUserById(guardian.user_id, {
      password: tempPassword,
    })

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      temporaryPassword: tempPassword,
      message: "Password reset successfully",
    })
  } catch (error: any) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
