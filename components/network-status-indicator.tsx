"use client"

import { useState, useEffect, useCallback } from "react"
import { WifiOff, X, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function NetworkStatusIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleOnline = useCallback(() => {
    setIsOffline(false)
    setDismissed(false)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOffline(true)
    setDismissed(false)
  }, [])

  useEffect(() => {
    // Check initial status
    setIsOffline(!navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Also detect fetch failures from Supabase / API calls
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        // If we get a successful response and we thought we were offline, update
        if (isOffline && response.ok) {
          setIsOffline(false)
          setDismissed(false)
        }
        return response
      } catch (error: any) {
        if (
          error?.message?.toLowerCase().includes("failed to fetch") ||
          error?.message?.toLowerCase().includes("networkerror") ||
          error?.message?.toLowerCase().includes("network request failed") ||
          error?.name === "TypeError"
        ) {
          setIsOffline(true)
          setDismissed(false)
        }
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [isOffline])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      // Attempt a lightweight fetch to check connectivity
      await fetch("/api/health", { method: "HEAD", cache: "no-store" }).catch(() => null)
      if (navigator.onLine) {
        setIsOffline(false)
        setDismissed(false)
      }
    } finally {
      setIsRetrying(false)
    }
  }

  if (!isOffline || dismissed) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] transition-all duration-300",
        "bg-amber-500 dark:bg-amber-600 text-white shadow-lg"
      )}
    >
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-xs font-bold">
        <WifiOff className="h-3.5 w-3.5 shrink-0 animate-pulse" />
        <span>You are currently offline. Some features may not work properly.</span>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
          Retry
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 rounded-md p-0.5 hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
