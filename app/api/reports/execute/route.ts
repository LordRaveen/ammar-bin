import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { table, columns } = body

    const startTime = Date.now()

    // Execute the query with selected columns
    const { data, error, count } = await supabase.from(table).select(columns.join(","), { count: "exact" }).limit(1000) // Limit to prevent large data sets

    const executionTime = Date.now() - startTime

    if (error) throw error

    // Log the execution
    await supabase.from("report_executions").insert({
      executed_by: user.id,
      parameters: { table, columns },
      result_count: count || 0,
      execution_time_ms: executionTime,
      status: "success",
    })

    return NextResponse.json({ data, count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
