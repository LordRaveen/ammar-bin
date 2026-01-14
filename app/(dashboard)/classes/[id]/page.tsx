"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconUsers,
  IconBook,
  IconChartBar,
  IconPlus,
  IconTrash,
  IconEdit,
  IconUserPlus,
} from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/client"
import { AddStudentToClassModal } from "@/components/add-student-to-class-modal"
import { AddSubjectToClassModal } from "@/components/add-subject-to-class-modal"
import { AssignTeacherModal } from "@/components/assign-teacher-modal"
import { ReassignTeacherModal } from "@/components/reassign-teacher-modal"
import { removeStudentFromClass, removeSubjectFromClass } from "./actions"
import { ScoreEntryInterface } from "@/components/score-entry-interface"
import { MarkAttendanceInterface } from "@/components/mark-attendance-interface"
import { isAdmin } from "@/lib/auth/role-redirect"

export const dynamic = "force-dynamic"

interface ClassDetails {
  id: string
  name: string
  capacity: number
  section: {
    name: string
  }
  teacher?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    photo_url: string | null
  }
  student_count: number
  subject_count: number
  attendance_rate?: number
}

interface EnrolledStudent {
  id: string
  enrollment_id: string
  student_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  gender: string
  status: string
  photo_url: string | null
}

interface ClassSubject {
  id: string
  subject: {
    id: string
    name: string
    code: string
  }
  max_score: number
  pass_mark: number
  teacher?: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function ClassDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params?.id as string | undefined
  const supabase = createBrowserClient()

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([])
  const [unenrolledStudents, setUnenrolledStudents] = useState<any[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([])
  const [allTeachers, setAllTeachers] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [showAssignClassTeacherModal, setShowAssignClassTeacherModal] = useState(false)
  const [showAssignSubjectTeacherModal, setShowAssignSubjectTeacherModal] = useState(false)
  const [showReassignTeacherModal, setShowReassignTeacherModal] = useState(false)
  const [selectedSubjectForReassign, setSelectedSubjectForReassign] = useState<{
    id: string
    name: string
    teacher?: any
  } | null>(null)

  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined" && classId) {
      fetchSessionsAndTerms()
    }
  }, [classId])

  useEffect(() => {
    if (selectedSession && selectedTerm && classId) {
      fetchAllData()
    }
  }, [classId, selectedSession, selectedTerm])

  async function fetchSessionsAndTerms() {
    const { data: sessionsData } = await supabase.from("sessions").select("*").order("start_date", { ascending: false })

    if (sessionsData && sessionsData.length > 0) {
      setSessions(sessionsData)
      const activeSession = sessionsData.find((s) => s.is_active) || sessionsData[0]
      setSelectedSession(activeSession.id)

      const { data: termsData } = await supabase
        .from("terms")
        .select("*")
        .eq("session_id", activeSession.id)
        .order("term_number")

      if (termsData && termsData.length > 0) {
        setTerms(termsData)
        const activeTerm = termsData.find((t) => t.is_active) || termsData[0]
        setSelectedTerm(activeTerm.id)
      }
    }
  }

  async function fetchAllData() {
    try {
      setLoading(true)

      const { data: classData } = await supabase
        .from("classes")
        .select("*, section:sections(name)")
        .eq("id", classId)
        .single()

      if (classData) {
        let teacherData = null
        if (classData.class_teacher_id) {
          const { data: teacher } = await supabase
            .from("teachers")
            .select("id, first_name, last_name, email, phone, photo_url")
            .eq("id", classData.class_teacher_id)
            .single()

          teacherData = teacher
        }

        const { count: studentCount } = await supabase
          .from("student_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("class_id", classId)
          .eq("session_id", selectedSession)
          .eq("term_id", selectedTerm)
          .eq("is_active", true)

        const { count: subjectCount } = await supabase
          .from("class_subjects")
          .select("*", { count: "exact", head: true })
          .eq("class_id", classId)

        setClassDetails({
          ...classData,
          teacher: teacherData || undefined,
          student_count: studentCount || 0,
          subject_count: subjectCount || 0,
        })
      }

      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("id, students(*)")
        .eq("class_id", classId)
        .eq("session_id", selectedSession)
        .eq("term_id", selectedTerm)
        .eq("is_active", true)

      if (enrollments) {
        const students = enrollments.map((e) => ({
          enrollment_id: e.id,
          ...(e.students as any),
        }))
        setEnrolledStudents(students)
      }

      const { data: allStudents } = await supabase.from("students").select("*").eq("status", "Active")

      const enrolledIds = new Set(enrolledStudents.map((s) => s.id))
      const unenrolled = (allStudents || []).filter((s) => !enrolledIds.has(s.id))
      setUnenrolledStudents(unenrolled)

      const { data: subjects } = await supabase
        .from("class_subjects")
        .select("*, subject:subjects(*)")
        .eq("class_id", classId)

      if (subjects) {
        const subjectIds = subjects.map((s) => s.subject_id)
        const { data: assignments } = await supabase
          .from("teacher_subject_assignments")
          .select("subject_id, teacher:teachers(first_name, last_name, email)")
          .eq("class_id", classId)
          .eq("session_id", selectedSession)
          .in("subject_id", subjectIds)

        const teacherMap = new Map((assignments || []).map((a) => [a.subject_id, a.teacher]))

        const enrichedSubjects = subjects.map((s) => ({
          ...s,
          teacher: teacherMap.get(s.subject_id),
        }))

        setClassSubjects(enrichedSubjects)
      }

      const { data: allSubjects } = await supabase.from("subjects").select("*").eq("is_active", true)

      const assignedSubjectIds = new Set((subjects || []).map((s) => s.subject_id))
      const available = (allSubjects || []).filter((s) => !assignedSubjectIds.has(s.id))
      setAvailableSubjects(available)

      const { data: teachers } = await supabase.from("teachers").select("*").eq("status", "Active")

      setAllTeachers(teachers || [])
    } catch (error) {
      console.error("[v0] Error fetching class data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedSession) {
      supabase
        .from("terms")
        .select("*")
        .eq("session_id", selectedSession)
        .order("term_number")
        .then(({ data }) => {
          if (data) {
            setTerms(data)
            setSelectedTerm(data[0]?.id || "")
          }
        })
    }
  }, [selectedSession])

  useEffect(() => {
    if (!classId || !selectedSession || !selectedTerm) return

    // Subscribe to student enrollments changes
    const enrollmentsChannel = supabase
      .channel(`enrollments-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_enrollments",
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          fetchAllData()
        },
      )
      .subscribe()

    // Subscribe to class subjects changes
    const subjectsChannel = supabase
      .channel(`subjects-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "class_subjects",
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          fetchAllData()
        },
      )
      .subscribe()

    // Subscribe to teacher assignments changes
    const teachersChannel = supabase
      .channel(`teachers-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teacher_subject_assignments",
          filter: `class_id=eq.${classId}`,
        },
        (payload) => {
          fetchAllData()
        },
      )
      .subscribe()

    // Subscribe to classes table for teacher updates
    const classChannel = supabase
      .channel(`class-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "classes",
          filter: `id=eq.${classId}`,
        },
        (payload) => {
          fetchAllData()
        },
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(enrollmentsChannel)
      supabase.removeChannel(subjectsChannel)
      supabase.removeChannel(teachersChannel)
      supabase.removeChannel(classChannel)
    }
  }, [classId, selectedSession, selectedTerm])

  async function handleRemoveStudent(enrollmentId: string) {
    if (confirm("Are you sure you want to remove this student from the class?")) {
      try {
        await removeStudentFromClass(enrollmentId, classId)
      } catch (error) {
        alert("Failed to remove student")
      }
    }
  }

  async function handleRemoveSubject(classSubjectId: string) {
    if (confirm("Are you sure you want to remove this subject from the class?")) {
      try {
        await removeSubjectFromClass(classSubjectId, classId)
      } catch (error) {
        alert("Failed to remove subject")
      }
    }
  }

  function handleReassignTeacher(subject: any) {
    setSelectedSubjectForReassign({
      id: subject.subject.id,
      name: subject.subject.name,
      teacher: subject.teacher,
    })
    setShowReassignTeacherModal(true)
  }

  useEffect(() => {
    async function fetchUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()

        if (data) {
          setUserRole(data.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  const hasAdminAccess = isAdmin(userRole)

  if (!classId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invalid class ID</p>
        <Button onClick={() => router.push("/classes")} className="mt-4">
          Back to Classes
        </Button>
      </div>
    )
  }

  if (loading || !classDetails) {
    return <div className="text-muted-foreground text-center py-12">Loading class details...</div>
  }

  const teacherInitials = classDetails.teacher
    ? `${classDetails.teacher.first_name[0]}${classDetails.teacher.last_name[0]}`
    : "??"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/classes")}>
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <IconBook className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold">{classDetails.name}</h1>
              <p className="text-muted-foreground">{classDetails.section.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <IconUsers className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classDetails.student_count}</div>
                <p className="text-muted-foreground text-xs">Capacity: {classDetails.capacity}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                <IconBook className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classDetails.subject_count}</div>
                <p className="text-muted-foreground text-xs">Active subjects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Attendance Rate</CardTitle>
                <IconChartBar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classDetails.attendance_rate || 95}%</div>
                <p className="text-muted-foreground text-xs">This term</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Class Teacher</CardTitle>
              {!classDetails.teacher && hasAdminAccess && (
                <Button onClick={() => setShowAssignClassTeacherModal(true)}>
                  <IconUserPlus className="mr-2 h-4 w-4" />
                  Assign Teacher
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {classDetails.teacher ? (
                <div className="space-y-3">
                  <div className="bg-primary/10 hover:bg-primary/20 flex items-center gap-4 rounded-lg p-4 transition-colors">
                    <Avatar className="h-12 w-12">
                      {classDetails.teacher.photo_url && (
                        <AvatarImage src={classDetails.teacher.photo_url || "/placeholder.svg"} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground">{teacherInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {classDetails.teacher.first_name} {classDetails.teacher.last_name}
                      </p>
                      <p className="text-muted-foreground text-sm">{classDetails.teacher.email}</p>
                      <p className="text-muted-foreground text-sm">{classDetails.teacher.phone}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm italic">
                    Teaches all subjects except those with assigned subject teachers
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No class teacher assigned yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Special Subject Teachers</CardTitle>
              {hasAdminAccess && (
                <Button onClick={() => setShowAssignSubjectTeacherModal(true)}>
                  <IconUserPlus className="mr-2 h-4 w-4" />
                  Assign Subject Teacher
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Assign special teachers for subjects like ICT, Art, Music, etc. Other subjects are taught by the class
                teacher.
              </p>
              {classSubjects.length > 0 ? (
                <div className="space-y-2">
                  {classSubjects
                    .filter((cs) => cs.teacher) // Only show subjects with special teachers
                    .map((cs) => (
                      <div key={cs.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{cs.subject.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {cs.teacher.first_name} {cs.teacher.last_name}
                          </p>
                        </div>
                        {hasAdminAccess && (
                          <Button size="sm" variant="outline" onClick={() => handleReassignTeacher(cs)}>
                            <IconEdit className="mr-1 h-3 w-3" />
                            Reassign
                          </Button>
                        )}
                      </div>
                    ))}
                  {classSubjects.filter((cs) => cs.teacher).length === 0 && (
                    <p className="text-muted-foreground text-center py-4 text-sm">
                      No special subject teachers assigned. All subjects are taught by the class teacher.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm">No subjects added to this class yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>{enrolledStudents.length} student(s) enrolled</CardDescription>
              </div>
              {hasAdminAccess && (
                <Button onClick={() => setShowAddStudentModal(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Status</TableHead>
                    {hasAdminAccess && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.length > 0 ? (
                    enrolledStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Avatar>
                            {student.photo_url && <AvatarImage src={student.photo_url || "/placeholder.svg"} />}
                            <AvatarFallback>
                              {student.first_name[0]}
                              {student.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>
                          {student.first_name} {student.middle_name} {student.last_name}
                        </TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        {hasAdminAccess && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveStudent(student.enrollment_id)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={hasAdminAccess ? 6 : 5} className="text-center text-muted-foreground py-8">
                        No students enrolled in this class yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Class Subjects</CardTitle>
                <CardDescription>{classSubjects.length} subject(s) configured</CardDescription>
              </div>
              {hasAdminAccess && (
                <Button onClick={() => setShowAddSubjectModal(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Max Score</TableHead>
                    <TableHead>Pass Mark</TableHead>
                    <TableHead>Teacher</TableHead>
                    {hasAdminAccess && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSubjects.length > 0 ? (
                    classSubjects.map((cs) => (
                      <TableRow key={cs.id}>
                        <TableCell className="font-medium">{cs.subject.name}</TableCell>
                        <TableCell>{cs.subject.code}</TableCell>
                        <TableCell>{cs.max_score}</TableCell>
                        <TableCell>{cs.pass_mark}</TableCell>
                        <TableCell>
                          {cs.teacher ? (
                            <span>
                              {cs.teacher.first_name} {cs.teacher.last_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Class teacher</span>
                          )}
                        </TableCell>
                        {hasAdminAccess && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReassignTeacher(cs)}
                                title="Reassign teacher"
                              >
                                <IconUserPlus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <IconEdit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(cs.id)}>
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={hasAdminAccess ? 6 : 5} className="text-center text-muted-foreground py-8">
                        No subjects added to this class yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores">
          <ScoreEntryInterface
            classId={classId}
            sessionId={selectedSession}
            termId={selectedTerm}
            students={enrolledStudents}
            subjects={classSubjects.map((cs) => ({
              id: cs.subject.id,
              name: cs.subject.name,
              code: cs.subject.code,
              max_score: cs.max_score,
              pass_mark: cs.pass_mark,
            }))}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <MarkAttendanceInterface
            classId={classId}
            sessionId={selectedSession}
            termId={selectedTerm}
            students={enrolledStudents}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Class Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Class configuration will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasAdminAccess && (
        <>
          <AddStudentToClassModal
            open={showAddStudentModal}
            onOpenChange={setShowAddStudentModal}
            classId={classId}
            sessionId={selectedSession}
            termId={selectedTerm}
            unenrolledStudents={unenrolledStudents}
          />

          <AddSubjectToClassModal
            open={showAddSubjectModal}
            onOpenChange={setShowAddSubjectModal}
            classId={classId}
            availableSubjects={availableSubjects}
          />

          <AssignTeacherModal
            open={showAssignClassTeacherModal}
            onOpenChange={setShowAssignClassTeacherModal}
            classId={classId}
            sessionId={selectedSession}
            teachers={allTeachers}
            type="class"
          />

          <AssignTeacherModal
            open={showAssignSubjectTeacherModal}
            onOpenChange={setShowAssignSubjectTeacherModal}
            classId={classId}
            sessionId={selectedSession}
            teachers={allTeachers}
            type="subject"
            subjects={classSubjects.map((cs) => ({ id: cs.subject.id, name: cs.subject.name }))}
          />

          {selectedSubjectForReassign && (
            <ReassignTeacherModal
              open={showReassignTeacherModal}
              onOpenChange={setShowReassignTeacherModal}
              classId={classId!}
              sessionId={selectedSession}
              subjectId={selectedSubjectForReassign.id}
              subjectName={selectedSubjectForReassign.name}
              currentTeacher={selectedSubjectForReassign.teacher}
              teachers={allTeachers}
            />
          )}
        </>
      )}
    </div>
  )
}
