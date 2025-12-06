import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      guardianId,
      firstName,
      middleName,
      lastName,
      phone,
      alternatePhone,
      whatsappNumber,
      email,
      address,
      occupation,
    } = body

    const supabase = await createClient()

    // Verify the guardian belongs to this user
    const { data: guardian } = await supabase.from("guardians").select("user_id").eq("id", guardianId).single()

    if (!guardian || guardian.user_id !== user.id) {
      return NextResponse.json({ error: "Guardian not found or unauthorized" }, { status: 404 })
    }

    // Update guardian record
    const { error: updateError } = await supabase
      .from("guardians")
      .update({
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        phone,
        alternate_phone: alternatePhone,
        whatsapp_number: whatsappNumber,
        email,
        address,
        occupation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guardianId)

    if (updateError) {
      console.error("Error updating guardian:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update-profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
