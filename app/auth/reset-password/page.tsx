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
      <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 font-sans">
        <Card className="w-full max-w-[420px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-xl rounded-3xl p-8">
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Verifying reset token link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasValidSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 font-sans">
        <div className="w-full max-w-[420px]">
          <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-red-650 dark:text-red-500">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <CardTitle className="text-lg font-black uppercase tracking-wider">Invalid Reset Link</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                This password reset link is invalid or has expired.
              </CardDescription>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                For security reasons, password recovery access links are only valid for 1 hour. Please request a new link to proceed.
              </p>
              <Button
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full h-10 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
              >
                Request New Reset Link
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Branding & Logo Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-50 dark:text-zinc-950 shadow-md">
            <Lock className="h-6 w-6 stroke-[1.5]" />
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
            <CardTitle className="text-lg font-black uppercase tracking-wider text-foreground">Create New Password</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Choose a strong password to secure your account.
            </CardDescription>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Min. 8 characters"
                className="bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700 h-10 text-xs font-medium rounded-xl"
              />
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1 h-1 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`${strengthWidth[passwordStrength]} ${strengthColor[passwordStrength]} transition-all`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Password strength: <span className="text-foreground">{passwordStrength}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Re-enter password"
                className="bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700 h-10 text-xs font-medium rounded-xl"
              />
            </div>

            {/* Error Notification */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-[11px] font-medium leading-relaxed text-red-600">
                {error}
              </div>
            )}

            {/* Guidelines box */}
            <div className="bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password Requirements</p>
              <ul className="text-[10px] font-medium text-muted-foreground space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Mix of uppercase and lowercase letters</li>
                <li>• At least one number or special character</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
