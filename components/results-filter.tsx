"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedSession, setSelectedSession] = useState(
    searchParams.get("session") || defaultSession || ""
  )
  const [selectedTerm, setSelectedTerm] = useState(
    searchParams.get("term") || defaultTerm || ""
  )
  const [isLoading, setIsLoading] = useState(false)

  // Reset loading state when search parameters change
  useEffect(() => {
    setIsLoading(false)
  }, [searchParams])

  // Update filtered terms when session changes and sort them chronologically (First, Second, Third)
  const termOrder = ["first", "second", "third", "fourth", "fifth"]
  const filteredTerms = selectedSession
    ? terms
        .filter((t) => t.session_id === selectedSession)
        .sort((a, b) => {
          const aIndex = termOrder.findIndex(o => a.name.toLowerCase().includes(o))
          const bIndex = termOrder.findIndex(o => b.name.toLowerCase().includes(o))
          return aIndex - bIndex
        })
    : []

  const updateUrl = (session: string, term: string) => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (session) params.set("session", session)
    if (term) params.set("term", term)
    router.push(`/assessments/results?${params.toString()}`)
  }

  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 w-full">
      <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
        {/* Session Selector */}
        <div className="flex-1 min-w-[140px] space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block px-0.5">
            Session
          </span>
          <Select 
            value={selectedSession} 
            onValueChange={(value) => {
              setSelectedSession(value)
              const newFiltered = terms.filter((t) => t.session_id === value)
              let newTerm = ""
              if (newFiltered.length > 0) {
                // Auto select first term
                newTerm = newFiltered[0].id
                setSelectedTerm(newTerm)
              } else {
                setSelectedTerm("")
              }
              updateUrl(value, newTerm)
            }}
          >
            <SelectTrigger className="h-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-medium">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {sessions?.map((session) => (
                <SelectItem key={session.id} value={session.id} className="font-medium">
                  {session.name}
                  {session.is_active && (
                    <Badge variant="secondary" className="ml-2 py-0 px-1 text-[9px] font-bold">
                      Active
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Term Segmented Selector */}
        <div className="flex-1 min-w-[220px] space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block px-0.5">
            Term
          </span>
          <div className="flex h-10 items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-1">
            {filteredTerms.length > 0 ? (
              filteredTerms.map((term) => {
                const isSelected = selectedTerm === term.id
                const displayName = term.name.replace(/Term/i, "").trim()
                return (
                  <button
                    key={term.id}
                    type="button"
                    onClick={() => {
                      setSelectedTerm(term.id)
                      updateUrl(selectedSession, term.id)
                    }}
                    className={cn(
                      "h-full flex-1 rounded-md px-3 text-xs font-black uppercase tracking-wider transition-all",
                      isSelected
                        ? "bg-white dark:bg-zinc-800 text-black dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                  >
                    {displayName}
                  </button>
                )
              })
            ) : (
              ["First", "Second", "Third"].map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  disabled
                  className="h-full flex-1 text-xs font-black uppercase tracking-wider text-zinc-300 dark:text-zinc-600/40 cursor-not-allowed"
                >
                  {lbl}
                </button>
              ))
            )}
          </div>
        </div>

        </div>
    </div>
  )
}
