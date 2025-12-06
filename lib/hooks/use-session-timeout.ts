"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const TIMEOUT_DURATION = 30 * 60 * 1000 // 30 minutes
const WARNING_DURATION = 5 * 60 * 1000 // 5 minutes before timeout

export function useSessionTimeout(onWarning?: () => void) {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const warningRef = useRef<NodeJS.Timeout>()

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/signin")
  }, [router])

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    // Set warning timer
    warningRef.current = setTimeout(() => {
      onWarning?.()
    }, TIMEOUT_DURATION - WARNING_DURATION)

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout()
    }, TIMEOUT_DURATION)
  }, [handleLogout, onWarning])

  useEffect(() => {
    // Track user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"]

    const handleActivity = () => {
      resetTimer()
    }

    // Initial timer
    resetTimer()

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [resetTimer])

  return { resetTimer }
}
