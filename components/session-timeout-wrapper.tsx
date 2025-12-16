"use client"

import type React from "react"

import { useSessionTimeout } from "@/lib/hooks/use-session-timeout"
import { useToast } from "@/hooks/use-toast"

export function SessionTimeoutWrapper({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()

  // Initialize session timeout with warning callback
  useSessionTimeout(() => {
    toast({
      title: "Session Expiring Soon",
      description:
        "Your session will expire in 5 minutes due to inactivity. Please interact with the page to stay logged in.",
      variant: "destructive",
      duration: 10000,
    })
  })

  return <>{children}</>
}
