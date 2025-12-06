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

    // Get teacher details to find user_id
    const { data: teacher, error: fetchError } = await supabase
      .from("teachers")
      .select("user_id")
      .eq("id", teacherId)
      .single()

    if (fetchError) throw fetchError

    // Delete teacher record (will cascade to related records)
    const { error: deleteError } = await supabase.from("teachers").delete().eq("id", teacherId)

    if (deleteError) throw deleteError

    // Delete associated user account if exists
    if (teacher?.user_id) {
      try {
        await adminClient.auth.admin.deleteUser(teacher.user_id)
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
