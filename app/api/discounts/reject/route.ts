import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { discountId } = body

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's teacher profile and check admin role
    const { data: teacher } = await supabase.from("teachers").select("id, role").eq("user_id", user.id).single()

    if (!teacher || (teacher.role !== "super_admin" && teacher.role !== "admin")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get discount details
    const { data: discount } = await supabase.from("discounts").select("*").eq("id", discountId).single()

    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 })
    }

    if (discount.approved_by) {
      return NextResponse.json({ error: "Cannot reject approved discount" }, { status: 400 })
    }

    // Delete the discount request
    await supabase.from("discounts").delete().eq("id", discountId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Discount rejection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
