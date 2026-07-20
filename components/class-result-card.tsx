"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Users, Printer } from "lucide-react"
import { generateClassResults } from "@/app/(dashboard)/assessments/results/actions"
import { toast } from "sonner"

interface ClassResultCardProps {
  classId: string
  className: string
  sectionName: string
  sessionId: string
  termId: string
  studentCount?: number
}

export function ClassResultCard({
  classId,
  className,
  sectionName,
  sessionId,
  termId,
  studentCount = 0
}: ClassResultCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleOpenResults = async () => {
    if (!sessionId || !termId) {
      toast.error("Please select a session and term first.")
      return
    }

    setIsLoading(true)
    try {
      // Auto generate/regenerate results when clicking
      const result = await generateClassResults(classId, sessionId, termId)
      
      if (result && !result.success && result.error && !result.error.includes("No students found")) {
        // If it failed for a reason other than "no students", show an error
        toast.error("Failed to generate results: " + result.error)
        setIsLoading(false)
        return
      }
      
      // Navigate straight to finalize page
      const params = new URLSearchParams()
      params.set("session", sessionId)
      params.set("term", termId)
      params.set("class", classId)
      
      router.push(`/assessments/results/finalize?${params.toString()}`)
      
      // Note: We don't set isLoading to false here to let the loading state 
      // persist while the page transitions
    } catch (error) {
      toast.error("An unexpected error occurred.")
      setIsLoading(false)
    }
  }

  return (
    <Card 
      className="group overflow-hidden border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
      onClick={handleOpenResults}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
              {sectionName}
            </p>
            <h3 className="text-base font-bold group-hover:text-primary transition-colors">
              {className}
            </h3>
            {studentCount > 0 && (
              <div className="flex items-center text-xs text-zinc-500 font-medium pt-0.5">
                <Users className="h-3 w-3 mr-1.5" />
                {studentCount} Students
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-900 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
