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
import { FeeCategoryManager } from "@/components/finance/fee-category-manager"
import { FeeTemplatesTab } from "@/components/finance/fee-templates-tab"

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
          <TabsTrigger value="manage-fees">Manage Fee Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="by-class" className="space-y-6 mt-6">
          {/* Top Filters - Clean Design */}
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            <div className="space-y-1.5 flex-1 min-w-[200px] max-w-[250px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Session</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-full bg-background border-input shadow-sm h-10">
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
            </div>

            <div className="space-y-1.5 flex-1 min-w-[200px] max-w-[250px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-full bg-background border-input shadow-sm h-10">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar - Class Selection */}
            <div className="md:col-span-3 lg:col-span-3 space-y-4">
              <div className="font-medium text-sm flex items-center justify-between">
                <span>Classes</span>
                <span className="text-xs text-muted-foreground">{classes.length} found</span>
              </div>

              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between group ${selectedClass === cls.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <span className="truncate font-medium">{cls.name}</span>
                    {cls.section?.name && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${selectedClass === cls.id
                        ? "border-primary-foreground/30 bg-primary-foreground/10"
                        : "border-border bg-muted/50"
                        }`}>
                        {cls.section.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content - Fee Table */}
            <div className="md:col-span-9 lg:col-span-9 space-y-6">
              <Card className="border-none shadow-none bg-transparent">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {currentClass ? currentClass.name : "Select a Class"}
                      {currentClass?.section?.name && <span className="text-muted-foreground font-normal ml-2 text-base">{currentClass.section.name}</span>}
                    </h2>
                    <p className="text-sm text-muted-foreground">Manage fee structure and amounts</p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewModalOpen(true)}
                      className="gap-2 h-9 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBulkGenerateOpen(true)}
                      className="gap-2 h-9 text-xs"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Generate
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingFee(null)
                        setFeeModalOpen(true)
                      }}
                      className="gap-2 h-9 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Fee
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                            Loading fee structures...
                          </TableCell>
                        </TableRow>
                      ) : feeStructures.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                            No fee structures found for this class.
                          </TableCell>
                        </TableRow>
                      ) : (
                        feeStructures.map(fee => (
                          <TableRow key={fee.id} className={!fee.active ? "opacity-60 bg-muted/20" : ""}>
                            <TableCell className="font-medium">
                              {fee.fee_categories?.name}
                            </TableCell>
                            <TableCell className="text-right font-bold font-mono text-muted-foreground">
                              ₦{Number(fee.amount).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {fee.due_date
                                ? new Date(fee.due_date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })
                                : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              {fee.gender_specific ? (
                                <Badge variant="outline" className="text-[10px] py-0 h-5">
                                  {fee.gender_specific}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">All</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {fee.fee_categories?.is_recurring && (
                                <div className="flex items-center gap-1.5 text-blue-600">
                                  <RotateCw className="h-3.5 w-3.5" />
                                  <span className="text-xs">Recurring</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={fee.active ? "secondary" : "outline"}
                                className={`text-[10px] h-5 ${fee.active ? "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700 border-green-200" : "text-muted-foreground"}`}
                              >
                                {fee.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingFee(fee)
                                    setFeeModalOpen(true)
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleToggleActive(fee)}
                                  title={fee.active ? "Deactivate" : "Activate"}
                                >
                                  {fee.active ? (
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:text-destructive"
                                  onClick={() => handleDeleteFee(fee.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>


        <TabsContent value="by-category">
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <FeeTemplatesTab />
        </TabsContent>

        <TabsContent value="manage-fees" className="mt-6">
          <FeeCategoryManager />
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
