import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15
const FAILED_ATTEMPT_WINDOW_MINUTES = 15

export async function POST(request: Request) {
  try {
    const { email, success, reason } = await request.json()

    console.log("[v0] Track-login API called:", { email, success, reason })

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createServerClient()
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    console.log("[v0] Inserting login attempt record...")
    try {
      await supabase.from("login_attempts").insert({
        email: email.toLowerCase(),
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        failure_reason: reason || null,
      })
      console.log("[v0] Login attempt recorded successfully")
    } catch (insertError) {
      console.error("[v0] Error inserting login attempt (table may not exist):", insertError)
      // Continue - don't block login flow
    }

    // If successful, clear any lockout
    if (success) {
      try {
        await supabase.from("account_lockouts").delete().eq("email", email.toLowerCase())
      } catch (deleteError) {
        console.error("[v0] Error clearing lockout:", deleteError)
      }
      return NextResponse.json({ success: true })
    }

    const windowStart = new Date(Date.now() - FAILED_ATTEMPT_WINDOW_MINUTES * 60 * 1000).toISOString()
    console.log("[v0] Counting failed attempts since:", windowStart)

    const { data: recentFailures, error } = await supabase
      .from("login_attempts")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("success", false)
      .gte("created_at", windowStart)

    if (error) {
      console.error("[v0] Error fetching recent failures:", error)
      // Return success to not block login flow
      return NextResponse.json({ success: false, locked: false })
    }

    const failedCount = recentFailures?.length || 0
    console.log("[v0] Failed count in last 15 minutes:", failedCount)

    // Lock account if threshold reached or exceeded
    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      console.log("[v0] THRESHOLD REACHED - Locking account")
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString()

      try {
        await supabase.from("account_lockouts").upsert({
          email: email.toLowerCase(),
          locked_until: lockedUntil,
          failed_attempts: failedCount,
          updated_at: new Date().toISOString(),
        })
        console.log("[v0] Lockout record created, locked until:", lockedUntil)
      } catch (lockError) {
        console.error("[v0] Error creating lockout:", lockError)
      }

      return NextResponse.json({
        success: false,
        locked: true,
        failedAttempts: failedCount,
        lockedUntil,
      })
    }

    const attemptsRemaining = MAX_FAILED_ATTEMPTS - failedCount
    console.log("[v0] Attempts remaining:", attemptsRemaining)

    return NextResponse.json({
      success: false,
      locked: false,
      failedAttempts: failedCount,
      attemptsRemaining: attemptsRemaining,
    })
  } catch (error) {
    console.error("[v0] Error tracking login:", error)
    return NextResponse.json({ success: true })
  }
}
