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

    // 1. Resolve target profile and teacher
    let profile = null
    let teacherRecord = null

    // Try querying user_profiles by ID
    const { data: pById } = await supabase.from("user_profiles").select("*").eq("id", teacherId).maybeSingle()
    if (pById) {
      profile = pById
      const { data: tByEmail } = await supabase.from("teachers").select("*").eq("email", pById.email).maybeSingle()
      teacherRecord = tByEmail
    } else {
      // Try querying teachers by ID
      const { data: tById } = await supabase.from("teachers").select("*").eq("id", teacherId).maybeSingle()
      if (tById) {
        teacherRecord = tById
        const { data: pByEmail } = await supabase.from("user_profiles").select("*").eq("email", tById.email).maybeSingle()
        profile = pByEmail
      }
    }

    if (!profile && !teacherRecord) {
      return NextResponse.json({ error: "Staff/Teacher record not found" }, { status: 404 })
    }

    // 2. Perform updates on user_profiles
    let updatedProfile = null
    if (profile) {
      const { data: pUpdate, error: pError } = await supabase
        .from("user_profiles")
        .update({
          first_name: updates.first_name,
          middle_name: updates.middle_name,
          last_name: updates.last_name,
          email: updates.email,
          phone: updates.phone,
          gender: updates.gender,
          date_of_birth: updates.date_of_birth || null,
          address: updates.address || null,
          qualification: updates.qualification || null,
          specialization: updates.specialization || null,
          employment_type: updates.employment_type || null,
          role: updates.role || profile.role,
          status: updates.status || profile.status,
        })
        .eq("id", profile.id)
        .select()
        .single()

      if (pError) throw pError
      updatedProfile = pUpdate
    }

    // 3. Perform updates on teachers table if role is/becomes teacher
    let updatedTeacher = null
    const isOrBecomesTeacher = (updates.role || profile?.role || "").toLowerCase() === "teacher"

    if (isOrBecomesTeacher) {
      const { data: tUpdate, error: tError } = await supabase
        .from("teachers")
        .upsert({
          id: teacherRecord?.id, // Use existing UUID if available
          user_id: profile?.user_id || teacherRecord?.user_id,
          staff_id: profile?.staff_id || teacherRecord?.staff_id,
          first_name: updates.first_name,
          middle_name: updates.middle_name,
          last_name: updates.last_name,
          email: updates.email,
          phone: updates.phone,
          gender: updates.gender,
          date_of_birth: updates.date_of_birth || null,
          address: updates.address || null,
          qualification: updates.qualification || null,
          specialization: updates.specialization || null,
          employment_date: updates.employment_date || teacherRecord?.employment_date || null,
          employment_type: updates.employment_type || null,
          status: updates.status || teacherRecord?.status || "Active",
        }, { onConflict: "email" })
        .select()
        .single()

      if (tError) throw tError
      updatedTeacher = tUpdate
    } else if (teacherRecord) {
      // If no longer a teacher, delete from teachers table
      await supabase.from("teachers").delete().eq("id", teacherRecord.id)
    }

    const result = updatedTeacher ? { ...updatedProfile, ...updatedTeacher, id: updatedTeacher.id } : updatedProfile
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Update teacher error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
