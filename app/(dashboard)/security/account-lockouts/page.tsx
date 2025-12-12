import { createServerClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UnlockAccountButton } from "@/components/unlock-account-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertTriangle, CheckCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AccountLockoutsPage() {
  await requireAdmin()
  const supabase = await createServerClient()

  // Get all locked accounts
  const { data: lockouts, error } = await supabase
    .from("account_lockouts")
    .select("*")
    .order("created_at", { ascending: false })

  const now = new Date()
  const activeLockouts = lockouts?.filter((l) => new Date(l.locked_until) > now) || []
  const expiredLockouts = lockouts?.filter((l) => new Date(l.locked_until) <= now) || []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Account Lockouts</h1>
        <p className="text-muted-foreground">Manage locked user accounts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lockouts</CardTitle>
            <Lock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLockouts.length}</div>
            <p className="text-xs text-muted-foreground">Currently locked accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Lockouts</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredLockouts.length}</div>
            <p className="text-xs text-muted-foreground">Automatically unlocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lockouts?.reduce((sum, l) => sum + (l.failed_attempts || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Failed login attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Lockouts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Lockouts</CardTitle>
          <CardDescription>Accounts currently locked due to failed login attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {activeLockouts.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>No accounts are currently locked.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {activeLockouts.map((lockout) => {
                const lockedUntil = new Date(lockout.locked_until)
                const minutesRemaining = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000)

                return (
                  <div
                    key={lockout.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-destructive/5"
                  >
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="font-medium">{lockout.email}</p>
                        <p className="text-sm text-muted-foreground">{lockout.failed_attempts} failed attempts</p>
                        <p className="text-sm text-muted-foreground">
                          Locked until {lockedUntil.toLocaleString()} ({minutesRemaining} minutes remaining)
                        </p>
                      </div>
                    </div>
                    <UnlockAccountButton email={lockout.email} />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired Lockouts */}
      {expiredLockouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expired Lockouts</CardTitle>
            <CardDescription>Previously locked accounts that have been automatically unlocked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredLockouts.slice(0, 5).map((lockout) => (
                <div key={lockout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{lockout.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {lockout.failed_attempts} failed attempts - Expired{" "}
                        {new Date(lockout.locked_until).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
