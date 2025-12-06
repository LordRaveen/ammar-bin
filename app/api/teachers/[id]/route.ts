import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const { data: teacher, error } = await supabase.from("teachers").select("*").eq("id", id).single()

    if (error) throw error

    return NextResponse.json(teacher)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
