"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink, Plus, Pencil, Loader2, Trash2, Receipt } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { LinkGuardianModal } from "./link-guardian-modal"
import { RemoveGuardianDialog } from "./remove-guardian-dialog"
import { InvoiceDetailsDrawer } from "@/components/finance/invoice-details-drawer"
import { AddGuardianFromStudentModal } from "./add-guardian-from-student-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StudentDetailsSheetProps {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  sessions: any[]
  terms: any[]
  classes: any[]
  userRole?: string
  guardians?: any[]
  onCollectPayment?: (studentId: string, invoiceId?: string) => void
}

export function StudentDetailsSheet({
  studentId,
  open,
  onOpenChange,
  sessions,
  terms,
  classes,
  userRole,
  guardians = [],
  onCollectPayment,
}: StudentDetailsSheetProps) {
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [editGuardianRelation, setEditGuardianRelation] = useState<any | null>(null)
  const [removeGuardianId, setRemoveGuardianId] = useState<string | null>(null)
  const [editStudent, setEditStudent] = useState<any | null>(null)
  const [showLinkGuardianModal, setShowLinkGuardianModal] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false)
  const [showAddGuardianModal, setShowAddGuardianModal] = useState(false) // Declare the variable

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
            session:sessions(name, id),
            term:terms(name, id),
            class:classes(
              name,
              section:section_id(name)
            )
          )
        `)
        .eq("id", studentId)
        .single()

      if (!error && data) {
        setStudent(data)

        // Fetch invoices for current session/term
        const currentEnrollment = data.student_enrollments?.find((e: any) => e.is_active)
        if (currentEnrollment) {
          const { data: invoiceData } = await supabase
            .from("invoices")
            .select("*")
            .eq("student_id", studentId)
            .eq("session_id", currentEnrollment.session.id)
            .eq("term_id", currentEnrollment.term.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })

          setInvoices(invoiceData || [])
        }
      }
      setLoading(false)
    }

    fetchStudent()
  }, [studentId, open])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const currentEnrollment = student?.student_enrollments?.find((e: any) => e.is_active)
  const hasGuardian = student?.student_guardians && student.student_guardians.length > 0

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
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6 mt-0">
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
                          {currentEnrollment.class.section?.name && ` - ${currentEnrollment.class.section.name}`}
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
                            {(userRole === "admin" || userRole === "super_admin") && (
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
                  {!hasGuardian && (userRole === "admin" || userRole === "super_admin") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full bg-transparent"
                      onClick={() => setShowLinkGuardianModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Link Guardian
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
                            <TableHead>Section</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {student.student_enrollments.map((enrollment: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="text-sm">{enrollment.session?.name}</TableCell>
                              <TableCell className="text-sm">{enrollment.term?.name}</TableCell>
                              <TableCell className="text-sm font-medium">{enrollment.class?.name}</TableCell>
                              <TableCell className="text-sm">{enrollment.class?.section?.name || "—"}</TableCell>
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
              </TabsContent>

              <TabsContent value="financials" className="space-y-6 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Invoice History</h3>
                  <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                    {invoices.length} invoices found
                  </div>
                </div>

                {invoices.length > 0 ? (
                  <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs">{invoice.invoice_number}</TableCell>
                            <TableCell className="text-xs">{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm">₦{Number(invoice.total_amount).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-green-600">₦{Number(invoice.amount_paid).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-red-600">₦{Number(invoice.balance).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs ${invoice.status === 'Paid' ? 'border-green-200 text-green-700 bg-green-50' :
                                  invoice.status === 'Partial' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                    'border-red-200 text-red-700 bg-red-50'
                                  }`}
                              >
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedInvoiceId(invoice.id)
                                  setInvoiceDetailsOpen(true)
                                }}
                              >
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground">
                    No invoices found for this student in the current session.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}

        {/* Edit Guardian Modal (using LinkGuardianModal in edit mode) */}
        {editGuardianRelation && (
          <LinkGuardianModal
            open={!!editGuardianRelation}
            onOpenChange={(open) => !open && setEditGuardianRelation(null)}
            studentId={studentId || ""}
            existingRelation={{
              id: editGuardianRelation.id,
              guardian_id: editGuardianRelation.guardian?.id,
              relationship: editGuardianRelation.relationship,
              is_primary: editGuardianRelation.is_primary,
            }}
            onGuardianLinked={() => {
              setEditGuardianRelation(null)
              // Refresh student data
              if (studentId) {
                const supabase = createClient()
                supabase
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
                      session:sessions(name, id),
                      term:terms(name, id),
                      class:classes(
                        name,
                        section:section_id(name)
                      )
                    )
                  `)
                  .eq("id", studentId)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      setStudent(data)
                    }
                  })
              }
            }}
          />
        )}

        {/* Link Guardian Modal (for adding new guardian) */}
        {showLinkGuardianModal && (
          <LinkGuardianModal
            open={showLinkGuardianModal}
            onOpenChange={setShowLinkGuardianModal}
            studentId={studentId || ""}
            onGuardianLinked={() => {
              setShowLinkGuardianModal(false)
              // Refresh student data
              if (studentId) {
                const supabase = createClient()
                supabase
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
                      session:sessions(name, id),
                      term:terms(name, id),
                      class:classes(
                        name,
                        section:section_id(name)
                      )
                    )
                  `)
                  .eq("id", studentId)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      setStudent(data)
                    }
                  })
              }
            }}
          />
        )}

        {selectedInvoiceId && (
          <InvoiceDetailsDrawer
            invoiceId={selectedInvoiceId}
            open={invoiceDetailsOpen}
            onOpenChange={setInvoiceDetailsOpen}
            userRole={userRole as any}
            onCollectPayment={onCollectPayment}
          />
        )}

        {showAddGuardianModal && (
          <AddGuardianFromStudentModal
            open={showAddGuardianModal}
            onOpenChange={setShowAddGuardianModal}
            onGuardianCreated={() => {
              setShowAddGuardianModal(false)
              // Refresh student data
              if (studentId) {
                const supabase = createClient()
                supabase
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
                      session:sessions(name, id),
                      term:terms(name, id),
                      class:classes(
                        name,
                        section:section_id(name)
                      )
                    )
                  `)
                  .eq("id", studentId)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      setStudent(data)
                    }
                  })
              }
            }}
          />
        )}

        {removeGuardianId && (
          <RemoveGuardianDialog
            relationId={removeGuardianId}
            open={!!removeGuardianId}
            onOpenChange={(open) => !open && setRemoveGuardianId(null)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
