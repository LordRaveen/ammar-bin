"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Eye, Edit2, Trash2, RotateCw, EyeOff } from "lucide-react"
import { FeeStructureModal } from "@/components/finance/fee-structure-modal"
import { PreviewImpactModal } from "@/components/finance/preview-impact-modal"
import { BulkGenerateModal } from "@/components/finance/bulk-generate-modal"

interface Session {
  id: string
  name: string
}

interface Term {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
  section?: { name: string }
}

interface FeeStructure {
  id: string
  fee_category_id: string
  amount: number
  due_date: string
  gender_specific: string | null
  active: boolean
  is_mandatory: boolean
  fee_categories?: { name: string; is_recurring: boolean }
}

export function FeesTab() {
  const [activeTab, setActiveTab] = useState("by-class")
  const [selectedSession, setSelectedSession] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [sessions, setSessions] = useState<Session[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loading, setLoading] = useState(false)
  const [feeModalOpen, setFeeModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null)
  const supabase = createBrowserClient()

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [])

  // Fetch terms when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchTerms(selectedSession)
    }
  }, [selectedSession])

  // Fetch fee structures when filters change
  useEffect(() => {
    if (selectedSession && selectedTerm && selectedClass) {
      fetchFeeStructures()
    }
  }, [selectedSession, selectedTerm, selectedClass])

  // Fetch classes
  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchSessions = async () => {
    try {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: false })

      setSessions(data || [])
      if (data && data.length > 0 && !selectedSession) {
        setSelectedSession(data[0].id)
      }
    } catch (error) {
      console.error("[v0] Error fetching sessions:", error)
    }
  }

  const fetchTerms = async (sessionId: string) => {
    try {
      const { data } = await supabase
        .from("terms")
        .select("*")
        .eq("session_id", sessionId)
        .order("term_number", { ascending: true })

      setTerms(data || [])
      if (data && data.length > 0 && !selectedTerm) {
        setSelectedTerm(data[0].id)
      }
    } catch (error) {
      console.error("[v0] Error fetching terms:", error)
    }
  }

  const fetchClasses = async () => {
    try {
      const { data } = await supabase
        .from("classes")
        .select("*, section:section_id(name)")
        .eq("is_active", true)
        .order("name", { ascending: true })

      setClasses(data || [])
      if (data && data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].id)
      }
    } catch (error) {
      console.error("[v0] Error fetching classes:", error)
    }
  }

  const fetchFeeStructures = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("fee_structures")
        .select("*, fee_categories(name, is_recurring)")
        .eq("session_id", selectedSession)
        .eq("term_id", selectedTerm)
        .eq("class_id", selectedClass)
        .order("fee_categories(name)", { ascending: true })

      setFeeStructures(data || [])
    } catch (error) {
      console.error("[v0] Error fetching fee structures:", error)
      toast.error("Failed to load fee structures")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFee = async (feeId: string) => {
    try {
      const { error } = await supabase
        .from("fee_structures")
        .delete()
        .eq("id", feeId)

      if (error) {
        toast.error("Failed to delete fee")
        return
      }

      setFeeStructures(feeStructures.filter(f => f.id !== feeId))
      toast.success("Fee deleted successfully")
    } catch (error) {
      console.error("[v0] Error deleting fee:", error)
      toast.error("Error deleting fee")
    }
  }

  const handleToggleActive = async (fee: FeeStructure) => {
    try {
      const { error } = await supabase
        .from("fee_structures")
        .update({ active: !fee.active })
        .eq("id", fee.id)

      if (error) {
        toast.error("Failed to update fee status")
        return
      }

      setFeeStructures(
        feeStructures.map(f =>
          f.id === fee.id ? { ...f, active: !f.active } : f
        )
      )
      toast.success(fee.active ? "Fee deactivated" : "Fee activated")
    } catch (error) {
      console.error("[v0] Error updating fee:", error)
      toast.error("Error updating fee")
    }
  }

  const currentClass = classes.find(c => c.id === selectedClass)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="by-class">By Class</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="by-class" className="space-y-6 mt-6">
          {/* Header Controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingFee(null)
                  setFeeModalOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Fee
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewModalOpen(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Impact
              </Button>
              <Button
                variant="outline"
                onClick={() => setBulkGenerateOpen(true)}
                className="gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Generate Invoices
              </Button>
            </div>
          </div>

          {/* Class Selector Chips */}
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedClass === cls.id
                    ? "bg-blue-600 text-white"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {cls.name} {cls.section?.name ? `- ${cls.section.name}` : ""}
              </button>
            ))}
          </div>

          {/* Fee Structures Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>
                {currentClass
                  ? `Fee Structures - ${currentClass.name}${
                      currentClass.section?.name ? ` - ${currentClass.section.name}` : ""
                    }`
                  : "Fee Structures"}
              </CardTitle>
              <Button
                onClick={() => {
                  setEditingFee(null)
                  setFeeModalOpen(true)
                }}
                className="gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Fee
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading fee structures...
                </div>
              ) : feeStructures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No fee structures found. Add one to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Recurrence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.map(fee => (
                      <TableRow key={fee.id} className={!fee.active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">
                          {fee.fee_categories?.name}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₦{Number(fee.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {fee.due_date
                            ? new Date(fee.due_date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "–"}
                        </TableCell>
                        <TableCell>
                          {fee.gender_specific ? (
                            <Badge variant="outline" className="text-xs">
                              {fee.gender_specific}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Both
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {fee.fee_categories?.is_recurring && (
                            <RotateCw className="h-4 w-4 text-blue-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={fee.active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {fee.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingFee(fee)
                                setFeeModalOpen(true)
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleToggleActive(fee)}
                              title={fee.active ? "Deactivate" : "Activate"}
                            >
                              {fee.active ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteFee(fee.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-category">
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <FeeStructureModal
        open={feeModalOpen}
        onOpenChange={setFeeModalOpen}
        editingFee={editingFee}
        session={selectedSession}
        term={selectedTerm}
        classId={selectedClass}
        onSave={() => {
          setFeeModalOpen(false)
          setEditingFee(null)
          fetchFeeStructures()
        }}
      />

      <PreviewImpactModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        session={selectedSession}
        term={selectedTerm}
        classId={selectedClass}
        className={currentClass ? `${currentClass.name}${currentClass.section?.name ? ` - ${currentClass.section.name}` : ""}` : ""}
        feeStructures={feeStructures}
      />

      <BulkGenerateModal
        open={bulkGenerateOpen}
        onOpenChange={setBulkGenerateOpen}
      />
    </div>
  )
}
