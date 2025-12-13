"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconLock, IconLockOpen, IconAlertTriangle, IconClock } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Lockout {
  id: string
  email: string
  locked_until: string
  failed_attempts: number
  updated_at: string
}

interface LoginAttempt {
  id: string
  email: string
  ip_address: string
  user_agent: string
  success: boolean
  failure_reason: string | null
  created_at: string
}

interface AccountLockoutsClientProps {
  initialLockouts: Lockout[]
  initialAttempts: LoginAttempt[]
}

export function AccountLockoutsClient({ initialLockouts, initialAttempts }: AccountLockoutsClientProps) {
  const [lockouts, setLockouts] = useState(initialLockouts)
  const [attempts] = useState(initialAttempts)
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const router = useRouter()

  const handleUnlock = async (email: string) => {
    setUnlocking(email)

    try {
      const response = await fetch("/api/auth/unlock-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to unlock account")
      }

      toast.success(`Account ${email} has been unlocked`)

      // Remove from lockouts list
      setLockouts(lockouts.filter((l) => l.email !== email))
      router.refresh()
    } catch (error) {
      toast.error("Failed to unlock account. Please try again.")
    } finally {
      setUnlocking(null)
    }
  }

  const getTimeRemaining = (lockedUntil: string) => {
    const remaining = new Date(lockedUntil).getTime() - Date.now()
    if (remaining <= 0) return "Expired"

    const minutes = Math.ceil(remaining / (1000 * 60))
    return `${minutes} min${minutes !== 1 ? "s" : ""}`
  }

  const isExpired = (lockedUntil: string) => {
    return new Date(lockedUntil).getTime() <= Date.now()
  }

  // Get failed attempts by email
  const failedAttemptsByEmail = attempts
    .filter((a) => !a.success)
    .reduce(
      (acc, attempt) => {
        if (!acc[attempt.email]) {
          acc[attempt.email] = []
        }
        acc[attempt.email].push(attempt)
        return acc
      },
      {} as Record<string, LoginAttempt[]>,
    )

  return (
    <div className="flex flex-col gap-6">
      {/* Active Lockouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconLock className="h-5 w-5" />
            Locked Accounts ({lockouts.length})
          </CardTitle>
          <CardDescription>Accounts that are currently locked due to failed login attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {lockouts.length === 0 ? (
            <Alert>
              <IconLockOpen className="h-4 w-4" />
              <AlertDescription>No accounts are currently locked. All accounts have normal access.</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Failed Attempts</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Locked At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lockouts.map((lockout) => (
                  <TableRow key={lockout.id}>
                    <TableCell className="font-medium">{lockout.email}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{lockout.failed_attempts} attempts</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={
                            isExpired(lockout.locked_until) ? "text-muted-foreground" : "text-amber-600 font-medium"
                          }
                        >
                          {getTimeRemaining(lockout.locked_until)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(lockout.updated_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnlock(lockout.email)}
                        disabled={unlocking === lockout.email}
                      >
                        {unlocking === lockout.email ? "Unlocking..." : "Unlock Account"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Failed Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5" />
            Recent Failed Login Attempts
          </CardTitle>
          <CardDescription>Monitor failed login attempts to identify potential security issues</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(failedAttemptsByEmail).length === 0 ? (
            <Alert>
              <AlertDescription>No recent failed login attempts recorded.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {Object.entries(failedAttemptsByEmail)
                .slice(0, 10)
                .map(([email, userAttempts]) => (
                  <div key={email} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{email}</span>
                      <Badge variant="outline">
                        {userAttempts.length} failed attempt{userAttempts.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {userAttempts.slice(0, 3).map((attempt) => (
                        <div
                          key={attempt.id}
                          className="text-sm text-muted-foreground flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span>IP: {attempt.ip_address}</span>
                            {attempt.failure_reason && (
                              <span className="text-xs text-destructive">Reason: {attempt.failure_reason}</span>
                            )}
                          </div>
                          <span className="text-xs">{new Date(attempt.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
