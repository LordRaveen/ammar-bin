import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft, Printer, Trophy, Award } from "lucide-react"
import { ResultsFilter } from "@/components/results-filter"
import { ClassResultCard } from "@/components/class-result-card"

export const dynamic = "force-dynamic"

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; session?: string; term?: string }>
}) {
  await requireAuth(["super_admin", "admin", "teacher"])
  const params = await searchParams
  const supabase = await createServerClient()

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, name, is_active")
    .order("name", { ascending: false })

  const { data: terms } = await supabase
    .from("terms")
    .select("id, name, session_id, is_active, term_number")
    .order("term_number", { ascending: true })

  let selectedSession = params.session
  let selectedTerm = params.term

  if (!selectedSession) {
    const activeSession = sessions?.find((s: any) => s.is_active)
    selectedSession = activeSession?.id
  }

  if (!selectedTerm && selectedSession) {
    const activeTerm = terms?.find((t: any) => t.session_id === selectedSession && t.is_active)
    selectedTerm = activeTerm?.id
  }

  // Get all classes
  const { data: classes } = await supabase
    .from("classes")
    .select("*, sections(name)")
    .eq("is_active", true)
    .order("name")

  // Group classes by section for better UI
  const groupedClasses = classes?.reduce((acc: any, cls: any) => {
    const sectionName = cls.sections?.name || "Other"
    if (!acc[sectionName]) acc[sectionName] = []
    acc[sectionName].push(cls)
    return acc
  }, {})

  const sectionOrder = ["Pre-Nursery", "Nursery", "Primary", "Junior Secondary", "Senior Secondary"]
  const sortedSections = Object.keys(groupedClasses || {}).sort((a, b) => {
    const aIndex = sectionOrder.findIndex(o => a.toLowerCase().includes(o.toLowerCase()))
    const bIndex = sectionOrder.findIndex(o => b.toLowerCase().includes(o.toLowerCase()))
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Print Class Results</h1>
        </div>
      </div>

      <ResultsFilter
        sessions={sessions || []}
        terms={terms || []}
        defaultSession={selectedSession}
        defaultTerm={selectedTerm}
      />

      {selectedSession && selectedTerm ? (
        <div className="space-y-8 mt-8">
          {sortedSections.map((sectionName) => (
            <div key={sectionName} className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                {sectionName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedClasses[sectionName].map((cls: any) => (
                  <ClassResultCard
                    key={cls.id}
                    classId={cls.id}
                    className={cls.name}
                    sectionName={sectionName}
                    sessionId={selectedSession}
                    termId={selectedTerm}
                  />
                ))}
              </div>
            </div>
          ))}
          {sortedSections.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              No active classes found.
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 space-y-2">
          <p>Please select a session and term above to view classes.</p>
        </div>
      )}
    </div>
  )
}
