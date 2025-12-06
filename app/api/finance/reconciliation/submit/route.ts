import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Upsert reconciliation
    const { error } = await supabase.from("daily_reconciliations").upsert(
      {
        reconciliation_date: data.reconciliation_date,
        reconciled_by: user.id,
        expected_cash: data.expected_cash,
        expected_pos: data.expected_pos,
        expected_transfer: data.expected_transfer,
        expected_total: data.expected_total,
        actual_cash: data.actual_cash,
        actual_pos: data.actual_pos,
        actual_transfer: data.actual_transfer,
        actual_total: data.actual_total,
        cash_variance: data.cash_variance,
        pos_variance: data.pos_variance,
        transfer_variance: data.transfer_variance,
        total_variance: data.total_variance,
        notes: data.notes,
        status: "Submitted",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "reconciliation_date",
      },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error submitting reconciliation:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
