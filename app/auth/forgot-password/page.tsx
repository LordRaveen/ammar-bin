"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
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

    try {
      const supabase = createClient()

      const { data: guardianData } = await supabase
        .from("guardians")
        .select("id, email, user_id")
        .eq("email", email)
        .maybeSingle()

      console.log("[v0] Guardian check:", { email, found: !!guardianData, hasUserId: !!guardianData?.user_id })

      if (!guardianData) {
        setMessage({
          type: "error",
          text: "No account found with this email address. Please check your email or contact the school admin.",
        })
        setIsLoading(false)
        return
      }

      if (!guardianData.user_id) {
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

      console.log("[v0] Sending reset email to:", email, "Redirect:", redirectTo)

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      console.log("[v0] Reset password response:", { data, error })

      if (error) {
        console.error("[v0] Supabase reset error:", error)
        throw error
      }

      setMessage({
        type: "success",
        text: "Password reset link has been sent to your email. Please check your inbox and spam folder. The link will expire in 1 hour.",
      })
      setEmail("")
    } catch (error: any) {
      console.error("[v0] Password reset failed:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to send reset link. Please try again or contact support.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>We'll send you a link to reset your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} method="dialog">
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {message && (
                    <div
                      className={`rounded-md p-3 ${
                        message.type === "success"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm">
                    <ArrowLeft className="h-4 w-4" />
                    <Link
                      href={isParentPortal ? "/auth/parent-login" : "/auth/signin"}
                      className="text-primary hover:underline"
                    >
                      Back to {isParentPortal ? "Parent" : "Staff"} Login
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground text-center">
                Not receiving emails? Check your spam folder or contact the school admin at admin@school.com
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
