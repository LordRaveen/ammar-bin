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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Security & System Auditing</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Monitor system activity, audit trails, and account lockouts</p>
            </div>
          </div>
          <TabsList className="h-9 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <TabsTrigger value="audit" className="text-xs h-7 gap-1.5 px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-xs transition-all">
              <History className="h-3.5 w-3.5" />
              <span>Audit Logs</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 ml-1">
                {auditLogs.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="lockouts" className="text-xs h-7 gap-1.5 px-3 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-xs transition-all">
              <Lock className="h-3.5 w-3.5" />
              <span>Lockouts</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 ml-1">
                {lockouts.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="audit" className="mt-4">
          <AuditTrailClient logs={auditLogs} />
        </TabsContent>

        <TabsContent value="lockouts" className="mt-4">
          <AccountLockoutsClient initialLockouts={lockouts} initialAttempts={loginAttempts} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
