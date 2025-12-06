"use client"

import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ParentReportCardPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; sessionId?: string; termId?: string }>
}) {
  const user = await requireAuth()
  const params = await searchParams

  if (user.role !== "parent") {
    return <div>Access Denied</div>
  }

  const { studentId, sessionId, termId } = params

  if (!studentId || !sessionId || !termId) {
    return notFound()
  }

  const supabase = await createClient()

  const { data: guardian } = await supabase.from("guardians").select("id").eq("user_id", user.id).single()

  if (!guardian) {
    return <div>Guardian not found</div>
  }

  const { data: studentGuardian } = await supabase
    .from("student_guardians")
    .select("*")
    .eq("guardian_id", guardian.id)
    .eq("student_id", studentId)
    .single()

  if (!studentGuardian) {
    return <div>Access denied</div>
  }

  const { data: student } = await supabase
    .from("students")
    .select(
      `
      *,
      student_enrollments!inner (
        classes (
          name,
          sections (name)
        )
      )
    `,
    )
    .eq("id", studentId)
    .eq("student_enrollments.is_active", true)
    .single()

  if (!student) {
    return notFound()
  }

  const currentClass = student.student_enrollments?.[0]?.classes

  const { data: session } = await supabase.from("sessions").select("*").eq("id", sessionId).single()

  const { data: term } = await supabase.from("terms").select("*").eq("id", termId).single()

  const { data: result } = await supabase
    .from("student_results")
    .select("*")
    .eq("student_id", studentId)
    .eq("session_id", sessionId)
    .eq("term_id", termId)
    .single()

  const { data: scoresData } = await supabase
    .from("student_scores")
    .select(
      `
      *,
      assessments (
        assessment_types (name),
        class_subjects (
          subjects (name, code)
        )
      )
    `,
    )
    .eq("student_id", studentId)

  const subjectScores: Record<string, any> = {}
  scoresData?.forEach((score: any) => {
    const subjectName = score.assessments?.class_subjects?.subjects?.name
    const assessmentType = score.assessments?.assessment_types?.name

    if (!subjectScores[subjectName]) {
      subjectScores[subjectName] = { ca1: 0, ca2: 0, exam: 0, total: 0, grade: "", remark: "" }
    }

    if (assessmentType === "CA Test 1") {
      subjectScores[subjectName].ca1 = score.score || 0
    } else if (assessmentType === "CA Test 2") {
      subjectScores[subjectName].ca2 = score.score || 0
    } else if (assessmentType === "Exam") {
      subjectScores[subjectName].exam = score.score || 0
    }

    subjectScores[subjectName].total =
      subjectScores[subjectName].ca1 + subjectScores[subjectName].ca2 + subjectScores[subjectName].exam
    subjectScores[subjectName].grade = score.grade || ""
    subjectScores[subjectName].remark = score.remarks || ""
  })

  const { data: school } = await supabase.from("school_settings").select("*").single()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Report Card</h1>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Printable Report Card */}
      <div className="bg-white text-black p-8 max-w-4xl mx-auto border shadow-lg print:shadow-none print:border-0">
        {/* School Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-bold uppercase">{school?.school_name || "Ammar Bin Yasir Institute"}</h1>
          <p className="text-sm mt-1">{school?.address}</p>
          <p className="text-sm">
            {school?.phone_primary} | {school?.email}
          </p>
          <h2 className="text-xl font-bold mt-4 uppercase">Student Report Card</h2>
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p>
              <span className="font-semibold">Student Name:</span> {student.first_name} {student.middle_name}{" "}
              {student.last_name}
            </p>
            <p>
              <span className="font-semibold">Student ID:</span> {student.student_id}
            </p>
            <p>
              <span className="font-semibold">Class:</span> {currentClass?.sections?.name} - {currentClass?.name}
            </p>
          </div>
          <div>
            <p>
              <span className="font-semibold">Session:</span> {session?.name}
            </p>
            <p>
              <span className="font-semibold">Term:</span> {term?.name}
            </p>
            <p>
              <span className="font-semibold">Position:</span> {result?.position || "N/A"}
            </p>
          </div>
        </div>

        {/* Scores Table */}
        <table className="w-full border-collapse border-2 border-black mb-6 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left">Subject</th>
              <th className="border border-black p-2 text-center">
                CA 1<br />
                (20)
              </th>
              <th className="border border-black p-2 text-center">
                CA 2<br />
                (20)
              </th>
              <th className="border border-black p-2 text-center">
                Exam
                <br />
                (60)
              </th>
              <th className="border border-black p-2 text-center">
                Total
                <br />
                (100)
              </th>
              <th className="border border-black p-2 text-center">Grade</th>
              <th className="border border-black p-2 text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(subjectScores).map(([subject, data]: [string, any]) => (
              <tr key={subject}>
                <td className="border border-black p-2 font-medium">{subject}</td>
                <td className="border border-black p-2 text-center">{data.ca1}</td>
                <td className="border border-black p-2 text-center">{data.ca2}</td>
                <td className="border border-black p-2 text-center">{data.exam}</td>
                <td className="border border-black p-2 text-center font-semibold">{data.total}</td>
                <td className="border border-black p-2 text-center font-semibold">{data.grade}</td>
                <td className="border border-black p-2">{data.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div className="border border-black p-3">
            <p className="font-semibold">Total Score:</p>
            <p className="text-2xl font-bold">{result?.total_score?.toFixed(1) || "0.0"}</p>
          </div>
          <div className="border border-black p-3">
            <p className="font-semibold">Average:</p>
            <p className="text-2xl font-bold">{result?.average_score?.toFixed(1) || "0.0"}%</p>
          </div>
          <div className="border border-black p-3">
            <p className="font-semibold">Position:</p>
            <p className="text-2xl font-bold">{result?.position || "N/A"}</p>
          </div>
        </div>

        {/* Teacher's Comment */}
        <div className="mb-6 text-sm">
          <p className="font-semibold mb-2">Class Teacher's Comment:</p>
          <div className="border border-black p-3 min-h-[60px]">{result?.teacher_remark || ""}</div>
        </div>

        {/* Principal's Comment */}
        <div className="mb-6 text-sm">
          <p className="font-semibold mb-2">Principal's Comment:</p>
          <div className="border border-black p-3 min-h-[60px]">{result?.principal_remark || ""}</div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-12 text-sm">
          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p className="font-semibold">Class Teacher</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p className="font-semibold">Principal</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p className="font-semibold">Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
