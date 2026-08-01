"use client"

import { useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface SessionTermSelectorProps {
  sessions: any[]
  terms?: any[]
  selectedSessionId?: string
  selectedTermId?: string
  onSessionChange?: (sessionId: string) => void
  onTermChange?: (termId: string) => void
  onSessionTermChange?: (sessionId: string, termId: string) => void
  updateUrlOnSelect?: boolean
  showLabels?: boolean
  size?: "xs" | "sm" | "default"
  className?: string
}

export function SessionTermSelector({
  sessions = [],
  terms = [],
  selectedSessionId,
  selectedTermId,
  onSessionChange,
  onTermChange,
  onSessionTermChange,
  updateUrlOnSelect = true,
  showLabels = false,
  size = "sm",
  className,
}: SessionTermSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Flatten terms if they exist on sessions
  const allTerms = useMemo(() => {
    if (terms && terms.length > 0) return terms
    const extracted: any[] = []
    sessions.forEach((s) => {
      if (s.terms && Array.isArray(s.terms)) {
        extracted.push(...s.terms)
      }
    })
    return extracted
  }, [sessions, terms])

  // Determine current active or default session
  const activeSessionId = useMemo(() => {
    if (selectedSessionId) return selectedSessionId
    const urlSession = searchParams.get("session")
    if (urlSession && sessions.some((s) => s.id === urlSession)) return urlSession
    const active = sessions.find((s) => s.is_active)
    return active?.id || sessions[0]?.id || ""
  }, [selectedSessionId, searchParams, sessions])

  // Get terms for the currently active session
  const sessionTerms = useMemo(() => {
    if (!activeSessionId) return []
    return allTerms
      .filter((t) => t.session_id === activeSessionId)
      .sort((a, b) => (a.term_number || 0) - (b.term_number || 0))
  }, [allTerms, activeSessionId])

  // Determine current active or default term
  const activeTermId = useMemo(() => {
    if (selectedTermId && sessionTerms.some((t) => t.id === selectedTermId)) return selectedTermId
    const urlTerm = searchParams.get("term")
    if (urlTerm && sessionTerms.some((t) => t.id === urlTerm)) return urlTerm
    const active = sessionTerms.find((t) => t.is_active)
    return active?.id || sessionTerms[0]?.id || ""
  }, [selectedTermId, searchParams, sessionTerms])

  // Handle Session Change
  const handleSessionChange = (newSessionId: string) => {
    const newSessionTerms = allTerms
      .filter((t) => t.session_id === newSessionId)
      .sort((a, b) => (a.term_number || 0) - (b.term_number || 0))

    const activeInNewSession = newSessionTerms.find((t) => t.is_active)
    const newTermId = activeInNewSession?.id || newSessionTerms[0]?.id || ""

    if (onSessionChange) onSessionChange(newSessionId)
    if (onTermChange && newTermId) onTermChange(newTermId)
    if (onSessionTermChange) onSessionTermChange(newSessionId, newTermId)

    if (updateUrlOnSelect) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("session", newSessionId)
      if (newTermId) params.set("term", newTermId)
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  // Handle Term Change
  const handleTermChange = (newTermId: string) => {
    if (onTermChange) onTermChange(newTermId)
    if (onSessionTermChange) onSessionTermChange(activeSessionId, newTermId)

    if (updateUrlOnSelect) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("session", activeSessionId)
      params.set("term", newTermId)
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  const triggerHeight = size === "xs" ? "h-7 text-xs px-2" : size === "sm" ? "h-8 text-xs" : "h-10 text-sm"

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Session Select */}
      <div className="flex flex-col gap-1">
        {showLabels && <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Session</span>}
        <Select value={activeSessionId} onValueChange={handleSessionChange}>
          <SelectTrigger className={cn("w-fit min-w-[100px] px-3 font-semibold bg-background border-input", triggerHeight)}>
            <SelectValue placeholder="Select Session" />
          </SelectTrigger>
          <SelectContent align="start" className="w-[180px]">
            {sessions.map((session) => (
              <SelectItem key={session.id} value={session.id} className="text-xs font-medium">
                <div className="flex items-center justify-between w-full gap-2">
                  <span>{session.name}</span>
                  {session.is_active && (
                    <Badge variant="secondary" className="py-0 px-1 text-[9px] font-bold">
                      Active
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Term Select */}
      <div className="flex flex-col gap-1">
        {showLabels && <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Term</span>}
        <Select value={activeTermId} onValueChange={handleTermChange} disabled={sessionTerms.length === 0}>
          <SelectTrigger className={cn("w-fit min-w-[100px] px-3 font-semibold bg-background border-input", triggerHeight)}>
            <SelectValue placeholder="Select Term" />
          </SelectTrigger>
          <SelectContent align="start" className="w-[180px]">
            {sessionTerms.map((term) => (
              <SelectItem key={term.id} value={term.id} className="text-xs font-medium">
                <div className="flex items-center justify-between w-full gap-2">
                  <span>{term.name}</span>
                  {term.is_active && (
                    <Badge variant="secondary" className="py-0 px-1 text-[9px] font-bold">
                      Active
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
