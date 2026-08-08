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

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("Network connection error. Please check your internet connection and try again.")
      setIsLoading(false)
      return
    }

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
        // Check user_profiles table first as it is the canonical staff/user directory
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", signInData.user.id)
          .maybeSingle()

        if (!profileError && profileData) {
          userRole = profileData.role
        } else {
          // Fallback to teachers table check for legacy records
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

      const isNetworkError =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        error.message?.toLowerCase().includes("failed to fetch") ||
        error.message?.toLowerCase().includes("network") ||
        error.message?.toLowerCase().includes("timeout") ||
        error.message?.toLowerCase().includes("connect") ||
        error.message?.toLowerCase().includes("load failed")

      if (isNetworkError) {
        setError("Network connection error. Please check your internet connection and try again.")
        return
      }

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
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Branding & Logo Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-50 dark:text-zinc-950 shadow-md">
            <IconLock className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-tight uppercase text-foreground">
              Ammar Bin Yasir Institute
            </h1>
            <p className="text-xs font-semibold text-muted-foreground tracking-wide italic">
              معهد عمار بن ياسر
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-black uppercase tracking-wider text-foreground">Login</CardTitle>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ammarschool.edu.ng"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700 h-10 text-xs font-medium rounded-xl"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-bold text-zinc-500 hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || lockoutInfo?.locked}
                  className="bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700 h-10 text-xs font-medium rounded-xl pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-zinc-400 hover:text-foreground transition-colors"
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

            {/* Error Notification */}
            {error && (
              <Alert
                variant={lockoutInfo?.locked ? "destructive" : "default"}
                className={lockoutInfo?.locked
                  ? "border-red-500/30 bg-red-500/5 text-red-600 rounded-xl"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl"}
              >
                <div className="flex items-start gap-2.5">
                  {lockoutInfo?.locked ? (
                    <IconLock className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <IconAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <AlertDescription className="text-[11px] font-medium leading-relaxed">
                    {error}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
              disabled={isLoading || lockoutInfo?.locked}
            >
              {isLoading ? "Signing in..." : lockoutInfo?.locked ? "Account Locked" : "Sign In"}
            </Button>
          </form>

          {/* Footer portal swap */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col items-center gap-2">
            <p className="text-[10px] text-muted-foreground text-center">
              Authorized school personnel only. Contact administrative offices to request authorization credentials.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
