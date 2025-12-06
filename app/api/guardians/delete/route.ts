import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guardianId } = body

    if (!guardianId) {
      return NextResponse.json({ error: "Guardian ID is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Fetch guardian with user_id
    const { data: guardian, error: fetchError } = await supabase
      .from("guardians")
      .select("id, user_id")
      .eq("id", guardianId)
      .single()

    if (fetchError || !guardian) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 })
    }

    // If guardian has portal access, delete the user account first
    if (guardian.user_id) {
      const adminClient = createAdminClient()
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(guardian.user_id)

      if (deleteAuthError) {
        console.error("[v0] Error deleting guardian auth user:", deleteAuthError)
        return NextResponse.json({ error: "Failed to delete guardian user account" }, { status: 500 })
      }
    }

    // Delete guardian record (cascade will handle student_guardians)
    const { error: deleteError } = await supabase.from("guardians").delete().eq("id", guardianId)

    if (deleteError) {
      console.error("[v0] Error deleting guardian:", deleteError)
      return NextResponse.json({ error: "Failed to delete guardian" }, { status: 500 })
    }

    return NextResponse.json({ message: "Guardian deleted successfully" })
  } catch (error) {
    console.error("[v0] Error in delete guardian API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
