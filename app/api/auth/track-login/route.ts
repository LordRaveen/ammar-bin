import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15
const FAILED_ATTEMPT_WINDOW_MINUTES = 15

export async function POST(request: Request) {
  try {
    const { email, success, reason } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createServerClient()
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    const { error: insertError } = await supabase.from("login_attempts").insert({
      email: email.toLowerCase(),
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
      failure_reason: reason || null,
    })

    if (insertError) {
      console.error("[v0] CRITICAL - Failed to insert login attempt:", insertError)
      // Still continue to avoid blocking login
    }

    // If successful login, clear any lockout
    if (success) {
      await supabase.from("account_lockouts").delete().eq("email", email.toLowerCase())
      return NextResponse.json({ success: true })
    }

    const windowStart = new Date(Date.now() - FAILED_ATTEMPT_WINDOW_MINUTES * 60 * 1000).toISOString()

    const { data: recentFailures, error: countError } = await supabase
      .from("login_attempts")
      .select("id, created_at")
      .eq("email", email.toLowerCase())
      .eq("success", false)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })

    if (countError) {
      console.error("[v0] CRITICAL - Error counting failed attempts:", countError)
      return NextResponse.json({
        success: false,
        locked: false,
        failedAttempts: 0,
        attemptsRemaining: 5,
      })
    }

    const failedCount = recentFailures?.length || 0
    console.log(`[v0] Total failed attempts for ${email} in last 15 min: ${failedCount}`)

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString()

      const { error: lockError } = await supabase.from("account_lockouts").upsert(
        {
          email: email.toLowerCase(),
          locked_until: lockedUntil,
          failed_attempts: failedCount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
        },
      )

      if (lockError) {
        console.error("[v0] Error creating lockout:", lockError)
      }

      return NextResponse.json({
        success: false,
        locked: true,
        failedAttempts: failedCount,
        attemptsRemaining: 0,
        lockedUntil,
      })
    }

    // Return remaining attempts
    const attemptsRemaining = MAX_FAILED_ATTEMPTS - failedCount

    return NextResponse.json({
      success: false,
      locked: false,
      failedAttempts: failedCount,
      attemptsRemaining: attemptsRemaining,
    })
  } catch (error) {
    console.error("[v0] CRITICAL ERROR in track-login:", error)
    // Return safe defaults on catastrophic error
    return NextResponse.json({
      success: false,
      locked: false,
      failedAttempts: 0,
      attemptsRemaining: 5,
    })
  }
}
