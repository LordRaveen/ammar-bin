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
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ResultsFilterProps {
  sessions: any[]
  terms: any[]
  classes: any[]
  defaultSession?: string
  defaultTerm?: string
}

export function ResultsFilter({
  sessions,
  terms,
  classes,
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
  const [selectedClass, setSelectedClass] = useState(
    searchParams.get("class") || ""
  )

  // Update filtered terms when session changes
  const filteredTerms = selectedSession
    ? terms.filter((t) => t.session_id === selectedSession)
    : []

  const handleViewResults = () => {
    if (!selectedSession || !selectedTerm || !selectedClass) return

    const params = new URLSearchParams()
    params.set("session", selectedSession)
    params.set("term", selectedTerm)
    params.set("class", selectedClass)

    router.push(`/assessments/results?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Filters</CardTitle>
        <CardDescription>
          Choose session, term, and class to view results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select 
                value={selectedSession} 
                onValueChange={(value) => {
                  setSelectedSession(value)
                  // Reset term when session changes
                  setSelectedTerm("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions?.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                      {session.is_active && (
                        <Badge variant="secondary" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select
                value={selectedTerm}
                onValueChange={setSelectedTerm}
                disabled={!selectedSession}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTerms?.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                      {term.is_active && (
                        <Badge variant="secondary" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.sections.name} - {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleViewResults} disabled={!selectedSession || !selectedTerm || !selectedClass}>
            View Results
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
