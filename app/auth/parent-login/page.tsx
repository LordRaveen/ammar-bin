"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { UserCircle, Eye, EyeOff } from "lucide-react"

export default function ParentLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("Network connection error. Please check your internet connection and try again.")
      setIsLoading(false)
      return
    }

    try {
      const lockoutResponse = await fetch("/api/auth/check-lockout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const lockoutData = await lockoutResponse.json()

      if (lockoutData.locked) {
        const minutesRemaining = Math.ceil(lockoutData.minutesRemaining)
        throw new Error(
          `Account temporarily locked. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`,
        )
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        await fetch("/api/auth/track-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, success: false, reason: signInError.message }),
        })
        throw signInError
      }

      // Check if user is a parent/guardian
      const { data: guardianData, error: guardianError } = await supabase
        .from("guardians")
        .select("id, first_name, last_name, user_id")
        .eq("user_id", data.user.id)
        .single()

      if (guardianError || !guardianData) {
        await supabase.auth.signOut()
        await fetch("/api/auth/track-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, success: false, reason: "Not a guardian account" }),
        })
        throw new Error("Access denied. This portal is for parents and guardians only.")
      }

      await fetch("/api/auth/track-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, success: true }),
      })

      router.push("/parent/dashboard")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Login error:", error)
      const isNetworkError =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        error.message?.toLowerCase().includes("failed to fetch") ||
        error.message?.toLowerCase().includes("network") ||
        error.message?.toLowerCase().includes("timeout") ||
        error.message?.toLowerCase().includes("connect") ||
        error.message?.toLowerCase().includes("load failed")

      if (isNetworkError) {
        setError("Network connection error. Please check your internet connection and try again.")
      } else {
        setError(error.message || "Failed to sign in. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Branding & Logo Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-50 dark:text-zinc-950 shadow-md">
            <UserCircle className="h-6 w-6 stroke-[1.5]" />
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
            <CardTitle className="text-lg font-black uppercase tracking-wider text-foreground">Parent Portal</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your credentials to securely access your children's reports, attendance, and tuition accounts.
            </CardDescription>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="parent@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700 h-10 text-xs font-medium rounded-xl"
              />
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
                  disabled={isLoading}
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
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-[11px] font-medium leading-relaxed text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer portal swap */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col items-center gap-2">
            <Link
              href="/auth/signin"
              className="text-xs font-bold text-primary hover:underline"
            >
              Staff & Administrator Login
            </Link>
            <p className="text-[10px] text-muted-foreground text-center">
              Please contact the school office if you need access credentials setup for your guardian account.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
