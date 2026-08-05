"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)
  const [isParentPortal, setIsParentPortal] = useState(false)

  useState(() => {
    if (typeof window !== "undefined") {
      const referrer = document.referrer
      setIsParentPortal(referrer.includes("/auth/parent-login"))
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoading(true)
    setMessage(null)

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMessage({
        type: "error",
        text: "Network connection error. Please check your internet connection and try again.",
      })
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const [{ data: guardianData }, { data: teacherData }] = await Promise.all([
        supabase.from("guardians").select("id, email, user_id").eq("email", email).maybeSingle(),
        supabase.from("teachers").select("id, email, user_id").eq("email", email).maybeSingle(),
      ])

      const userData = guardianData || teacherData
      const userType = guardianData ? "guardian" : teacherData ? "teacher" : null

      if (!userData) {
        setMessage({
          type: "error",
          text: "No account found with this email address. Please check your email or contact the school admin.",
        })
        setIsLoading(false)
        return
      }

      if (!userData.user_id) {
        setMessage({
          type: "error",
          text: "Your portal access is not activated. Please contact the school admin to activate your account first.",
        })
        setIsLoading(false)
        return
      }

      // Build redirect URL
      const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
        ? `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL}/auth/reset-password`
        : `${window.location.origin}/auth/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        if (error.message.includes("rate limit")) {
          setMessage({
            type: "warning",
            text: "Too many password reset requests. Please wait a few minutes and try again, or contact the school admin for assistance.",
          })
        } else if (error.message.includes("SMTP") || error.message.includes("email provider")) {
          setMessage({
            type: "warning",
            text: "Email service is temporarily unavailable. Please contact the school admin at admin@school.com to reset your password manually.",
          })
        } else {
          throw error
        }
        setIsLoading(false)
        return
      }

      setMessage({
        type: "success",
        text: `Password reset link has been sent to ${email}. Please check your inbox and spam/junk folder. The link expires in 1 hour. If you don't receive it within 5 minutes, contact the school admin.`,
      })
      setEmail("")
    } catch (error: any) {
      const isNetworkError =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        error.message?.toLowerCase().includes("failed to fetch") ||
        error.message?.toLowerCase().includes("network") ||
        error.message?.toLowerCase().includes("timeout") ||
        error.message?.toLowerCase().includes("connect") ||
        error.message?.toLowerCase().includes("load failed")

      setMessage({
        type: "error",
        text: isNetworkError
          ? "Network connection error. Please check your internet connection and try again."
          : error.message || "Failed to send reset link. Please contact the school admin for manual password reset.",
      })
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
            <Mail className="h-6 w-6 stroke-[1.5]" />
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
        <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8 space-y-4">
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-black uppercase tracking-wider text-foreground">Forgot Password</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              We'll send you an activation or reset link to restore access to your portal account.
            </CardDescription>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 focus:border-zinc-400 dark:focus:border-zinc-700 h-10 text-xs font-medium rounded-xl"
              />
            </div>

            {/* Alert Message */}
            {message && (
              <Alert
                className={
                  message.type === "success"
                    ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20 rounded-xl"
                    : message.type === "warning"
                      ? "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20 rounded-xl"
                      : "bg-red-500/5 text-red-600 border-red-500/20 rounded-xl"
                }
              >
                <div className="flex items-start gap-2.5">
                  {message.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <AlertDescription className="text-[11px] font-medium leading-relaxed">
                    {message.text}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {/* Guidelines block */}
          <div className="bg-zinc-50/50 dark:bg-zinc-950/40 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Not receiving emails?</p>
            <ul className="text-[10px] font-medium text-muted-foreground space-y-1">
              <li>• Double check your junk/spam filters</li>
              <li>• Verify you entered your correct system email address</li>
              <li>• Access token codes expire after 1 hour</li>
            </ul>
          </div>

          {/* Go Back Link */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center">
            <Link
              href={isParentPortal ? "/auth/parent-login" : "/auth/signin"}
              className="text-xs font-bold text-zinc-500 hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
