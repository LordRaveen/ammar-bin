import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ExternalLink,
  Loader2,
  Calendar,
  User,
  Globe,
  MapPin,
  HeartPulse,
  Users,
  Plus,
  Trash2,
  Pencil,
  GraduationCap,
  Receipt,
  Mail,
  Phone,
  Home,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { EnrollStudentModal } from "@/components/enroll-student-modal"
import { InvoiceDetailsDrawer } from "@/components/finance/invoice-details-drawer"
import { EditStudentModal } from "@/components/edit-student-modal"
import { RemoveGuardianDialog } from "@/components/remove-guardian-dialog"
import { SelectGuardianModal } from "@/components/select-guardian-modal"

interface StudentDetailsSheetProps {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: string
  sessions: any[]
  terms: any[]
  classes: any[]
  guardians?: any[]
}

export function StudentDetailsSheet({
  studentId,
  open,
  onOpenChange,
  userRole = "admin",
  sessions,
  terms,
  classes,
  guardians = [],
}: StudentDetailsSheetProps) {
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showLinkGuardianModal, setShowLinkGuardianModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [editStudent, setEditStudent] = useState<any | null>(null)

  // Guardian editing/removal
  const [editGuardianRelation, setEditGuardianRelation] = useState<any | null>(null)
  const [removeGuardianId, setRemoveGuardianId] = useState<string | null>(null)

  // Invoice detailed viewer
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleLinkGuardian = async (data: any) => {
    if (!studentId) return
    const supabase = createClient()
    const { error } = await supabase
      .from("student_guardians")
      .insert({
        student_id: studentId,
        guardian_id: data.guardianId,
        relationship: data.relationship || "Father",
        is_primary: !!data.isPrimary,
      })

    if (error) {
      console.error("Error linking guardian:", error)
      toast.error("Failed to link guardian")
    } else {
      toast.success("Guardian connected successfully")
      setRefreshTrigger((prev) => prev + 1)
      router.refresh()
    }
  }

  const handleUpdateGuardian = async (data: any) => {
    if (!data.relationId) return
    const supabase = createClient()
    const { error } = await supabase
      .from("student_guardians")
      .update({
        guardian_id: data.guardianId,
        relationship: data.relationship || "Father",
        is_primary: !!data.isPrimary,
      })
      .eq("id", data.relationId)

    if (error) {
      console.error("Error updating guardian relation:", error)
      toast.error("Failed to update guardian")
    } else {
      toast.success("Guardian updated successfully")
      setRefreshTrigger((prev) => prev + 1)
      router.refresh()
    }
  }

  useEffect(() => {
    async function fetchStudent() {
      if (!studentId) return
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
            guardian:guardians(id, first_name, last_name, email, phone, occupation)
          ),
          student_enrollments(
            id,
            enrollment_date,
            is_active,
            class:classes(id, name, section:sections(name)),
            session:sessions(id, name),
            term:terms(id, name)
          )
        `)
        .eq("id", studentId)
        .single()

      if (data) {
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

    if (open) {
      fetchStudent()
    }
  }, [studentId, open, refreshTrigger])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  const currentEnrollments = student?.student_enrollments?.filter((e: any) => e.is_active) || []
  const hasGuardian = student?.student_guardians && student.student_guardians.length > 0

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SheetTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Student Profile & Enrolments
                </SheetTitle>
              </div>
            </div>
          </SheetHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium">Loading student files...</p>
            </div>
          ) : student ? (
            <div className="px-6 pb-6 space-y-6">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                  <TabsTrigger value="profile" className="text-xs py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:shadow-sm">Profile Details</TabsTrigger>
                  <TabsTrigger value="financials" className="text-xs py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:shadow-sm">Invoices & Finance</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6 mt-0">
                  {/* Header Info */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-emerald-500/20 shadow-sm">
                      <AvatarFallback className="text-lg font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {getInitials(student.first_name, student.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-xl font-bold tracking-tight">
                          {student.first_name} {student.middle_name ? student.middle_name + " " : ""}{student.last_name}
                        </h2>
                        <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                          {student.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mb-2">{student.student_id}</p>
                      
                      {currentEnrollments.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-muted-foreground font-semibold">Active Classes:</span>
                          {currentEnrollments.map((ce: any, idx: number) => (
                            <Badge key={ce.id || `ce-${idx}`} variant="outline" className="text-[10px] h-5 py-0 font-normal bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              {ce.class?.name}
                              {ce.class?.section?.name && ` (${ce.class.section.name})`}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-red-500 dark:text-red-400 font-semibold italic flex items-center gap-1">
                          ⚠️ Not Enrolled in Current Term
                        </p>
                      )}
                    </div>
                    {(userRole === "admin" || userRole === "super_admin") && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={() => setEditStudent(student)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>

                  <Separator className="bg-zinc-100 dark:bg-zinc-900" />

                  {/* Personal Details */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                        <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Date of Birth</p>
                          <p className="text-xs font-medium">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                        <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Gender</p>
                          <p className="text-xs font-medium">{student.gender || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                        <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Nationality</p>
                          <p className="text-xs font-medium">{student.nationality || "Nigerian"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                        <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">State of Origin</p>
                          <p className="text-xs font-medium">{student.state_of_origin || "N/A"}</p>
                        </div>
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/60">
                        <Home className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Residential Address</p>
                          <p className="text-xs font-medium truncate">{student.address || "N/A"}</p>
                        </div>
                      </div>

                      {student.medical_info && (
                        <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg border border-red-100/50 dark:border-red-950/30 bg-red-50/10 dark:bg-red-950/10">
                          <HeartPulse className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-semibold">Medical Files</p>
                            <p className="text-xs font-medium text-red-700 dark:text-red-300 truncate">{student.medical_info}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-zinc-100 dark:bg-zinc-900" />

                  {/* Guardians Connection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Guardians Information
                      </h3>
                      {!hasGuardian && (userRole === "admin" || userRole === "super_admin") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] font-semibold border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 px-2"
                          onClick={() => setShowLinkGuardianModal(true)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Link Guardian
                        </Button>
                      )}
                    </div>

                    {student.student_guardians && student.student_guardians.length > 0 ? (
                      <div className="space-y-3">
                        {student.student_guardians.map((sg: any) => (
                          <div key={sg.guardian.id} className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-950/50 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase">
                                {sg.relationship?.[0] || "G"}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-bold truncate">
                                    {sg.guardian.first_name} {sg.guardian.last_name}
                                  </p>
                                  {sg.is_primary && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">{sg.relationship}</p>
                                
                                <div className="flex items-center gap-3 mt-2 flex-wrap text-muted-foreground">
                                  <span className="text-[10px] font-mono flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-emerald-600" />
                                    {sg.guardian.phone}
                                  </span>
                                  {sg.guardian.email && (
                                    <span className="text-[10px] font-mono flex items-center gap-1">
                                      <Mail className="h-3 w-3 text-emerald-600" />
                                      {sg.guardian.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {(userRole === "admin" || userRole === "super_admin") && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={() => setEditGuardianRelation(sg)}>
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setRemoveGuardianId(sg.id)}
                                  className="h-7 w-7 rounded-md hover:bg-red-500/10 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-6 bg-zinc-50/50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        No guardian connected. Connect a linked profile for parent access.
                      </div>
                    )}
                  </div>

                  <Separator className="bg-zinc-100 dark:bg-zinc-900" />

                  {/* Enrollment History */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Enrollment History
                      </h3>
                      {userRole !== "teacher" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] font-semibold border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 px-2"
                          onClick={() => setShowEnrollModal(true)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          New Enrollment
                        </Button>
                      )}
                    </div>

                    {student.student_enrollments && student.student_enrollments.length > 0 ? (
                      <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
                        <Table>
                          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                            <TableRow className="border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-bold uppercase tracking-wider">
                              <TableHead className="h-8">Session</TableHead>
                              <TableHead className="h-8">Term</TableHead>
                              <TableHead className="h-8">Class</TableHead>
                              <TableHead className="h-8">Shift</TableHead>
                              <TableHead className="h-8">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {student.student_enrollments.map((enrollment: any, idx: number) => (
                              <TableRow key={enrollment.id || `hist-${idx}`} className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20 text-xs">
                                <TableCell className="py-2 font-mono">{enrollment.session?.name}</TableCell>
                                <TableCell className="py-2 font-semibold">{enrollment.term?.name}</TableCell>
                                <TableCell className="py-2 font-bold">{enrollment.class?.name}</TableCell>
                                <TableCell className="py-2 font-semibold">
                                  <Badge variant="outline" className="text-[9px] py-0 h-4">
                                    {enrollment.class?.section?.name || "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge
                                    variant={enrollment.is_active ? "default" : "secondary"}
                                    className="text-[9px] py-0 h-4"
                                  >
                                    {enrollment.is_active ? "Active" : "Past"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-6 bg-zinc-50/50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl">
                        No enrollment records registered yet.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="financials" className="space-y-6 mt-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice History</h3>
                    <div className="text-[10px] font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
                      {invoices.length} invoices found
                    </div>
                  </div>

                  {invoices.length > 0 ? (
                    <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950 max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                          <TableRow className="border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-bold uppercase tracking-wider">
                            <TableHead className="h-8">Invoice #</TableHead>
                            <TableHead className="h-8">Date</TableHead>
                            <TableHead className="h-8 text-right">Amount</TableHead>
                            <TableHead className="h-8 text-right">Paid</TableHead>
                            <TableHead className="h-8 text-right">Balance</TableHead>
                            <TableHead className="h-8">Status</TableHead>
                            <TableHead className="h-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20 text-xs">
                              <TableCell className="font-mono text-[10px] text-muted-foreground py-2.5">{invoice.invoice_number}</TableCell>
                              <TableCell className="py-2.5">{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right font-mono text-[11px] py-2.5">₦{Number(invoice.total_amount).toLocaleString()}</TableCell>
                              <TableCell className="text-right font-mono text-[11px] text-green-600 py-2.5">₦{Number(invoice.amount_paid).toLocaleString()}</TableCell>
                              <TableCell className="text-right font-mono text-[11px] text-red-600 py-2.5">₦{Number(invoice.balance).toLocaleString()}</TableCell>
                              <TableCell className="py-2.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] py-0 h-4 ${invoice.status === 'Paid' ? 'border-green-200 text-green-700 bg-green-50/50 dark:bg-green-950/20' :
                                    invoice.status === 'Partial' ? 'border-blue-200 text-blue-700 bg-blue-50/50 dark:bg-blue-950/20' :
                                      'border-red-200 text-red-700 bg-red-50/50 dark:bg-red-950/20'
                                    }`}
                                >
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md"
                                  onClick={() => {
                                    setSelectedInvoiceId(invoice.id)
                                    setInvoiceDetailsOpen(true)
                                  }}
                                >
                                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-12 bg-zinc-50/50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl">
                      No invoices found for this student in the current session.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Edit Guardian Modal (using SelectGuardianModal in edit mode) */}
      {editGuardianRelation && (
        <SelectGuardianModal
          open={!!editGuardianRelation}
          onOpenChange={(open) => !open && setEditGuardianRelation(null)}
          mode="select_with_relationship"
          existingRelation={{
            id: editGuardianRelation.id,
            guardian_id: editGuardianRelation.guardian?.id,
            relationship: editGuardianRelation.relationship,
            is_primary: editGuardianRelation.is_primary,
          }}
          onSelect={handleUpdateGuardian}
        />
      )}

      {/* Select & Link Guardian Modal */}
      <SelectGuardianModal
        open={showLinkGuardianModal}
        onOpenChange={setShowLinkGuardianModal}
        mode="select_with_relationship"
        onSelect={handleLinkGuardian}
      />

      {/* Remove Guardian Dialog */}
      <RemoveGuardianDialog
        relationId={removeGuardianId || ""}
        open={!!removeGuardianId}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveGuardianId(null)
            setRefreshTrigger((prev) => prev + 1)
          }
        }}
      />

      {/* Enroll Modal */}
      {student && showEnrollModal && (
        <EnrollStudentModal
          student={student}
          sessions={sessions}
          terms={terms}
          classes={classes}
          open={showEnrollModal}
          onOpenChange={setShowEnrollModal}
        />
      )}

      {/* Invoice Details Drawer */}
      {selectedInvoiceId && (
        <InvoiceDetailsDrawer
          invoiceId={selectedInvoiceId}
          open={invoiceDetailsOpen}
          onOpenChange={setInvoiceDetailsOpen}
        />
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <EditStudentModal
          student={editStudent}
          open={!!editStudent}
          onOpenChange={(open) => !open && setEditStudent(null)}
          guardians={guardians}
        />
      )}
    </>
  )
}
