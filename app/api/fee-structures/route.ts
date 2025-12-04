import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("sessionId")
    const termId = searchParams.get("termId")
    const classId = searchParams.get("classId")

    if (!sessionId || !termId || !classId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const { data: feeStructures, error } = await supabase
      .from("fee_structures")
      .select(`
        *,
        fee_categories (
          id,
          name,
          description
        )
      `)
      .eq("session_id", sessionId)
      .eq("term_id", termId)
      .eq("class_id", classId)

    if (error) throw error

    const formattedFees =
      feeStructures?.map((fs: any) => ({
        ...fs,
        fee_category_name: fs.fee_categories?.name || "Unknown",
      })) || []

    return NextResponse.json({ feeStructures: formattedFees })
  } catch (error: any) {
    console.error("Error fetching fee structures:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch fee structures" }, { status: 500 })
  }
}
