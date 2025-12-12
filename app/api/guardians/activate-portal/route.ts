import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
      .maybeSingle()

    if (guardianError) {
      console.error("Guardian fetch error:", guardianError)
      return NextResponse.json({ error: "Failed to fetch guardian details" }, { status: 500 })
    }

    if (!guardian) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 })
    }

    if (!guardian.email) {
      return NextResponse.json({ error: "Guardian must have an email address" }, { status: 400 })
    }

    if (guardian.user_id) {
      return NextResponse.json({ error: "Portal access already activated for this guardian" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Check if email already exists in auth system
    const { data: existingUsers, error: checkError } = await adminClient.auth.admin.listUsers()

    if (!checkError && existingUsers) {
      const emailInUse = existingUsers.users.some((u) => u.email?.toLowerCase() === guardian.email.toLowerCase())

      if (emailInUse) {
        return NextResponse.json(
          {
            error: `Email ${guardian.email} is already registered in the system. Please use a different email address or contact support to resolve this conflict.`,
          },
          { status: 409 }, // 409 Conflict
        )
      }
    }

    let tempPassword: string

    if (guardian.phone) {
      // Use phone-based password if phone exists
      const cleanPhone = guardian.phone.replace(/[^\d]/g, "")
      if (cleanPhone.length >= 8) {
        tempPassword = `${cleanPhone}@Parent`
      } else {
        // Fallback if phone is invalid
        tempPassword = `${guardian.first_name?.substring(0, 3) || "Par"}${Math.random().toString(36).substring(2, 10)}@Parent`
      }
    } else {
      // Generate random password if no phone
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      tempPassword = `Parent${randomCode}!`
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: guardian.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: "parent",
        guardian_id: guardianId,
        full_name: `${guardian.first_name} ${guardian.last_name}`.trim(),
      },
    })

    if (authError) {
      if (authError.message?.includes("already registered") || authError.message?.includes("duplicate")) {
        return NextResponse.json(
          {
            error: `Email ${guardian.email} is already registered. Please use a different email or contact support.`,
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        {
          error: `Failed to create user account: ${authError.message}`,
        },
        { status: 500 },
      )
    }

    // Update guardian record with user_id
    const { error: updateError } = await supabase
      .from("guardians")
      .update({
        user_id: authData.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guardianId)

    if (updateError) {
      console.error("Guardian update error:", updateError)
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        {
          error: `Failed to link user account: ${updateError.message}`,
        },
        { status: 500 },
      )
    }

    // Create user_roles entry for parent role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authData.user.id,
      role: "parent",
      is_active: true,
    })

    if (roleError) {
      // Non-critical error, log but continue
      console.error("Role creation error (non-critical):", roleError)
    }

    return NextResponse.json({
      success: true,
      temporaryPassword: tempPassword,
      message: "Portal access activated successfully",
    })
  } catch (error: any) {
    console.error("Portal activation error:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}
