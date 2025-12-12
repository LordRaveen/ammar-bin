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
      setMessage({
        type: "error",
        text: error.message || "Failed to send reset link. Please contact the school admin for manual password reset.",
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
                    <Alert
                      className={
                        message.type === "success"
                          ? "bg-green-50 text-green-800 border-green-200"
                          : message.type === "warning"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-destructive/15 text-destructive border-destructive/20"
                      }
                    >
                      {message.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription className="text-sm">{message.text}</AlertDescription>
                    </Alert>
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
            <CardContent className="pt-6 space-y-2">
              <p className="text-xs text-muted-foreground text-center font-semibold">Not receiving emails?</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Wait 5-10 minutes for delivery</li>
                <li>• Verify your email address is correct</li>
                <li>• Contact school admin: admin@school.com</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
