"use client"

import type React from "react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
    minutesRemaining?: number
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
            minutesRemaining,
          })
          setError("locked")
          setIsLoading(false)
          return
        }
      }

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

      let userRole = "admin"

      try {
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle()

        if (!teacherError && teacherData) {
          userRole = teacherData.role
        } else {
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
      }

      fetch("/api/auth/track-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, success: true }),
      }).catch((err) => devLog.error("Failed to track login:", err))

      const dashboardUrl = getRoleDashboardUrl(userRole)

      devLog.debug("Sign in successful, role:", userRole, "redirecting to", dashboardUrl)

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
            const minutesRemaining = Math.ceil((new Date(trackData.lockedUntil).getTime() - Date.now()) / 60000)

            setLockoutInfo({
              locked: true,
              lockedUntil: trackData.lockedUntil,
              minutesRemaining,
            })
            setError("locked")
          } else if (trackData.attemptsRemaining !== undefined) {
            setLockoutInfo({
              locked: false,
              attemptsRemaining: trackData.attemptsRemaining,
            })
            setError("invalid_credentials")
          } else {
            setError("invalid_credentials")
          }
        } else {
          setError("invalid_credentials")
        }
      } catch (trackError) {
        devLog.error("Failed to track failed login:", trackError)
        setError("invalid_credentials")
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
                    <Alert
                      variant={lockoutInfo?.locked ? "destructive" : "default"}
                      className={
                        lockoutInfo?.locked ? "border-destructive" : "border-amber-500 bg-amber-50 dark:bg-amber-950"
                      }
                    >
                      <div className="flex gap-3">
                        {lockoutInfo?.locked ? (
                          <Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 space-y-3">
                          <div>
                            <AlertTitle className="mb-1.5 font-semibold text-base">
                              {lockoutInfo?.locked ? "Account Locked" : "Invalid Credentials"}
                            </AlertTitle>
                            <AlertDescription className="text-sm">
                              {lockoutInfo?.locked ? (
                                <div className="space-y-2">
                                  <p>Your account has been locked due to multiple failed login attempts.</p>
                                  <p className="font-medium">
                                    Try again in <span className="font-bold">{lockoutInfo.minutesRemaining}</span>{" "}
                                    minute{lockoutInfo.minutesRemaining !== 1 ? "s" : ""} or contact an administrator.
                                  </p>
                                </div>
                              ) : (
                                <p>The email or password you entered is incorrect.</p>
                              )}
                            </AlertDescription>
                          </div>

                          {!lockoutInfo?.locked && lockoutInfo?.attemptsRemaining !== undefined && (
                            <div className="flex items-center gap-3 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-md border border-amber-200 dark:border-amber-800">
                              <div className="flex items-center justify-center w-12 h-12 rounded-md bg-amber-200 dark:bg-amber-900">
                                <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                  {lockoutInfo.attemptsRemaining}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 leading-tight">
                                  {lockoutInfo.attemptsRemaining === 1
                                    ? "1 attempt"
                                    : `${lockoutInfo.attemptsRemaining} attempts`}{" "}
                                  remaining
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                  Account will be locked after 5 failed attempts
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
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
