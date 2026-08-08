import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // 1. Try to find the record in user_profiles by ID
    let { data: profile } = await supabase.from("user_profiles").select("*").eq("id", id).maybeSingle()
    let teacher = null

    if (profile) {
      // If it exists in user_profiles, check if a teacher record also exists by email
      const { data: tData } = await supabase.from("teachers").select("*").eq("email", profile.email).maybeSingle()
      teacher = tData ? { ...profile, ...tData, id: tData.id } : profile
    } else {
      // If not in user_profiles by ID, try teachers table by ID
      const { data: tData } = await supabase.from("teachers").select("*").eq("id", id).maybeSingle()
      if (tData) {
        const { data: uProfile } = await supabase.from("user_profiles").select("*").eq("email", tData.email).maybeSingle()
        teacher = uProfile ? { ...uProfile, ...tData, id: tData.id } : tData
      }
    }

    if (!teacher) {
      return NextResponse.json({ error: "Staff/Teacher record not found" }, { status: 404 })
    }

    return NextResponse.json(teacher)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
