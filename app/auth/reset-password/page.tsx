"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
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
    async function checkSession() {
      try {
        const supabase = createClient()
        
        // 1. Check if Supabase already established a recovery session via code exchange
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setHasValidSession(true)
          setIsCheckingSession(false)
          return
        }

        // 2. Check if a code param is in the URL and exchange it
        const code = searchParams.get("code")
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (!exchangeError) {
            setHasValidSession(true)
            setIsCheckingSession(false)
            return
          }
        }

        // 3. Fallback: listen for auth state changes (e.g. PASSWORD_RECOVERY event)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" || session) {
            setHasValidSession(true)
          }
        })

        // Give it a brief window before showing invalid state
        setTimeout(() => {
          setIsCheckingSession(false)
        }, 1500)

        return () => {
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error("Session verification error:", err)
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [searchParams])

  const calculateStrength = (pass: string) => {
    if (pass.length === 0) return "weak"
    if (pass.length < 6) return "weak"
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return "strong"
    return "medium"
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPassword(val)
    setPasswordStrength(calculateStrength(val))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      // Fetch the updated user to determine their role and proper landing page
      const { data: { user } } = await supabase.auth.getUser()

      // Redirect to signin with success message
      router.push("/auth/signin?reset=success")
    } catch (err: any) {
      console.error("Password update error:", err)
      setError(err?.message || "Failed to update password. Your link may have expired.")
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
      <div className="flex min-h-screen w-full items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Verifying security token...</p>
        </div>
      </div>
    )
  }

  if (!hasValidSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 font-sans">
        <div className="w-full max-w-[420px] space-y-6">
          <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8 space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-black uppercase">Invalid or Expired Link</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                This password reset link is invalid or has already been used. Please request a new link to reset your password.
              </CardDescription>
            </div>
            <div className="pt-2">
              <Button asChild className="w-full rounded-xl font-bold uppercase text-xs">
                <a href="/auth/forgot-password">Request New Link</a>
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
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-md p-1.5 flex items-center justify-center overflow-hidden">
            <Image
              src="/school-logo.png"
              alt="Ammar Bin Yasir Institute Logo"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
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
