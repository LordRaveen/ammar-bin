"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink, Plus, Pencil, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface StudentDetailsSheetProps {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  sessions: any[]
  terms: any[]
  classes: any[]
  userRole?: string
  guardians?: any[] // Add guardians prop for EditStudentModal
}

export function StudentDetailsSheet({
  studentId,
  open,
  onOpenChange,
  sessions,
  terms,
  classes,
  userRole,
  guardians = [], // Add guardians prop with default
}: StudentDetailsSheetProps) {
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [editGuardianRelation, setEditGuardianRelation] = useState<any | null>(null)
  const [removeGuardianId, setRemoveGuardianId] = useState<string | null>(null)
  const [editStudent, setEditStudent] = useState<any | null>(null) // Add state for edit modal

  useEffect(() => {
    async function fetchStudent() {
      if (!studentId || !open) {
        setStudent(null)
        return
      }

      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          student_guardians(
            id,
            relationship,
            is_primary,
            guardian:guardians(*)
          ),
          student_enrollments(
            enrollment_date,
            is_active,
            session:sessions(name),
            term:terms(name),
            class:classes(
              name,
              section:sections(name)
            )
          )
        `)
        .eq("id", studentId)
        .single()

      if (!error && data) {
        setStudent(data)
      }
      setLoading(false)
    }

    fetchStudent()
  }, [studentId, open])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const currentEnrollment = student?.student_enrollments?.find((e: any) => e.is_active)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle>Student Details</SheetTitle>
              <SheetDescription>View student information and enrollment history</SheetDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/students/${studentId}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Expand
              </Link>
            </Button>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : student ? (
          <div className="px-6 pb-6 space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(student.first_name, student.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold">
                    {student.first_name} {student.middle_name} {student.last_name}
                  </h2>
                  <Badge variant={student.status === "Active" ? "default" : "secondary"}>{student.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{student.student_id}</p>
                {currentEnrollment ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Current Class:</span>
                    <Badge variant="outline" className="font-medium">
                      {currentEnrollment.class.name}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not enrolled in any class</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditStudent(student)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <p className="font-medium">{new Date(student.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender:</span>
                  <p className="font-medium">{student.gender}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nationality:</span>
                  <p className="font-medium">{student.nationality}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">State of Origin:</span>
                  <p className="font-medium">{student.state_of_origin || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium">{student.address}</p>
                </div>
                {student.medical_info && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Medical Information:</span>
                    <p className="font-medium">{student.medical_info}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Guardians</h3>
              {student.student_guardians && student.student_guardians.length > 0 ? (
                <div className="space-y-3">
                  {student.student_guardians.map((sg: any) => (
                    <div key={sg.guardian.id} className="p-3 rounded-lg border bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {sg.guardian.first_name} {sg.guardian.last_name}
                            {sg.is_primary && (
                              <Badge variant="outline" className="ml-2">
                                Primary
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{sg.relationship}</p>
                          <p className="text-sm text-muted-foreground">{sg.guardian.phone}</p>
                          {sg.guardian.email && <p className="text-sm text-muted-foreground">{sg.guardian.email}</p>}
                        </div>
                        {userRole === "admin" && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditGuardianRelation(sg)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveGuardianId(sg.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No guardians linked</p>
              )}
              {userRole === "admin" && (
                <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent" onClick={() => {}}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add/Change Guardian
                </Button>
              )}
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Enrollment History</h3>
                {userRole !== "teacher" && (
                  <Button variant="outline" size="sm" onClick={() => setShowEnrollModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll
                  </Button>
                )}
              </div>
              {student.student_enrollments && student.student_enrollments.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.student_enrollments.map((enrollment: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-sm">{enrollment.session?.name}</TableCell>
                          <TableCell className="text-sm">{enrollment.term?.name}</TableCell>
                          <TableCell className="text-sm font-medium">{enrollment.class?.name}</TableCell>
                          <TableCell>
                            <Badge variant={enrollment.is_active ? "default" : "secondary"}>
                              {enrollment.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not enrolled in any class yet</p>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
