'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InboxIcon, MoreVertical, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StudentInvoiceCard } from "./student-invoice-card"
import { createBrowserClient } from "@/lib/supabase/client"

interface StudentInvoiceItem {
  id: string
  description: string
  dueDate: string
  balance: number
  status: "Pending" | "Paid" | "Partial" | "Unpaid"
}

interface StudentData {
  id: string
  name: string
  class: string
  invoiceNumber: string
  invoices: StudentInvoiceItem[]
}

interface FamilyCardProps {
  selectedFamily: any
  onSelectFamily: (family: any) => void
  onItemsSelected?: (items: any[]) => void
  userRole?: "admin" | "parent" | "accountant"
  parentId?: string
  refreshTrigger?: number
}

export function FamilyCard({
  selectedFamily,
  onSelectFamily,
  onItemsSelected,
  userRole = "admin",
  parentId,
  refreshTrigger,
}: FamilyCardProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [studentsData, setStudentsData] = useState<StudentData[]>([])
  const [guardianInfo, setGuardianInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!selectedFamily) {
      setStudentsData([])
      setGuardianInfo(null)
      return
    }

    fetchFamilyData()
  }, [selectedFamily, refreshTrigger])

  const fetchFamilyData = async () => {
    setLoading(true)
    try {
      if (selectedFamily.type === "parent") {
        // Parent selected - fetch all their children and invoices
        await fetchParentData()
      } else if (selectedFamily.type === "student") {
        // Direct student selection - fetch that student's invoices
        await fetchStudentData(selectedFamily.id)
      }
    } catch (error) {
      console.error("[v0] Error fetching family data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchParentData = async () => {
    // Get parent/guardian info
    const { data: guardianData } = await supabase
      .from("guardians")
      .select("*")
      .eq("id", selectedFamily.id)
      .single()

    if (guardianData) {
      setGuardianInfo({
        name: `${guardianData.first_name} ${guardianData.last_name}`,
        relationship: guardianData.relationship_type || "Guardian",
        phone: guardianData.phone || guardianData.whatsapp_number || "N/A",
        type: "parent",
      })
    }

    // Get all students linked to this parent
    const { data: studentGuardianData } = await supabase
      .from("student_guardians")
      .select("student_id")
      .eq("guardian_id", selectedFamily.id)

    if (studentGuardianData && studentGuardianData.length > 0) {
      const studentIds = studentGuardianData.map((sg) => sg.student_id)

      // Fetch students with their current enrollment and invoices
      const { data: studentsWithInvoices, error: invoiceError } = await supabase
        .from("students")
        .select(
          `
          id,
          first_name,
          last_name,
          student_enrollments(
            class_id,
            session_id,
            term_id,
            classes(name, section:section_id(name))
          ),
          invoices(
            id,
            invoice_number,
            session_id,
            term_id,
            due_date,
            balance,
            status,
            invoice_items(
              id,
              description,
              amount,
              status,
              fee_categories(name)
            )
          )
        `
        )
        .in("id", studentIds)
        .is("invoices.deleted_at", null)

      if (invoiceError) {
        console.error("[v0] Invoice query error:", invoiceError)
        return
      }

      // Transform data to StudentData format
      const transformed = studentsWithInvoices
        ?.map((student: any) => {
          const activeEnrollment = student.student_enrollments?.find(
            (e: any) => e.session_id && e.term_id
          )
          const className = activeEnrollment?.classes?.name || "N/A"
          const sectionName = activeEnrollment?.classes?.section?.name
          const classWithSection = sectionName ? `${className} - ${sectionName}` : className

          // Get all invoices for this student (including paid ones)
          const invoices = student.invoices?.map((invoice: any) => ({
            studentId: student.id,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            dueDate: calculateDueDate(invoice.due_date),
            items: invoice.invoice_items?.map((item: any) => ({
              id: item.id,
              description: item.fee_categories?.name || item.description,
              dueDate: calculateDueDate(invoice.due_date),
              balance: Number(item.amount),
              status: item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : (invoice.status === "Paid" ? "Paid" : "Unpaid"),
            })),
          }))

          // Flatten invoice items to create list of all items
          const allInvoiceItems: StudentInvoiceItem[] = invoices
            ?.flatMap((inv: any) => inv.items)
            .map((item: any) => item) || []

          return {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            class: classWithSection,
            invoiceNumber: invoices?.[0]?.invoiceNumber || "N/A",
            invoices: allInvoiceItems,
            isPaid: allInvoiceItems.every((item: any) => item.status === "Paid"),
          }
        })
        .filter((s: StudentData) => s.invoices && s.invoices.length > 0)
        .sort((a: any, b: any) => {
          // Unpaid students first, paid students at the bottom
          if (a.isPaid === b.isPaid) return 0
          return a.isPaid ? 1 : -1
        }) || []
      await fetchStudentsByIds(studentIds)
    } else {
      setStudentsData([]) // No students found for this guardian
    }
  }

  const fetchStudentData = async (studentId: string) => {
    // Try to find the primary guardian for this student first to show the whole family
    const { data: guardianData } = await supabase
      .from("student_guardians")
      .select("guardian_id")
      .eq("student_id", studentId)
      .eq("is_primary", true)
      .single()

    if (guardianData?.guardian_id) {
      // Found a guardian! Switch context to this parent to show all siblings
      // We need to update the selectedFamily state in the parent component via callback normally,
      // but since we are inside the component, we can just call fetchParentData but we need to trick it 
      // by setting the state temporarily or just calling the logic.

      // Better approach: We'll manually call the guardian info fetch and student fetch logic here
      // treating the guardian_id as the selected family ID.

      // Validated: Reuse the same logic as fetchParentData but with the found guardian ID

      // 1. Get guardian info
      const { data: gInfo } = await supabase
        .from("guardians")
        .select("*")
        .eq("id", guardianData.guardian_id)
        .single()

      if (gInfo) {
        setGuardianInfo({
          name: `${gInfo.first_name} ${gInfo.last_name}`,
          relationship: gInfo.relationship_type || "Guardian",
          phone: gInfo.phone || gInfo.whatsapp_number || "N/A",
          type: "parent",
        })
      }

      // 2. Get all students (siblings) linked to this guardian
      const { data: studentGuardianData } = await supabase
        .from("student_guardians")
        .select("student_id")
        .eq("guardian_id", guardianData.guardian_id)

      if (studentGuardianData && studentGuardianData.length > 0) {
        const studentIds = studentGuardianData.map((sg) => sg.student_id)
        // Reuse the same fetch logic for multiple students
        await fetchStudentsByIds(studentIds)
      }
      return
    }

    // Fallback: No guardian found, just fetch this single student
    setGuardianInfo(null)
    await fetchStudentsByIds([studentId])
  }

  // Refactored helper to fetch invoices for a list of student IDs
  const fetchStudentsByIds = async (studentIds: string[]) => {
    const { data: studentsWithInvoices, error: invoiceError } = await supabase
      .from("students")
      .select(
        `
        id,
        first_name,
        last_name,
        student_enrollments(
          class_id,
          session_id,
          term_id,
          classes(name, section:section_id(name))
        ),
        invoices(
          id,
          invoice_number,
          session_id,
          term_id,
          due_date,
          balance,
          status,
          invoice_items(
            id,
            description,
            amount,
            status,
            fee_categories(name)
          )
        )
      `
      )
      .in("id", studentIds)
      .is("invoices.deleted_at", null)

    if (invoiceError) {
      console.error("[v0] Invoice query error:", invoiceError)
      return
    }

    // Transform and process data (same as before)
    // We need to fetch allocations for calculations too
    // This part is getting complex to duplicate, so let's refactor the standard fetching logic

    // Let's implement robust fetching for the list

    const students = studentsWithInvoices || []
    const allInvoiceItems = students.flatMap((s: any) => s.invoices || []).flatMap((i: any) => i.invoice_items || [])
    const itemIds = allInvoiceItems.map((i: any) => i.id)

    // Fetch allocations for ALL items
    let paidMap: Record<string, number> = {}
    if (itemIds.length > 0) {
      const { data: allocations } = await supabase
        .from("payment_allocations")
        .select("invoice_item_id, amount")
        .in("invoice_item_id", itemIds)

      allocations?.forEach((alloc: any) => {
        paidMap[alloc.invoice_item_id] = (paidMap[alloc.invoice_item_id] || 0) + Number(alloc.amount)
      })
    }

    const transformed = students.map((student: any) => {
      const activeEnrollment = student.student_enrollments?.find(
        (e: any) => e.session_id && e.term_id
      )
      const className = activeEnrollment?.classes?.name || "N/A"
      const sectionName = activeEnrollment?.classes?.section?.name
      const classWithSection = sectionName ? `${className} - ${sectionName}` : className

      const invoices = student.invoices?.map((invoice: any) => {
        const items = invoice.invoice_items?.map((item: any) => {
          const paidAmount = paidMap[item.id] || 0
          const balance = Math.max(0, Number(item.amount) - paidAmount)
          // If invoice is marked Paid, force item status to Paid, else check specific logic
          const dbStatus = item.status
          const capitalizedStatus = dbStatus ? (dbStatus.charAt(0).toUpperCase() + dbStatus.slice(1)) : null
          const status = capitalizedStatus || (balance <= 0 ? "Paid" : "Unpaid")

          return {
            id: item.id,
            description: item.fee_categories?.name || item.description,
            dueDate: calculateDueDate(invoice.due_date),
            balance: balance,
            status: status,
            amount: Number(item.amount) // Keep original amount for ref
          }
        })

        return {
          studentId: student.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          dueDate: calculateDueDate(invoice.due_date),
          items: items
        }
      })

      const flatItems = invoices?.flatMap((inv: any) => inv.items) || []

      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        class: classWithSection,
        invoiceNumber: invoices?.[0]?.invoiceNumber || "N/A",
        invoices: flatItems,
        isPaid: flatItems.every((item: any) => item.status === "Paid" || item.balance <= 0),
      }
    })
      .filter((s: StudentData) => s.invoices && s.invoices.length > 0)
      .sort((a: any, b: any) => a.isPaid === b.isPaid ? 0 : a.isPaid ? 1 : -1)

    setStudentsData(transformed)
  }

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItemIds)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItemIds(newSelected)

    // Callback with selected items
    const items = studentsData
      .flatMap((student) =>
        student.invoices
          .filter((item) => newSelected.has(item.id))
          .map((item) => ({
            ...item,
            studentId: student.id,
            studentName: student.name,
          }))
      )
    onItemsSelected?.(items)
  }

  const calculateDueDate = (dueDateString: string | null): string => {
    if (!dueDateString) return "N/A"

    try {
      const dueDate = new Date(dueDateString)
      const today = new Date()
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        return "Overdue"
      } else if (diffDays === 0) {
        return "Today"
      } else if (diffDays === 1) {
        return "Tomorrow"
      } else if (diffDays <= 7) {
        return `${diffDays} days`
      } else if (diffDays <= 30) {
        const weeks = Math.ceil(diffDays / 7)
        return `${weeks} week${weeks > 1 ? "s" : ""}`
      } else {
        const months = Math.ceil(diffDays / 30)
        return `${months} month${months > 1 ? "s" : ""}`
      }
    } catch (error) {
      return "N/A"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="ml-2 text-sm text-muted-foreground">Loading invoices...</p>
          </CardContent>
        </Card>
      ) : guardianInfo ? (
        <>
          {/* Guardian/Parent Card */}
          <Card className="border shadow-none p-2">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-green-500">
                    <AvatarFallback className="bg-green-500 text-white font-semibold">
                      {getInitials(guardianInfo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{guardianInfo.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {guardianInfo.relationship}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{guardianInfo.phone}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Payment History</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Student Invoice Cards */}
          {studentsData.length > 0 ? (
            <div className="space-y-3">
              {studentsData.map((student) => (
                <StudentInvoiceCard
                  key={student.id}
                  studentId={student.id}
                  studentName={student.name}
                  studentClass={student.class}
                  invoiceNumber={student.invoiceNumber}
                  invoices={student.invoices}
                  selectedItemIds={selectedItemIds}
                  onItemToggle={handleItemToggle}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No pending invoices for this family
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : studentsData.length > 0 ? (
        // Direct student selection - show only that student's card
        <div className="space-y-3">
          {studentsData.map((student) => (
            <StudentInvoiceCard
              key={student.id}
              studentId={student.id}
              studentName={student.name}
              studentClass={student.class}
              invoiceNumber={student.invoiceNumber}
              invoices={student.invoices}
              selectedItemIds={selectedItemIds}
              onItemToggle={handleItemToggle}
            />
          ))}
        </div>
      ) : !selectedFamily ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <InboxIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="font-medium text-muted-foreground">No family selected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Search and select a parent or student to view their invoices
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No pending invoices found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
