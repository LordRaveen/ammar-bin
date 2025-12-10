import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guardianId, ...updateData } = body

    if (!guardianId) {
      return NextResponse.json({ error: "Guardian ID is required" }, { status: 400 })
    }

    const allowedFields = [
      "first_name",
      "middle_name",
      "last_name",
      "email",
      "phone",
      "alternate_phone",
      "whatsapp_number",
      "address",
      "occupation",
      "relationship_type",
      "is_emergency_contact",
    ]

    const sanitizedData: Record<string, any> = {}
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        sanitizedData[key] = value
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Verify guardian exists
    const { data: existing, error: fetchError } = await supabase
      .from("guardians")
      .select("id")
      .eq("id", guardianId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: "Database error", details: fetchError.message }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 })
    }

    // Update guardian with only sanitized fields
    const { data, error } = await supabase
      .from("guardians")
      .update(sanitizedData)
      .eq("id", guardianId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update guardian", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error?.message || "Unknown error" },
      { status: 500 },
    )
  }
}
