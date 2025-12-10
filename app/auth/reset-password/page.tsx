"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Lock, AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak")
  const [hasValidSession, setHasValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyResetToken = async () => {
      try {
        const supabase = createClient()

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get("access_token")
          const refreshToken = hashParams.get("refresh_token")
          const type = hashParams.get("type")

          if (type === "recovery" && accessToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            })

            if (setSessionError) {
              setError("Invalid or expired reset link. Please request a new one.")
              setHasValidSession(false)
            } else {
              setHasValidSession(true)
            }
          } else {
            setError("Invalid or expired reset link. Please request a new one.")
            setHasValidSession(false)
          }
        } else {
          setHasValidSession(true)
        }
      } catch (err) {
        console.error("[v0] Reset token verification error:", err)
        setError("Failed to verify reset link. Please try again.")
        setHasValidSession(false)
      } finally {
        setIsCheckingSession(false)
      }
    }

    verifyResetToken()
  }, [])

  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength("weak")
    } else if (password.length < 8) {
      setPasswordStrength("weak")
    } else if (password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordStrength("strong")
    } else {
      setPasswordStrength("medium")
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (passwordStrength === "weak") {
      setError("Password is too weak. Use a mix of letters, numbers, and special characters")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      await supabase.auth.signOut()

      alert("Password updated successfully! Please sign in with your new password.")
      router.push("/auth/signin")
    } catch (error: any) {
      console.error("[v0] Password update error:", error)
      setError(error.message || "Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const strengthColor = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }

  const strengthWidth = {
    weak: "w-1/3",
    medium: "w-2/3",
    strong: "w-full",
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/40">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-sm text-muted-foreground">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasValidSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/40">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Invalid Reset Link</CardTitle>
              </div>
              <CardDescription>This password reset link is invalid or has expired.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Password reset links expire after 1 hour for security reasons. Please request a new reset link.
                </p>
                <Button onClick={() => router.push("/auth/forgot-password")} className="w-full">
                  Request New Reset Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Create New Password</h1>
            <p className="text-sm text-muted-foreground">Enter your new password below</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Choose a strong password to secure your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      placeholder="Min. 8 characters"
                    />
                    {password && (
                      <div className="space-y-1">
                        <div className="flex gap-1 h-1">
                          <div
                            className={`${strengthWidth[passwordStrength]} ${strengthColor[passwordStrength]} transition-all rounded`}
                          />
                          <div className="flex-1 bg-muted rounded" />
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          Password strength: {passwordStrength}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      placeholder="Re-enter password"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Password requirements:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>At least 8 characters long</li>
                      <li>Mix of uppercase and lowercase letters</li>
                      <li>At least one number</li>
                    </ul>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
