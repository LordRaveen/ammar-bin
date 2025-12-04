import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get all fee categories
    const { data: feeCategories } = await supabase.from("fee_categories").select("id, name").order("name")

    const summary = await Promise.all(
      (feeCategories || []).map(async (category) => {
        // Get total invoiced for this category
        const { data: invoiceItems } = await supabase
          .from("invoice_items")
          .select(`
            amount,
            invoice_id,
            invoices!inner (
              session_id,
              total_amount,
              amount_paid,
              balance
            )
          `)
          .eq("fee_category_id", category.id)
          .eq("invoices.session_id", sessionId)

        const invoiced = invoiceItems?.reduce((sum, item) => sum + Number.parseFloat(item.amount), 0) || 0

        // Get total collected for this category (proportional to payments)
        const totalFromCategory =
          invoiceItems?.reduce((sum, item) => sum + Number.parseFloat(item.invoices.amount_paid), 0) || 0

        const collected = totalFromCategory
        const outstanding = invoiced - collected
        const collectionRate = invoiced > 0 ? (collected / invoiced) * 100 : 0

        return {
          category: category.name,
          invoiced,
          collected,
          outstanding,
          collection_rate: collectionRate,
        }
      }),
    )

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Error fetching revenue summary:", error)
    return NextResponse.json({ error: "Failed to fetch revenue summary" }, { status: 500 })
  }
}
