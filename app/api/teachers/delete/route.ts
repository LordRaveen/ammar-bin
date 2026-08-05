import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teacherId } = await request.json()

    const supabase = await createServerClient()
    const adminClient = createAdminClient()

    let targetTeacherId: string | null = null
    let targetUserId: string | null = null
    let targetEmail: string | null = null
    let targetProfileId: string | null = null

    // 1. Try to find the user profile first (since /users page passes user_profiles.id)
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, user_id, email")
      .or(`id.eq.${teacherId},user_id.eq.${teacherId}`)
      .maybeSingle()

    if (profileError) throw profileError

    if (profile) {
      targetProfileId = profile.id
      targetUserId = profile.user_id
      targetEmail = profile.email

      // Find corresponding teacher record if any
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .or(`user_id.eq.${profile.user_id},email.eq.${profile.email}`)
        .maybeSingle()

      if (teacherError) throw teacherError
      if (teacher) {
        targetTeacherId = teacher.id
      }
    } else {
      // 2. Try to find by teacher record directly (since /teachers page passes teachers.id)
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id, user_id, email")
        .or(`id.eq.${teacherId},user_id.eq.${teacherId}`)
        .maybeSingle()

      if (teacherError) throw teacherError

      if (teacher) {
        targetTeacherId = teacher.id
        targetUserId = teacher.user_id
        targetEmail = teacher.email

        // Find corresponding user profile if any
        const { data: prof, error: profErr } = await supabase
          .from("user_profiles")
          .select("id")
          .or(`user_id.eq.${teacher.user_id},email.eq.${teacher.email}`)
          .maybeSingle()

        if (profErr) throw profErr
        if (prof) {
          targetProfileId = prof.id
        }
      } else {
        // Fallback: assume the ID is the auth user_id directly
        targetUserId = teacherId
      }
    }

    // 3. Soft delete teacher record from db if exists (to avoid foreign key violations on assignments, submissions, log history, etc.)
    if (targetTeacherId) {
      const { error: deleteError } = await supabase
        .from("teachers")
        .update({
          deleted_at: new Date().toISOString(),
          status: "Inactive",
        })
        .eq("id", targetTeacherId)

      if (deleteError) throw deleteError
    }

    // 4. Hard-delete user profile and user role records
    if (targetProfileId) {
      await supabase.from("user_profiles").delete().eq("id", targetProfileId)
    }
    if (targetUserId) {
      await supabase.from("user_profiles").delete().eq("user_id", targetUserId)
      await supabase.from("user_roles").delete().eq("user_id", targetUserId)
    } else if (targetEmail) {
      await supabase.from("user_profiles").delete().eq("email", targetEmail)
    }

    // 5. Delete associated auth user if exists
    if (targetUserId) {
      try {
        await adminClient.auth.admin.deleteUser(targetUserId)
      } catch (authError) {
        console.error("Failed to delete auth user:", authError)
        // Continue even if auth deletion fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete teacher error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
