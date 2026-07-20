"use client"

import type React from "react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { devLog } from "@/lib/logger"
import { getRoleDashboardUrl } from "@/lib/auth/role-redirect"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconAlertTriangle, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lockoutInfo, setLockoutInfo] = useState<{
    locked: boolean
    minutesRemaining?: number
    attemptsRemaining?: number
  } | null>(null)
  const router = useRouter()

  const supabaseRef = useRef(createClient())

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const supabase = supabaseRef.current
    setIsLoading(true)
    setError(null)
    setLockoutInfo(null)

    devLog.debug("Attempting sign in for:", email)

    try {
      const lockoutController = new AbortController()
      const lockoutTimeout = setTimeout(() => lockoutController.abort(), 5000)

      try {
        const lockoutResponse = await fetch("/api/auth/check-lockout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: lockoutController.signal,
        })
        clearTimeout(lockoutTimeout)

        if (lockoutResponse.ok) {
          const lockoutData = await lockoutResponse.json()

          if (lockoutData.locked) {
            const minutesRemaining = Math.ceil(lockoutData.minutesRemaining)
            if (isMounted.current) {
              setLockoutInfo({ locked: true, minutesRemaining })
              setError(
                `Account locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`,
              )
            }
            setIsLoading(false)
            return
          }
        }
      } catch (lockoutError: any) {
        clearTimeout(lockoutTimeout)
        if (lockoutError.name !== "AbortError") {
          devLog.warn("Lockout check failed, continuing with login:", lockoutError)
        }
      }

      let signInData
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Check if component unmounted during auth
      if (!isMounted.current) {
        return
      }

      if (signInError) {
        // Handle abort errors silently
        if (signInError.message?.includes("abort") || signInError.name === "AbortError") {
          devLog.warn("Auth request was aborted")
          return
        }
        throw signInError
      }

      if (!data.user) {
        throw new Error("Failed to authenticate")
      }

      signInData = data

      // Determine user role
      let userRole = "admin"

      try {
        // Check if user is a teacher/staff
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("role")
          .eq("user_id", signInData.user.id)
          .maybeSingle()

        if (!teacherError && teacherData) {
          userRole = teacherData.role
        } else {
          // Check if user is a guardian/parent
          const { data: guardianData, error: guardianError } = await supabase
            .from("guardians")
            .select("id")
            .eq("user_id", signInData.user.id)
            .maybeSingle()

          if (!guardianError && guardianData) {
            userRole = "parent"
          }
        }
      } catch (roleError) {
        devLog.error("Error fetching user role:", roleError)
      }

      fetch("/api/auth/track-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, success: true }),
      }).catch((err) => devLog.error("Failed to track login:", err))

      const dashboardUrl = getRoleDashboardUrl(userRole)
      devLog.debug("Sign in successful, role:", userRole, "redirecting to", dashboardUrl)

      if (isMounted.current) {
        router.push(dashboardUrl)
        router.refresh()
      }
    } catch (error: any) {
      // Handle abort errors silently - these occur when component unmounts
      if (error.name === "AbortError" || error.message?.includes("abort")) {
        devLog.warn("Request aborted, user may have navigated away")
        return
      }

      // Check if component is still mounted before updating state
      if (!isMounted.current) {
        return
      }

      devLog.error("Sign in error:", error)

      if (!isMounted.current) return

      try {
        const trackResponse = await fetch("/api/auth/track-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, success: false, reason: error.message }),
        })

        if (trackResponse.ok) {
          const trackData = await trackResponse.json()

          if (trackData.locked) {
            const minutesRemaining = Math.ceil((new Date(trackData.lockedUntil).getTime() - Date.now()) / (1000 * 60))
            setLockoutInfo({ locked: true, minutesRemaining })
            setError(
              `Account locked due to too many failed attempts (${trackData.failedAttempts}). Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`,
            )
          } else if (trackData.attemptsRemaining !== undefined) {
            setLockoutInfo({ locked: false, attemptsRemaining: trackData.attemptsRemaining })
            setError(
              `Invalid email or password. You have ${trackData.attemptsRemaining} attempt${trackData.attemptsRemaining !== 1 ? "s" : ""} remaining before your account is locked.`,
            )
          } else {
            setError("Invalid email or password. Please try again.")
          }
        } else {
          setError("Invalid email or password. Please try again.")
        }
      } catch (trackError) {
        devLog.error("Failed to track failed login:", trackError)
        setError(error.message || "Invalid email or password. Please try again.")
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Ammar Bin Yasir Institute</h1>
            <p className="text-sm text-muted-foreground">معهد عمار بن ياسر</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access the school management system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} method="dialog" action="#">
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ammarschool.edu.ng"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading || lockoutInfo?.locked}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <IconEyeOff className="h-4 w-4" />
                        ) : (
                          <IconEye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  {error && (
                    <Alert
                      variant={lockoutInfo?.locked ? "destructive" : "default"}
                      className={lockoutInfo?.locked ? "" : "border-amber-500 bg-amber-50 text-amber-900"}
                    >
                      <div className="flex gap-2">
                        {lockoutInfo?.locked ? (
                          <IconLock className="h-4 w-4" />
                        ) : (
                          <IconAlertTriangle className="h-4 w-4" />
                        )}
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </div>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading || lockoutInfo?.locked}>
                    {isLoading ? "Signing in..." : lockoutInfo?.locked ? "Account Locked" : "Sign In"}
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-center text-sm">
                <Link href="/auth/parent-login" className="text-primary hover:underline">
                  Parent/Guardian Login
                </Link>
              </div>

              <div className="mt-2 text-center text-sm text-muted-foreground">
                <p>Contact the administrator if you need access credentials.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
