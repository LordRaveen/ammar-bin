import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { teacherId, ...updates } = body

    const supabase = await createServerClient()

    const { data: teacher, error } = await supabase
      .from("teachers")
      .update({
        first_name: updates.first_name,
        middle_name: updates.middle_name,
        last_name: updates.last_name,
        email: updates.email,
        phone: updates.phone,
        date_of_birth: updates.date_of_birth || null,
        gender: updates.gender,
        address: updates.address || null,
        qualification: updates.qualification || null,
        specialization: updates.specialization || null,
        employment_date: updates.employment_date || null,
        employment_type: updates.employment_type || null,
        role: updates.role,
        status: updates.status,
      })
      .eq("id", teacherId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(teacher)
  } catch (error: any) {
    console.error("Update teacher error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
