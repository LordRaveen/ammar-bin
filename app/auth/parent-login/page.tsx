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
import { UserCircle } from "lucide-react"

export default function ParentLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Check if user is a parent/guardian
      const { data: guardianData, error: guardianError } = await supabase
        .from("guardians")
        .select("id, first_name, last_name, user_id")
        .eq("user_id", data.user.id)
        .single()

      if (guardianError || !guardianData) {
        await supabase.auth.signOut()
        throw new Error("Access denied. This portal is for parents and guardians only.")
      }

      // Redirect to parent dashboard
      router.push("/parent/dashboard")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Failed to sign in. Please check your credentials.")
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
              <UserCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Parent Portal</h1>
            <p className="text-sm text-muted-foreground">Ammar Bin Yasir Institute</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your children's information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="parent@example.com"
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
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </form>

              <div className="mt-4 text-center text-sm">
                <Link href="/auth/signin" className="text-primary hover:underline">
                  Staff/Admin Login
                </Link>
              </div>

              <div className="mt-2 text-center text-sm text-muted-foreground">
                <p>Contact the school administrator if you need access credentials.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
