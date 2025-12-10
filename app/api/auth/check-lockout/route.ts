import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const LOCKOUT_DURATION_MINUTES = 15
const MAX_FAILED_ATTEMPTS = 5

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: lockout, error: lockoutError } = await supabase
      .from("account_lockouts")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (lockoutError) {
      console.error("Error checking lockout (table may not exist):", lockoutError)
      return NextResponse.json({ locked: false })
    }

    if (lockout && new Date(lockout.locked_until) > new Date()) {
      const minutesRemaining = (new Date(lockout.locked_until).getTime() - new Date().getTime()) / (1000 * 60)

      return NextResponse.json({
        locked: true,
        minutesRemaining,
        lockedUntil: lockout.locked_until,
      })
    }

    // Clean expired lockout
    if (lockout && new Date(lockout.locked_until) <= new Date()) {
      await supabase.from("account_lockouts").delete().eq("email", email.toLowerCase())
    }

    return NextResponse.json({ locked: false })
  } catch (error) {
    console.error("Error checking lockout:", error)
    return NextResponse.json({ locked: false })
  }
}
