import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const { data: guardian, error } = await supabase.from("guardians").select("*").eq("id", id).single()

    if (error || !guardian) {
      return NextResponse.json({ error: "Guardian not found" }, { status: 404 })
    }

    return NextResponse.json(guardian)
  } catch (error) {
    console.error("[v0] Error fetching guardian:", error)
    return NextResponse.json({ error: "Failed to fetch guardian" }, { status: 500 })
  }
}
