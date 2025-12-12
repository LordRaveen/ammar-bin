"use client"

import type React from "react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { devLog } from "@/lib/logger"
import { getRoleDashboardUrl } from "@/lib/auth/role-redirect"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lockoutInfo, setLockoutInfo] = useState<{
    locked: boolean
    lockedUntil?: string
    attemptsRemaining?: number
  } | null>(null)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setLockoutInfo(null)

    devLog.debug("Attempting sign in for:", email)

    try {
      const checkResponse = await fetch("/api/auth/check-lockout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (checkResponse.ok) {
        const lockData = await checkResponse.json()
        if (lockData.locked) {
          const lockedUntil = new Date(lockData.lockedUntil)
          const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)

          setLockoutInfo({
            locked: true,
            lockedUntil: lockData.lockedUntil,
          })
          setError(
            `Account locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""} or contact the administrator.`,
          )
          setIsLoading(false)
          return
        }
      }

      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (!data.user) {
        throw new Error("Failed to authenticate")
      }

      // Determine user role
      let userRole = "admin"

      try {
        // Check if user is a teacher/staff
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle()

        if (!teacherError && teacherData) {
          userRole = teacherData.role
        } else {
          // Check if user is a guardian/parent
          const { data: guardianData, error: guardianError } = await supabase
            .from("guardians")
            .select("id")
            .eq("user_id", data.user.id)
            .maybeSingle()

          if (!guardianError && guardianData) {
            userRole = "parent"
          }
        }
      } catch (roleError) {
        devLog.error("Error fetching user role:", roleError)
        // Default to admin if role lookup fails
      }

      // Track successful login
      fetch("/api/auth/track-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, success: true }),
      }).catch((err) => devLog.error("Failed to track login:", err))

      // Get dashboard URL based on role
      const dashboardUrl = getRoleDashboardUrl(userRole)

      devLog.debug("Sign in successful, role:", userRole, "redirecting to", dashboardUrl)

      // Redirect to appropriate dashboard
      router.push(dashboardUrl)
      router.refresh()
    } catch (error: any) {
      devLog.error("Sign in error:", error)

      try {
        const trackResponse = await fetch("/api/auth/track-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, success: false, reason: error.message }),
        })

        if (trackResponse.ok) {
          const trackData = await trackResponse.json()

          if (trackData.locked) {
            const lockedUntil = new Date(trackData.lockedUntil)
            const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)

            setLockoutInfo({
              locked: true,
              lockedUntil: trackData.lockedUntil,
            })
            setError(
              `Account locked after ${trackData.failedAttempts} failed attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""} or contact the administrator.`,
            )
          } else if (trackData.attemptsRemaining !== undefined) {
            setLockoutInfo({
              locked: false,
              attemptsRemaining: trackData.attemptsRemaining,
            })
            setError(
              `Invalid credentials. ${trackData.attemptsRemaining} attempt${trackData.attemptsRemaining !== 1 ? "s" : ""} remaining before account lockout.`,
            )
          } else {
            setError("Invalid credentials. Please try again.")
          }
        } else {
          setError(error.message || "Failed to sign in. Please check your credentials.")
        }
      } catch (trackError) {
        devLog.error("Failed to track failed login:", trackError)
        setError(error.message || "Failed to sign in. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
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
              <form onSubmit={handleSignIn} method="dialog">
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
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  {error && (
                    <Alert variant={lockoutInfo?.locked ? "destructive" : "default"} className="border-destructive/50">
                      <div className="flex items-start gap-2">
                        {lockoutInfo?.locked ? (
                          <Lock className="h-4 w-4 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                        )}
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </div>
                    </Alert>
                  )}

                  {!error && lockoutInfo?.attemptsRemaining !== undefined && lockoutInfo.attemptsRemaining <= 2 && (
                    <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                        Warning: {lockoutInfo.attemptsRemaining} attempt{lockoutInfo.attemptsRemaining !== 1 ? "s" : ""}{" "}
                        remaining before account lockout.
                      </AlertDescription>
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
