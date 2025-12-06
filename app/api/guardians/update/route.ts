import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guardianId, ...updateData } = body

    if (!guardianId) {
      return NextResponse.json({ error: "Guardian ID is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Verify guardian exists
    const { data: existing, error: fetchError } = await supabase
      .from("guardians")
      .select("id")
      .eq("id", guardianId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 })
    }

    // Update guardian
    const { data, error } = await supabase.from("guardians").update(updateData).eq("id", guardianId).select().single()

    if (error) {
      console.error("[v0] Error updating guardian:", error)
      return NextResponse.json({ error: "Failed to update guardian" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in update guardian API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
