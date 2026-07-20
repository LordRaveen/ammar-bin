"use client"

import { SessionTermSelector } from "@/components/session-term-selector"

interface ResultsFilterProps {
  sessions: any[]
  terms: any[]
  defaultSession?: string
  defaultTerm?: string
}

export function ResultsFilter({
  sessions,
  terms,
  defaultSession,
  defaultTerm,
}: ResultsFilterProps) {
  return (
    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 w-full">
      <SessionTermSelector
        sessions={sessions}
        terms={terms}
        selectedSessionId={defaultSession}
        selectedTermId={defaultTerm}
        showLabels={true}
        updateUrlOnSelect={true}
        size="default"
      />
    </div>
  )
}
