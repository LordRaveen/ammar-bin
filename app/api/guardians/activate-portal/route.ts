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

    if (!guardian.email) {
      return NextResponse.json({ error: "Guardian must have an email address" }, { status: 400 })
    }

    if (guardian.user_id) {
      return NextResponse.json({ error: "Portal access already activated for this guardian" }, { status: 400 })
    }

    // Generate temporary password based on phone number
    const tempPassword = `${guardian.phone.replace(/[^\d]/g, "")}@Parent`

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: guardian.email,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError) {
      throw authError
    }

    // Update guardian record with user_id
    const { error: updateError } = await supabase
      .from("guardians")
      .update({ user_id: authData.user.id })
      .eq("id", guardianId)

    if (updateError) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw updateError
    }

    // Create user_roles entry for parent role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authData.user.id,
      role: "parent",
      is_active: true,
    })

    if (roleError) {
      console.error("Error creating user role:", roleError)
    }

    return NextResponse.json({
      success: true,
      temporaryPassword: tempPassword,
      message: "Portal access activated successfully",
    })
  } catch (error: any) {
    console.error("Error activating portal access:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
