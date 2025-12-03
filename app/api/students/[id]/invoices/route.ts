import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const studentId = params.id

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        *,
        term:terms(name)
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching invoices:", error)
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("[v0] Invoices fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
