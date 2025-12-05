import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerClient()
    const { paymentId, reason } = await request.json()

    if (!paymentId || !reason) {
      return NextResponse.json({ error: "Payment ID and reason are required" }, { status: 400 })
    }

    // Check if payment exists
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Check if reversal already exists
    const { data: existingReversal } = await supabase
      .from("payment_reversals")
      .select("id")
      .eq("payment_id", paymentId)
      .maybeSingle()

    if (existingReversal) {
      return NextResponse.json({ error: "Reversal request already exists for this payment" }, { status: 400 })
    }

    // Create reversal request
    const { data: reversal, error: reversalError } = await supabase
      .from("payment_reversals")
      .insert({
        payment_id: paymentId,
        reason,
        reversed_by: user.id,
      })
      .select()
      .single()

    if (reversalError) {
      console.error("Reversal creation error:", reversalError)
      return NextResponse.json({ error: "Failed to create reversal request" }, { status: 500 })
    }

    return NextResponse.json({ success: true, reversal })
  } catch (error) {
    console.error("Payment reversal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
