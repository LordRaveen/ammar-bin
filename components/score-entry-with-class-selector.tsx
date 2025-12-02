"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScoreEntryInterface } from "@/components/score-entry-interface"
import { createBrowserClient } from "@/lib/supabase/client"

interface ScoreEntryWithClassSelectorProps {
  classes: Array<{
    id: string
    name: string
    sections: { name: string }
  }>
  sessionId: string
  sessionName: string
  termId: string
  termName: string
  initialClassId?: string
}

export function ScoreEntryWithClassSelector({
  classes,
  sessionId,
  sessionName,
  termId,
  termName,
  initialClassId,
}: ScoreEntryWithClassSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()

  const [selectedClass, setSelectedClass] = useState<string>(initialClassId || "")
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedClass) {
      // Update URL with selected class
      const params = new URLSearchParams(searchParams.toString())
      params.set("class", selectedClass)
      router.push(`?${params.toString()}`)
      
      fetchClassData()
    }
  }, [selectedClass])

  async function fetchClassData() {
    if (!selectedClass) return

    setLoading(true)
    try {
      // Fetch enrolled students
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("id, students(*)")
        .eq("class_id", selectedClass)
        .eq("session_id", sessionId)
        .eq("term_id", termId)
        .eq("is_active", true)

      if (enrollments) {
        const studentsList = enrollments.map(e => ({
          enrollment_id: e.id,
          ...(e.students as any)
        }))
        setStudents(studentsList)
      }

      // Fetch class subjects
      const { data: classSubjects } = await supabase
        .from("class_subjects")
        .select("*, subject:subjects(*)")
        .eq("class_id", selectedClass)

      if (classSubjects) {
        const subjectsList = classSubjects.map(cs => ({
          id: cs.subject.id,
          name: cs.subject.name,
          code: cs.subject.code,
          max_score: cs.max_score,
          pass_mark: cs.pass_mark,
        }))
        setSubjects(subjectsList)
      }
    } catch (error) {
      console.error("[v0] Error fetching class data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assessments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Score Entry</h1>
          <p className="text-muted-foreground">
            {sessionName} - {termName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
          <CardDescription>
            Choose a class to enter scores for students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.sections.name} - {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedClass && !loading && students.length > 0 && subjects.length > 0 && (
        <ScoreEntryInterface
          classId={selectedClass}
          sessionId={sessionId}
          termId={termId}
          students={students}
          subjects={subjects}
        />
      )}

      {selectedClass && !loading && (students.length === 0 || subjects.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {students.length === 0 && "No students enrolled in this class."}
              {subjects.length === 0 && "No subjects assigned to this class."}
            </p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading class data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
