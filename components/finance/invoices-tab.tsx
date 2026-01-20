"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Download, FileText } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { InvoicesTable } from "@/components/finance/invoices-table"
import { InvoiceDetailsDrawer } from "@/components/finance/invoice-details-drawer"
import { BulkGenerateModal } from "@/components/finance/bulk-generate-modal"

interface InvoicesTabProps {
  userRole?: "admin" | "accountant" | "parent"
}

interface FilterOptions {
  sessions: any[]
  terms: any[]
  classes: any[]
}

export function InvoicesTab({ userRole = "admin" }: InvoicesTabProps) {
  const [selectedSession, setSelectedSession] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sessions: [],
    terms: [],
    classes: [],
  })
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("invoices-tab-state")
    if (saved) {
      try {
        const state = JSON.parse(saved)
        setSelectedSession(state.session || "")
        setSelectedTerm(state.term || "")
        setSelectedClass(state.class || "")
        setSelectedStatus(state.status || "All")
        setSearchTerm(state.search || "")
      } catch (e) {
        console.error("[v0] Error parsing saved state:", e)
      }
    }
    setMounted(true)
  }, [])

  // Save state to localStorage when filters change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "invoices-tab-state",
        JSON.stringify({
          session: selectedSession,
          term: selectedTerm,
          class: selectedClass,
          status: selectedStatus,
          search: searchTerm,
        })
      )
    }
  }, [selectedSession, selectedTerm, selectedClass, selectedStatus, searchTerm, mounted])

  // Fetch filter options from database
  useEffect(() => {
    if (!mounted) return

    const fetchFilterOptions = async () => {
      try {
        const [sessionsResult, classesResult] = await Promise.all([
          supabase.from("sessions").select("*").eq("is_active", true).order("name", { ascending: false }),
          supabase.from("classes").select("*, sections(name)").eq("is_active", true).order("name", { ascending: true }),
        ])

        const sessions = sessionsResult.data || []
        const classes = classesResult.data || []

        setFilterOptions((prev) => ({
          ...prev,
          sessions,
          classes,
        }))

        // Set default session to first active one if not already set
        if (sessions.length > 0 && !selectedSession) {
          setSelectedSession(sessions[0].id)
        }
      } catch (error) {
        console.error("[v0] Error fetching filter options:", error)
      }
    }

    fetchFilterOptions()
  }, [supabase, mounted, selectedSession])

  // Fetch terms when session changes
  useEffect(() => {
    if (!selectedSession) return

    const fetchTerms = async () => {
      try {
        const { data: terms } = await supabase
          .from("terms")
          .select("*")
          .eq("session_id", selectedSession)
          .eq("is_active", true)
          .order("term_number", { ascending: true })

        setFilterOptions((prev) => ({
          ...prev,
          terms: terms || [],
        }))

        // Auto-select first term
        if (terms && terms.length > 0 && !selectedTerm) {
          setSelectedTerm(terms[0].id)
        }
      } catch (error) {
        console.error("[v0] Error fetching terms:", error)
      }
    }

    fetchTerms()
  }, [selectedSession, selectedTerm, supabase])

  return (
    <div className="space-y-6">
      {/* Filters and Action Bar */}
      <div className="space-y-4">
        {/* Filters Row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Session</label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Term</label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filterOptions.classes.map((classItem: any) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name} {classItem.sections?.name ? `- ${classItem.sections.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Search Student</label>
            <Input
              placeholder="Student name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {userRole === "admin" && (
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Generate Invoice
            </Button>
            <Button
              className="gap-2 bg-transparent"
              size="sm"
              variant="outline"
              onClick={() => setBulkGenerateOpen(true)}
            >
              <FileText className="h-4 w-4" />
              Bulk Generate
            </Button>
            <Button className="gap-2 bg-transparent" size="sm" variant="outline">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      {mounted && selectedSession && selectedTerm && (
        <InvoicesTable
          onSelectInvoice={setSelectedInvoice}
          filters={{
            session: selectedSession,
            term: selectedTerm,
            class: selectedClass,
            status: selectedStatus,
            search: searchTerm,
          }}
        />
      )}

      {/* Invoice Details Drawer */}
      {selectedInvoice && (
        <InvoiceDetailsDrawer
          invoiceId={selectedInvoice}
          open={!!selectedInvoice}
          onOpenChange={(open) => {
            if (!open) setSelectedInvoice(null)
          }}
          userRole={userRole}
        />
      )}

      {/* Bulk Generate Modal */}
      <BulkGenerateModal open={bulkGenerateOpen} onOpenChange={setBulkGenerateOpen} />
    </div>
  )
}
