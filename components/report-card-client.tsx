"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ChevronLeft, 
  Printer, 
  Trophy, 
  BookOpen, 
  MessageSquare, 
  Award,
  Maximize2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PrintableReportCard } from "./printable-report-card"

interface ReportCardClientProps {
  student: any
  session: any
  term: any
  result: any
  subjectScores: Record<string, any>
  school: any
  skills?: any[]
}

export function ReportCardClient({
  student,
  session,
  term,
  result,
  subjectScores,
  school,
  skills = [],
}: ReportCardClientProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__breadcrumbLabels = (window as any).__breadcrumbLabels || {};
      const key = student.id;
      (window as any).__breadcrumbLabels[key] = `${student.first_name} ${student.last_name}`;
      window.dispatchEvent(new CustomEvent('breadcrumb-update'));
    }
  }, [student])

  const studentInitials = `${student.first_name[0] || ""}${student.last_name[0] || ""}`.toUpperCase()
  const totalSubjects = Object.keys(subjectScores).length
  const totalScore = result?.total_score || 0
  const averageScore = result?.average_score || 0
  const position = result?.position || null

  const affectiveSkillsList = [
    "Punctuality",
    "Politeness",
    "Neatness",
    "Honesty",
    "Leadership skill",
    "Cooperation",
    "Attentiveness",
    "Perseverance",
    "Attitude to work"
  ]

  const psychomotorSkillsList = [
    "Handwriting",
    "Verbal fluency",
    "Sports",
    "Handling tools",
    "Drawing & painting"
  ]

  const getSkillRating = (category: string, name: string) => {
    const found = skills?.find(
      (s) => s.skill_category === category && s.skill_name.toLowerCase() === name.toLowerCase()
    )
    return found ? found.rating : "—"
  }

  const handlePrint = () => {
    window.print()
  }

// We use the shared PrintableReportCard component for the print preview and actual print view.

  return (
    <div className="space-y-8 pt-2">
      {/* Web View (hidden when printing) */}
      <div className="print:hidden space-y-6">
        {/* Interactive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/30 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <Link href="/classes">
              <Button variant="ghost" size="icon" className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground font-black text-sm">
                  {studentInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  {student.first_name} {student.last_name}
                </h1>
                <p className="text-xs font-semibold text-muted-foreground">
                  ID: {student.student_id} • {student.classes?.sections?.name} - {student.classes?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Print Preview Trigger Button */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-10 font-bold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Print Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl bg-white text-black">
                <DialogHeader className="p-6 border-b border-zinc-100 flex flex-row items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-lg font-black uppercase">Report Card Preview</DialogTitle>
                  </div>
                  <Button onClick={handlePrint} className="mr-6 font-bold">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Document
                  </Button>
                </DialogHeader>
                <div className="p-6 overflow-x-auto">
                  <PrintableReportCard 
                    student={student}
                    session={session}
                    term={term}
                    result={result}
                    subjectScores={subjectScores}
                    school={school}
                    skills={skills}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handlePrint} className="h-10 font-bold">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Compact KPI dashboard cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border gap-0 border-zinc-200 dark:border-zinc-800/80 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 py-3">
            <CardContent className="px-4 m-0 py-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Academic Period</span>
                <p className="text-xl font-bold mt-1 text-zinc-800 dark:text-zinc-200">{session?.name}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">{term?.name}</p>
              </div>
              <BookOpen className="h-8 w-8 text-zinc-300 dark:text-zinc-700 shrink-0" />
            </CardContent>
          </Card>

          <Card className="border gap-0 border-zinc-200 dark:border-zinc-800/80 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 py-3">
            <CardContent className="px-4 m-0 py-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Cumulative Score</span>
                <p className="text-xl font-black mt-1">{totalScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Across {totalSubjects} learning subjects</p>
              </div>
              <Award className="h-8 w-8 text-zinc-300 dark:text-zinc-700 shrink-0" />
            </CardContent>
          </Card>

          <Card className="border gap-0 border-zinc-200 dark:border-zinc-800/80 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 py-3">
            <CardContent className="px-4 m-0 py-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Overall Average</span>
                <p className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-500">{averageScore.toFixed(1)}%</p>
                <div className="w-24 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-emerald-500 h-full" style={{ width: `${averageScore}%` }} />
                </div>
              </div>
              <span className="text-xs font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md shrink-0 self-start">
                Passed
              </span>
            </CardContent>
          </Card>

          <Card className="border gap-0 border-zinc-200 dark:border-zinc-800/80 shadow-none bg-zinc-50/50 dark:bg-zinc-900/10 py-3">
            <CardContent className="px-4 m-0 py-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Class Position</span>
                {position ? (
                  <>
                    <p className="text-xl font-black mt-1 flex items-center gap-1.5 text-amber-500">
                      <Trophy className="h-6 w-6 fill-amber-500 shrink-0" />
                      {position}
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Top rank candidate</p>
                  </>
                ) : (
                  <p className="text-xl font-bold mt-1 text-zinc-500">N/A</p>
                )}
              </div>
              {position && position <= 3 && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 self-start">
                  Podium
                </span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Subject Grades table */}
        <Card className="border border-zinc-200 dark:border-zinc-800/80 shadow-none bg-secondary/30 dark:bg-secondary/10 rounded-lg overflow-hidden pt-2 gap-0">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-sm font-bold">Subject Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-0 m-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50/50 dark:bg-zinc-900/20">
                    <th className="text-left py-2 px-4">Subject</th>
                    <th className="text-center py-2 px-3">CA 1 (20)</th>
                    <th className="text-center py-2 px-3">CA 2 (20)</th>
                    <th className="text-center py-2 px-3">Exam (60)</th>
                    <th className="text-center py-2 px-3">Total (100)</th>
                    <th className="text-center py-2 px-3">Grade</th>
                    <th className="text-left py-2 px-4">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {Object.entries(subjectScores).map(([subject, data]: [string, any]) => (
                    <tr 
                      key={subject}
                      className="border-b border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-950/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/80 transition-colors"
                    >
                      <td className="py-2 px-4 font-bold text-sm text-zinc-800 dark:text-zinc-100">{subject}</td>
                      <td className="py-2 px-3 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">{data.ca1}</td>
                      <td className="py-2 px-3 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">{data.ca2}</td>
                      <td className="py-2 px-3 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">{data.exam}</td>
                      <td className="py-2 px-3 text-center text-sm font-black text-zinc-800 dark:text-zinc-200">{data.total}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant={data.total >= 50 ? "secondary" : "destructive"} className="font-bold text-[10px] px-2 py-0">
                          {data.grade || "F"}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 font-bold text-xs">
                        <span className={cn(
                          data.total >= 50 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"
                        )}>
                          {data.remark}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Skills Assessments */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Affective Skills */}
          <Card className="border border-zinc-200 dark:border-zinc-800/80 shadow-none bg-white dark:bg-zinc-950/20 p-2 gap-2">
            <CardHeader className=" pt-2 gap-0 px-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-3!">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Affective Skills</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                {affectiveSkillsList.map((skill) => (
                  <div key={skill} className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-900/20 last:border-0 sm:[&:nth-last-child(-n+2)]:border-0">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{skill}</span>
                    <span className="font-extrabold text-xs text-primary pr-2">
                      {getSkillRating("Affective", skill)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Psychomotor Skills */}
          <Card className="border border-zinc-200 dark:border-zinc-800/80 shadow-none bg-white dark:bg-zinc-950/20 p-2 gap-2">
            <CardHeader className=" pt-2 gap-0 px-4 border-b border-zinc-100 dark:border-zinc-900/60 pb-3!">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Psychomotor Skills</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                {psychomotorSkillsList.map((skill) => (
                  <div key={skill} className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-900/20 last:border-0 sm:[&:nth-last-child(-n+2)]:border-0">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{skill}</span>
                    <span className="font-extrabold text-xs text-primary pr-2">
                      {getSkillRating("Psychomotor", skill)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Comments */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-zinc-200 dark:border-zinc-800/80 shadow-none bg-white dark:bg-zinc-950/20">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              <CardTitle className="text-sm font-bold">Class Teacher's Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 italic min-h-[50px]">
                {result?.teacher_comment || "No comment registered yet."}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800/80 shadow-none bg-white dark:bg-zinc-950/20">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              <CardTitle className="text-sm font-bold">Principal's Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 italic min-h-[50px]">
                {result?.principal_comment || "No comment registered yet."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printer-only view (fully hides main site elements and modal containers when printed) */}
      <div className="hidden print:block bg-white text-black p-0 border-none m-0 shadow-none">
        <PrintableReportCard 
          student={student}
          session={session}
          term={term}
          result={result}
          subjectScores={subjectScores}
          school={school}
          skills={skills}
        />
      </div>
    </div>
  )
}
