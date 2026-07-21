"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountLockoutsClient } from "@/components/account-lockouts-client"
import AuditTrailClient from "@/components/audit-trail-client"
import { Shield, History, Lock } from "lucide-react"

interface SecurityTabProps {
  auditLogs: any[]
  lockouts: any[]
  loginAttempts: any[]
}

export function SecurityTab({ auditLogs, lockouts, loginAttempts }: SecurityTabProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="audit" className="w-full">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h2 className="text-base font-bold">Security & System Auditing</h2>
              <p className="text-xs text-muted-foreground">Monitor system activity, audit trails, and account lockouts</p>
            </div>
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="audit" className="text-xs h-7 gap-1.5 px-3">
              <History className="h-3.5 w-3.5" />
              Audit Logs ({auditLogs.length})
            </TabsTrigger>
            <TabsTrigger value="lockouts" className="text-xs h-7 gap-1.5 px-3">
              <Lock className="h-3.5 w-3.5" />
              Account Lockouts ({lockouts.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="audit" className="mt-3">
          <AuditTrailClient logs={auditLogs} />
        </TabsContent>

        <TabsContent value="lockouts" className="mt-3">
          <AccountLockoutsClient initialLockouts={lockouts} initialAttempts={loginAttempts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
