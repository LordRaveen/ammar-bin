import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { ParentResultsClient } from "@/components/parent-results-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ParentResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; session?: string; term?: string }>
}) {
  const user = await requireAuth()

  if (user.role !== "parent") {
    return <div>Access Denied</div>
  }

  const params = await searchParams
  const supabase = await createServerClient()

  // Get guardian record
  const { data: guardian } = await supabase.from("guardians").select("*").eq("user_id", user.id).single()

  if (!guardian) {
    return <div>Guardian record not found</div>
  }

  // Get all children
  const { data: studentGuardians } = await supabase
    .from("student_guardians")
    .select(`
      *,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name,
        photo_url
      )
    `)
    .eq("guardian_id", guardian.id)

  const children = studentGuardians?.map((sg: any) => sg.students) || []

  // Get sessions and terms
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, name, is_active")
    .order("start_date", { ascending: false })

  const { data: terms } = await supabase
    .from("terms")
    .select("id, name, session_id, is_active")
    .order("start_date", { ascending: false })

  // Auto-select first child if not specified
  let selectedStudentId = params.student
  if (!selectedStudentId && children.length > 0) {
    selectedStudentId = children[0].id
  }

  // Auto-select active session if not specified
  let selectedSessionId = params.session
  if (!selectedSessionId) {
    const activeSession = sessions?.find((s) => s.is_active)
    selectedSessionId = activeSession?.id
  }

  // Auto-select active term for the session if not specified
  let selectedTermId = params.term
  if (!selectedTermId && selectedSessionId) {
    const activeTerm = terms?.find((t) => t.session_id === selectedSessionId && t.is_active)
    selectedTermId = activeTerm?.id
  }

  // Fetch results if all parameters are present
  let resultData = null
  let scores = null
  let grading = null

  if (selectedStudentId && selectedSessionId && selectedTermId) {
    // Get overall result
    const { data: result } = await supabase
      .from("student_results")
      .select(`
        *,
        students (
          id,
          student_id,
          first_name,
          middle_name,
          last_name,
          photo_url
        ),
        classes (
          name,
          sections (name)
        )
      `)
      .eq("student_id", selectedStudentId)
      .eq("session_id", selectedSessionId)
      .eq("term_id", selectedTermId)
      .maybeSingle()

    resultData = result

    // Get subject scores if result exists
    if (result) {
      const { data: subjectScores } = await supabase
        .from("student_scores")
        .select(`
          *,
          assessments (
            *,
            subjects (
              id,
              name,
              code
            ),
            assessment_types (
              name
            )
          )
        `)
        .eq("student_id", selectedStudentId)

      // Group scores by subject
      const scoresBySubject: any = {}

      subjectScores?.forEach((score: any) => {
        const subjectId = score.assessments?.subjects?.id
        const subjectName = score.assessments?.subjects?.name
        const assessmentType = score.assessments?.assessment_types?.name

        if (!scoresBySubject[subjectId]) {
          scoresBySubject[subjectId] = {
            id: subjectId,
            name: subjectName,
            code: score.assessments?.subjects?.code,
            ca: 0,
            exam: 0,
            total: 0,
            grade: "",
          }
        }

        if (assessmentType?.toLowerCase().includes("ca") || assessmentType?.toLowerCase().includes("continuous")) {
          scoresBySubject[subjectId].ca += Number.parseFloat(score.score || "0")
        } else if (assessmentType?.toLowerCase().includes("exam")) {
          scoresBySubject[subjectId].exam = Number.parseFloat(score.score || "0")
        }
      })

      // Calculate totals and grades
      Object.values(scoresBySubject).forEach((subject: any) => {
        subject.total = subject.ca + subject.exam
      })

      scores = Object.values(scoresBySubject)
    }

    // Get grading scheme
    const { data: gradingScheme } = await supabase
      .from("grading_schemes")
      .select("*")
      .order("min_score", { ascending: false })

    grading = gradingScheme
  }

  // Calculate grades for each subject
  if (scores && grading) {
    scores = scores.map((subject: any) => {
      const grade = grading.find((g: any) => subject.total >= g.min_score && subject.total <= g.max_score)
      return {
        ...subject,
        grade: grade?.grade || "N/A",
        remark: grade?.remark || "",
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
        <p className="text-muted-foreground">View your child's academic performance and report cards</p>
      </div>

      {children.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>No children linked to your account</AlertDescription>
        </Alert>
      ) : (
        <ParentResultsClient
          children={children}
          sessions={sessions || []}
          terms={terms || []}
          selectedStudentId={selectedStudentId}
          selectedSessionId={selectedSessionId}
          selectedTermId={selectedTermId}
          resultData={resultData}
          scores={scores}
          grading={grading}
        />
      )}
    </div>
  )
}
