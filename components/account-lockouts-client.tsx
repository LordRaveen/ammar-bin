"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconLock, IconLockOpen, IconAlertTriangle, IconClock, IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

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
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({
    // Pre-expand the first couple of accounts for better visual layout on load
  })
  
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

  const toggleExpand = (email: string) => {
    setExpandedEmails(prev => ({
      ...prev,
      [email]: !prev[email]
    }))
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
    <div className="grid grid-cols-1 gap-6">
      {/* Active Lockouts */}
      <Card className="shadow-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
        <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-row items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <IconLock className="h-4.5 w-4.5 text-zinc-500" />
              Locked Accounts
              <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-4 bg-zinc-100 dark:bg-zinc-800 border-0 text-zinc-600 dark:text-zinc-300">
                {lockouts.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground mt-0.5">Accounts currently locked out from repeated failed log-ins</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lockouts.length === 0 ? (
            <div className="flex items-center gap-2 p-5 text-xs text-muted-foreground">
              <IconLockOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>No accounts are currently locked. All accounts have normal access.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-200 dark:border-zinc-800">
                  <TableRow className="h-8 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2">Email Address</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 w-36">Failed Attempts</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 w-36">Time Remaining</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 w-48">Locked At</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2 text-right w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lockouts.map((lockout) => (
                    <TableRow key={lockout.id} className="h-9 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs border-b border-zinc-100 dark:border-zinc-900/60 transition-colors">
                      <TableCell className="px-4 py-1 font-semibold text-foreground">{lockout.email}</TableCell>
                      <TableCell className="px-4 py-1">
                        <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 bg-red-500/10 border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          {lockout.failed_attempts} attempts
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <IconClock className="h-3.5 w-3.5 text-zinc-400" />
                          <span
                            className={cn(
                              "font-semibold font-mono",
                              isExpired(lockout.locked_until) ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {getTimeRemaining(lockout.locked_until)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-1 text-muted-foreground text-[11px]">
                        {new Date(lockout.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-4 py-1 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnlock(lockout.email)}
                          disabled={unlocking === lockout.email}
                          className="h-7 text-[10px] font-semibold border-zinc-200 dark:border-zinc-800"
                        >
                          {unlocking === lockout.email ? "Unlocking..." : "Unlock Account"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Failed Attempts */}
      <Card className="shadow-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
        <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50">
          <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
            <IconAlertTriangle className="h-4.5 w-4.5 text-zinc-500" />
            Recent Failed Login Attempts
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground mt-0.5">Grouped by account, most recent attempt first</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {Object.keys(failedAttemptsByEmail).length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              No recent failed login attempts recorded.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(failedAttemptsByEmail)
                .slice(0, 10)
                .map(([email, userAttempts]) => {
                  const isExpanded = !!expandedEmails[email]
                  return (
                    <div key={email} className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-950/20">
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(email)}
                        className="w-full flex items-center justify-between p-3.5 text-xs text-left hover:bg-zinc-50/60 dark:hover:bg-zinc-900/10 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isExpanded ? (
                            <IconChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="font-semibold text-foreground truncate">{email}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400">
                          {userAttempts.length} failed attempt{userAttempts.length !== 1 ? "s" : ""}
                        </Badge>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-3.5 pt-0 border-t border-zinc-100 dark:border-zinc-850/60 bg-zinc-50/20 dark:bg-zinc-950/40 divide-y divide-zinc-100/50 dark:divide-zinc-900/50 space-y-2">
                          {userAttempts.slice(0, 5).map((attempt, idx) => (
                            <div
                              key={attempt.id}
                              className={cn(
                                "text-xs flex items-center justify-between py-2.5 first:pt-1.5 last:pb-0",
                                "font-mono"
                              )}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <span className="h-1 w-1 rounded-full bg-zinc-400" />
                                  IP: {attempt.ip_address}
                                </span>
                                {attempt.failure_reason && (
                                  <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold pl-2">
                                    Reason: {attempt.failure_reason}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                                <IconClock className="h-3 w-3 text-zinc-400" />
                                {new Date(attempt.created_at).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
