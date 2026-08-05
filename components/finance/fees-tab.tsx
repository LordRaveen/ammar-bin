"use client"

import { useEffect, useState, useMemo } from "react"
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
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("All")
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

  // Compute sections list dynamically
  const sectionsList = useMemo(() => {
    return Array.from(new Set(classes.map(c => c.section?.name).filter(Boolean)))
  }, [classes])

  // Filter classes by selected section tab
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => 
      selectedSectionFilter === "All" || cls.section?.name === selectedSectionFilter
    )
  }, [classes, selectedSectionFilter])

  // Auto select class when section filter changes
  useEffect(() => {
    if (filteredClasses.length > 0) {
      const isStillInList = filteredClasses.some(c => c.id === selectedClass)
      if (!isStillInList) {
        setSelectedClass(filteredClasses[0].id)
      }
    } else {
      setSelectedClass("")
    }
  }, [filteredClasses, selectedClass])

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
      {/* Tabs wrapper */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
          <TabsList className="bg-zinc-100/60 dark:bg-zinc-900/60 p-1 rounded-xl w-full sm:w-auto">
            <TabsTrigger value="by-class" className="text-xs font-bold rounded-lg px-4 py-2">By Class</TabsTrigger>
            <TabsTrigger value="by-category" className="text-xs font-bold rounded-lg px-4 py-2">By Category</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs font-bold rounded-lg px-4 py-2">Templates</TabsTrigger>
            <TabsTrigger value="manage-fees" className="text-xs font-bold rounded-lg px-4 py-2">Manage Fee Categories</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Academic Session Selector */}
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background border border-zinc-200/80 dark:border-zinc-800/80 h-9 text-xs rounded-xl shadow-none">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Term Selector */}
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background border border-zinc-200/80 dark:border-zinc-800/80 h-9 text-xs rounded-xl shadow-none">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="by-class" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar - Class Selection */}
            <div className="md:col-span-3 lg:col-span-3 space-y-4">
              <div className="space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground pl-0.5 flex items-center justify-between">
                  <span>Sections</span>
                  <span className="text-[10px] lowercase text-muted-foreground">{filteredClasses.length} class(es)</span>
                </div>
                
                {/* Section filter tabs */}
                <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                  <button
                    type="button"
                    onClick={() => setSelectedSectionFilter("All")}
                    className={`flex-1 text-[10px] font-black uppercase tracking-wider py-1.5 px-2 rounded-lg transition-colors text-center ${
                      selectedSectionFilter === "All"
                        ? "bg-white dark:bg-zinc-950 text-foreground border border-zinc-200/30 dark:border-zinc-800/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {sectionsList.map((secName: any) => (
                    <button
                      key={secName}
                      type="button"
                      onClick={() => setSelectedSectionFilter(secName)}
                      className={`flex-1 text-[10px] font-black uppercase tracking-wider py-1.5 px-2 rounded-lg transition-colors text-center ${
                        selectedSectionFilter === secName
                          ? "bg-white dark:bg-zinc-950 text-foreground border border-zinc-200/30 dark:border-zinc-800/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {secName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredClasses.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between group ${selectedClass === cls.id
                      ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 font-bold"
                      : "hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <span className="truncate font-medium">{cls.name}</span>
                    {cls.section?.name && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${selectedClass === cls.id
                        ? "border-zinc-700 bg-zinc-800 text-zinc-300 dark:border-zinc-300 dark:bg-zinc-200 dark:text-zinc-700"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
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
                    <h2 className="text-base font-black uppercase tracking-wider">
                      {currentClass ? currentClass.name : "Select a Class"}
                      {currentClass?.section?.name && <span className="text-muted-foreground font-normal ml-2 text-sm">{currentClass.section.name}</span>}
                    </h2>
                    <p className="text-xs text-muted-foreground">Manage fee structure and amounts</p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewModalOpen(true)}
                      className="gap-2 h-9 text-xs font-semibold rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 shadow-none"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBulkGenerateOpen(true)}
                      className="gap-2 h-9 text-xs font-semibold rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 shadow-none"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Generate
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingFee(null)
                        setFeeModalOpen(true)
                      }}
                      className="gap-2 h-9 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors shadow-none"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Fee
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden shadow-none">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Due Date</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recurrence</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground italic">
                            Loading fee structures...
                          </TableCell>
                        </TableRow>
                      ) : feeStructures.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground italic">
                            No fee structures found for this class.
                          </TableCell>
                        </TableRow>
                      ) : (
                        feeStructures.map(fee => (
                          <TableRow key={fee.id} className={!fee.active ? "opacity-60 bg-zinc-50/20 dark:bg-zinc-900/10" : ""}>
                            <TableCell className="font-semibold text-xs py-3">
                              {fee.fee_categories?.name}
                            </TableCell>
                            <TableCell className="text-right font-black font-mono text-zinc-900 dark:text-zinc-100 text-xs py-3">
                              ₦{Number(fee.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs py-3 text-muted-foreground font-medium">
                              {fee.due_date
                                ? new Date(fee.due_date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })
                                : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="py-3">
                              {fee.gender_specific ? (
                                <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-1.5 h-5 rounded-md uppercase tracking-wider border-zinc-200 dark:border-zinc-800">
                                  {fee.gender_specific}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs font-medium">All</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              {fee.fee_categories?.is_recurring ? (
                                <div className="flex items-center gap-1 text-blue-600 font-semibold text-xs">
                                  <RotateCw className="h-3 w-3" />
                                  <span>Recurring</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs font-medium">One-time</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge
                                variant={fee.active ? "secondary" : "outline"}
                                className={`text-[9px] font-bold py-0.5 px-1.5 h-5 rounded-md uppercase tracking-wider ${fee.active ? "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-450 dark:border-green-800/40" : "text-muted-foreground"}`}
                              >
                                {fee.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right py-3">
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
          <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 rounded-2xl shadow-none">
            <CardContent className="py-12">
              <p className="text-center text-xs text-muted-foreground italic">Coming soon...</p>
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
