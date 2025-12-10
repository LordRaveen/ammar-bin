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

    // Sanitize data to only include allowed fields
    const sanitizedData: Record<string, any> = {}
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        // Convert empty strings to null for optional fields
        sanitizedData[key] = value === "" ? null : value
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Verify guardian exists first
    const { data: existing, error: fetchError } = await supabase
      .from("guardians")
      .select("id")
      .eq("id", guardianId)
      .maybeSingle()

    if (fetchError) {
      console.error("[Guardian Update] Fetch error:", fetchError)
      return NextResponse.json({ error: "Database error", details: fetchError.message }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 })
    }

    const { data, error: updateError } = await supabase
      .from("guardians")
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guardianId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error("[Guardian Update] Update error:", updateError)
      return NextResponse.json(
        {
          error: "Failed to update guardian",
          details: updateError.message,
          hint: updateError.hint,
          code: updateError.code,
        },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Update failed - no data returned" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[Guardian Update] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.message || "Unknown error" },
      { status: 500 },
    )
  }
}
