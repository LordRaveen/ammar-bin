"use client"

import { useState, useEffect, Fragment } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  Loader2, Plus, Pencil, Trash2, BookOpen, Layers, 
  Settings2, Activity, Heart, Bookmark, X, Check, Save, Award, AlertTriangle
} from "lucide-react"
import { 
  createSubject, updateSubject, deleteSubject,
  createSubjectComponent, deleteSubjectComponent,
  createBehaviorCategory, deleteBehaviorCategory,
  assignComponentToClass, unassignComponentFromClass,
  updateClassComponentLimits, updateClassSubjectLimits
} from "@/app/(dashboard)/settings/subjects/actions"
import { 
  createGradingScheme, updateGradingScheme, deleteGradingScheme 
} from "@/app/(dashboard)/settings/grading/actions"

export function SubjectManagement() {
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string>("all")
  const [behaviorCategories, setBehaviorCategories] = useState<any[]>([])
  const [gradingSchemes, setGradingSchemes] = useState<any[]>([])
  
  // Class Subject Assignments state
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [classSubjectCounts, setClassSubjectCounts] = useState<Record<string, number>>({})
  const [assignedSubjects, setAssignedSubjects] = useState<Record<string, { max_score: number; pass_mark: number; ca_count: number }>>({})
  const [assignedComponents, setAssignedComponents] = useState<Record<string, string[]>>({})
  const [componentLimits, setComponentLimits] = useState<Record<string, { max_ca: number; max_exam: number; ca_count: number }>>({})
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [savingSubjectId, setSavingSubjectId] = useState<string | null>(null)

  // Subject creation/editing states
  const [newSubName, setNewSubName] = useState("")
  const [newSubCode, setNewSubCode] = useState("")
  const [newSubDesc, setNewSubDesc] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<any | null>(null)
  
  // Sub-component state
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)
  const [newCompName, setNewCompName] = useState("")
  const [compLoading, setCompLoading] = useState(false)

  // Behavior state
  const [newBehaviorName, setNewBehaviorName] = useState("")
  const [behaviorLoading, setBehaviorLoading] = useState(false)

  // Grading Scheme creation/editing states
  const [gradingOpen, setGradingOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<any | null>(null)
  const [newGradeLetter, setNewGradeLetter] = useState("")
  const [newGradeMin, setNewGradeMin] = useState("")
  const [newGradeMax, setNewGradeMax] = useState("")
  const [newGradeRemark, setNewGradeRemark] = useState("")

  // Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void | Promise<void>
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  // Fetch all core directories on load
  async function loadData() {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data: subData } = await supabase
        .from("subjects")
        .select("*, subject_components(id, name)")
        .eq("is_active", true)
        .order("name")

      const { data: clsData } = await supabase
        .from("classes")
        .select("id, name, section_id, section:sections(name)")
        .eq("is_active", true)
        .order("name")

      const { data: secData } = await supabase
        .from("sections")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      const { data: behData } = await supabase
        .from("behavior_categories")
        .select("*")
        .eq("is_active", true)
        .order("name")

      const { data: grData } = await supabase
        .from("grading_schemes")
        .select("*")
        .order("min_score", { ascending: false })

      const { data: allCS } = await supabase
        .from("class_subjects")
        .select("class_id")

      if (subData) setSubjects(subData)
      if (secData) setSections(secData)
      if (clsData) {
        setClasses(clsData)
        if (clsData.length > 0 && !selectedClassId) {
          setSelectedClassId(clsData[0].id)
        }
      }
      if (behData) setBehaviorCategories(behData)
      if (grData) setGradingSchemes(grData)

      // Calculate initial class subject counts
      const counts: Record<string, number> = {}
      allCS?.forEach((cs) => {
        counts[cs.class_id] = (counts[cs.class_id] || 0) + 1
      })
      setClassSubjectCounts(counts)
    } catch (e: any) {
      console.error(e)
      toast.error("Failed to load settings data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Load subject assignments for selected class
  useEffect(() => {
    async function loadClassAssignments() {
      if (!selectedClassId) return
      setAssignmentLoading(true)
      try {
        const supabase = createClient()
        
        // Fetch class subjects
        const { data: subData, error: subError } = await supabase
          .from("class_subjects")
          .select("*")
          .eq("class_id", selectedClassId)

        if (subError) throw subError

        const mapping: Record<string, { max_score: number; pass_mark: number; ca_count: number }> = {}
        subData?.forEach((cs) => {
          mapping[cs.subject_id] = {
            max_score: cs.max_score,
            pass_mark: cs.pass_mark,
            ca_count: cs.ca_count ?? 2,
          }
        })
        setAssignedSubjects(mapping)

        // Fetch class components mapping
        const { data: compData, error: compError } = await supabase
          .from("class_subject_components")
          .select("*")
          .eq("class_id", selectedClassId)

        if (compError) throw compError

        const compMapping: Record<string, string[]> = {}
        const limitsMapping: Record<string, { max_ca: number; max_exam: number; ca_count: number }> = {}
        compData?.forEach((cc) => {
          if (!compMapping[cc.subject_id]) compMapping[cc.subject_id] = []
          compMapping[cc.subject_id].push(cc.subject_component_id)
          const key = `${selectedClassId}_${cc.subject_id}_${cc.subject_component_id}`
          limitsMapping[key] = {
            max_ca: cc.max_ca ?? 40,
            max_exam: cc.max_exam ?? 60,
            ca_count: cc.ca_count ?? 2,
          }
        })
        setAssignedComponents(compMapping)
        setComponentLimits(limitsMapping)

        // Update count for current class
        setClassSubjectCounts(prev => ({
          ...prev,
          [selectedClassId]: Object.keys(mapping).length
        }))
      } catch (e: any) {
        console.error(e)
        toast.error("Failed to load class subject links")
      } finally {
        setAssignmentLoading(false)
      }
    }
    loadClassAssignments()
  }, [selectedClassId])

  // Subject actions (Zero-reload, Optimistic)
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubName || !newSubCode) return
    try {
      const res = await createSubject({
        name: newSubName,
        code: newSubCode,
        description: newSubDesc,
      })
      if (res && !res.success) {
        toast.error(res.error || "Failed to create subject")
        return
      }
      toast.success("Subject created successfully")
      setCreateOpen(false)
      
      // Optimistically add to state without reload
      const supabase = createClient()
      const { data: created } = await supabase
        .from("subjects")
        .select("*, subject_components(id, name)")
        .eq("code", newSubCode)
        .single()

      if (created) {
        setSubjects(prev => [...prev, created])
      }

      setNewSubName("")
      setNewSubCode("")
      setNewSubDesc("")
    } catch (err: any) {
      toast.error(err.message || "Failed to create subject")
    }
  }

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubject || !editingSubject.name || !editingSubject.code) return
    try {
      const res = await updateSubject(editingSubject.id, {
        name: editingSubject.name,
        code: editingSubject.code,
        description: editingSubject.description,
      })
      if (res && !res.success) {
        toast.error(res.error || "Failed to update subject")
        return
      }
      toast.success("Subject updated successfully")
      
      // Optimistically update local subjects list without full reload
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? { ...s, ...editingSubject } : s))
      setEditingSubject(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to update subject")
    }
  }

  const confirmDeleteSubject = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: `Delete "${name}"?`,
      description: "Are you sure you want to delete this curriculum subject? All score entries associated with it will be permanently removed.",
      onConfirm: async () => {
        try {
          setSubjects(prev => prev.filter(s => s.id !== id))
          await deleteSubject(id)
          toast.success("Subject deleted successfully")
        } catch (err: any) {
          toast.error(err.message || "Failed to delete subject")
          loadData()
        }
      }
    })
  }

  // Component actions (Zero-reload, Optimistic)
  const handleAddComponent = async (subjectId: string) => {
    if (!newCompName.trim()) return
    setCompLoading(true)
    try {
      const res = await createSubjectComponent(subjectId, newCompName.trim())
      toast.success("Component added")
      setNewCompName("")
      
      if (res.data) {
        setSubjects(prev => prev.map(s => {
          if (s.id === subjectId) {
            const existingComps = s.subject_components || []
            return { ...s, subject_components: [...existingComps, res.data] }
          }
          return s
        }))
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add component")
    } finally {
      setCompLoading(false)
    }
  }

  const confirmDeleteComponent = (componentId: string, subjectId: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: `Remove "${name}"?`,
      description: "Are you sure you want to remove this subject sub-component?",
      onConfirm: async () => {
        setCompLoading(true)
        try {
          setSubjects(prev => prev.map(s => {
            if (s.id === subjectId) {
              return { ...s, subject_components: (s.subject_components || []).filter((c: any) => c.id !== componentId) }
            }
            return s
          }))
          await deleteSubjectComponent(componentId)
          toast.success("Component removed")
        } catch (err: any) {
          toast.error(err.message || "Failed to remove component")
          loadData()
        } finally {
          setCompLoading(false)
        }
      }
    })
  }

  // Class assignment checklist actions (Blazing fast, Optimistic updates)
  const handleToggleSubject = async (subjectId: string, checked: boolean) => {
    if (!selectedClassId) return
    const supabase = createClient()
    
    // 1. Instant Optimistic state update (0ms UI feedback)
    if (checked) {
      const targetSubject = subjects.find((s) => s.id === subjectId)
      const componentIds = targetSubject?.subject_components?.map((c: any) => c.id) || []

      setAssignedSubjects(prev => ({
        ...prev,
        [subjectId]: { max_score: 100, pass_mark: 40, ca_count: 2 }
      }))

      if (componentIds.length > 0) {
        setAssignedComponents(prev => ({
          ...prev,
          [subjectId]: componentIds
        }))
      }

      setClassSubjectCounts(prev => ({
        ...prev,
        [selectedClassId]: (prev[selectedClassId] || 0) + 1
      }))
    } else {
      setAssignedSubjects(prev => {
        const next = { ...prev }
        delete next[subjectId]
        return next
      })
      setAssignedComponents(prev => {
        const next = { ...prev }
        delete next[subjectId]
        return next
      })
      setClassSubjectCounts(prev => ({
        ...prev,
        [selectedClassId]: Math.max(0, (prev[selectedClassId] || 1) - 1)
      }))
    }

    // 2. Perform DB operation in background
    try {
      if (checked) {
        const { error } = await supabase
          .from("class_subjects")
          .insert({
            class_id: selectedClassId,
            subject_id: subjectId,
            max_score: 100,
            pass_mark: 40,
          })
        if (error) throw error

        // Auto-assign all components by default
        const targetSubject = subjects.find((s) => s.id === subjectId)
        const componentIds = targetSubject?.subject_components?.map((c: any) => c.id) || []
        
        if (componentIds.length > 0) {
          const insertPayload = componentIds.map((cid: string) => ({
            class_id: selectedClassId,
            subject_id: subjectId,
            subject_component_id: cid
          }))
          const { error: compErr } = await supabase
            .from("class_subject_components")
            .insert(insertPayload)
          
          if (compErr) throw compErr
        }
        toast.success("Subject assigned to class")
      } else {
        const { error } = await supabase
          .from("class_subjects")
          .delete()
          .eq("class_id", selectedClassId)
          .eq("subject_id", subjectId)
        if (error) throw error

        await supabase
          .from("class_subject_components")
          .delete()
          .eq("class_id", selectedClassId)
          .eq("subject_id", subjectId)

        toast.success("Subject unassigned from class")
      }
    } catch (err: any) {
      toast.error(err.message || "Operation failed")
      // Revert state if failed
      loadData()
    }
  }

  const handleToggleComponent = async (subjectId: string, componentId: string, checked: boolean) => {
    if (!selectedClassId) return
    
    const key = `${selectedClassId}_${subjectId}_${componentId}`
    
    // Instant Optimistic Update
    if (checked) {
      setAssignedComponents(prev => ({
        ...prev,
        [subjectId]: [...(prev[subjectId] || []), componentId]
      }))
      setComponentLimits(prev => ({
        ...prev,
        [key]: { max_ca: 40, max_exam: 60, ca_count: 2 }
      }))
    } else {
      setAssignedComponents(prev => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).filter(id => id !== componentId)
      }))
      setComponentLimits(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }

    try {
      if (checked) {
        await assignComponentToClass(selectedClassId, subjectId, componentId)
        toast.success("Component activated")
      } else {
        await unassignComponentFromClass(selectedClassId, subjectId, componentId)
        toast.success("Component deactivated")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update component mapping")
    }
  }

  const handleUpdateAssignmentScores = async (subjectId: string, maxScore: number, passMark: number, caCount: number) => {
    if (!selectedClassId) return
    setSavingSubjectId(subjectId)
    try {
      await updateClassSubjectLimits(selectedClassId, subjectId, maxScore, passMark, caCount)
      toast.success("Score limits saved successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to save score limits")
    } finally {
      setSavingSubjectId(null)
    }
  }

  // Behavior metrics actions
  const handleAddBehavior = async (type: "affective" | "psychomotor") => {
    if (!newBehaviorName.trim()) return
    setBehaviorLoading(true)
    try {
      const res = await createBehaviorCategory(newBehaviorName.trim(), type)
      toast.success("Evaluation metric registered")
      setNewBehaviorName("")
      
      // Optimistic update
      setBehaviorCategories(prev => [...prev, { id: Date.now().toString(), name: newBehaviorName.trim(), type, is_active: true }])
    } catch (err: any) {
      toast.error(err.message || "Failed to add behavior domain key")
    } finally {
      setBehaviorLoading(false)
    }
  }

  const confirmDeleteBehavior = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: `Delete "${name}"?`,
      description: "Are you sure you want to remove this behavior domain metric?",
      onConfirm: async () => {
        setBehaviorLoading(true)
        try {
          setBehaviorCategories(prev => prev.filter(c => c.id !== id))
          await deleteBehaviorCategory(id)
          toast.success("Evaluation metric deleted")
        } catch (err: any) {
          toast.error(err.message || "Failed to delete metric key")
          loadData()
        } finally {
          setBehaviorLoading(false)
        }
      }
    })
  }

  // Grading Scheme actions
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGradeLetter || newGradeMin === "" || newGradeMax === "" || !newGradeRemark) return
    const minVal = Number(newGradeMin)
    const maxVal = Number(newGradeMax)

    if (minVal >= maxVal) {
      toast.error("Minimum score must be less than maximum score")
      return
    }

    try {
      if (editingGrade) {
        // Optimistic update
        setGradingSchemes(prev => prev.map(g => g.id === editingGrade.id ? {
          ...g,
          grade: newGradeLetter,
          min_score: minVal,
          max_score: maxVal,
          remark: newGradeRemark
        } : g).sort((a, b) => b.min_score - a.min_score))

        await updateGradingScheme(editingGrade.id, {
          grade: newGradeLetter,
          min_score: minVal,
          max_score: maxVal,
          remark: newGradeRemark
        })
        toast.success("Grade level updated")
      } else {
        const tempId = Date.now().toString()
        // Optimistic add
        setGradingSchemes(prev => [...prev, {
          id: tempId,
          grade: newGradeLetter,
          min_score: minVal,
          max_score: maxVal,
          remark: newGradeRemark,
          is_active: true
        }].sort((a, b) => b.min_score - a.min_score))

        await createGradingScheme({
          grade: newGradeLetter,
          min_score: minVal,
          max_score: maxVal,
          remark: newGradeRemark
        })
        toast.success("New grade registered")
      }

      setGradingOpen(false)
      setEditingGrade(null)
      setNewGradeLetter("")
      setNewGradeMin("")
      setNewGradeMax("")
      setNewGradeRemark("")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to save grading metrics")
      loadData()
    }
  }

  const confirmDeleteGrade = (id: string, letter: string) => {
    setConfirmDialog({
      open: true,
      title: `Delete Grade "${letter}"?`,
      description: "Are you sure you want to delete this grade level scale? This action cannot be undone.",
      onConfirm: async () => {
        try {
          setGradingSchemes(prev => prev.filter(g => g.id !== id))
          await deleteGradingScheme(id)
          toast.success("Grade deleted successfully")
        } catch (err: any) {
          toast.error(err.message || "Failed to delete grade level")
          loadData()
        }
      }
    })
  }

  const openEditGrade = (grade: any) => {
    setEditingGrade(grade)
    setNewGradeLetter(grade.grade)
    setNewGradeMin(grade.min_score.toString())
    setNewGradeMax(grade.max_score.toString())
    setNewGradeRemark(grade.remark)
    setGradingOpen(true)
  }

  const filteredClasses = activeSectionId === "all" 
    ? classes 
    : classes.filter(c => c.section_id === activeSectionId || c.section?.id === activeSectionId)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span>Loading Subject Management Modules...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab Order: 1. Subjects Directory, 2. Class Assignments, 3. Behavior Domains, 4. Grading Scheme */}
      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid grid-cols-4 w-full sm:w-[720px] h-9 mb-4">
          <TabsTrigger value="subjects" className="text-xs gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Subjects Directory
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> Class Assignments
          </TabsTrigger>
          <TabsTrigger value="behavior" className="text-xs gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Behavior Domains
          </TabsTrigger>
          <TabsTrigger value="grading" className="text-xs gap-1.5">
            <Award className="h-3.5 w-3.5" /> Grading Scheme
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Subjects Directory (Default, Self-contained scroll) */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Subjects Directory</h2>
              <p className="text-[11px] text-muted-foreground">Manage core curriculum subjects and sub-components</p>
            </div>
            
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-3.5 w-3.5" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black rounded-2xl">
                <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
                  <DialogTitle className="text-base font-bold">Add Curriculum Subject</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Register a new subject. You can add components (like writing/oral) after registering.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubject} className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sub_name" className="text-xs font-semibold">Subject Name</Label>
                    <Input 
                      id="sub_name"
                      placeholder="e.g. Arabic, Al-Quran, Fiqh"
                      value={newSubName} 
                      onChange={(e) => setNewSubName(e.target.value)} 
                      required
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sub_code" className="text-xs font-semibold">Subject Code</Label>
                    <Input 
                      id="sub_code"
                      placeholder="e.g. ARB, QUR, FIQ"
                      value={newSubCode} 
                      onChange={(e) => setNewSubCode(e.target.value)} 
                      required
                      className="h-9 text-xs font-mono bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sub_desc" className="text-xs font-semibold">Description</Label>
                    <Input 
                      id="sub_desc"
                      placeholder="Optional details"
                      value={newSubDesc} 
                      onChange={(e) => setNewSubDesc(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 gap-2 -mx-5 -mb-5 p-4">
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="h-9 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                      Create Subject
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm max-h-[calc(100vh-300px)] min-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
                <TableRow className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                  <TableHead className="w-12 h-9">SN</TableHead>
                  <TableHead className="h-9">Code</TableHead>
                  <TableHead className="h-9">Subject Name</TableHead>
                  <TableHead className="h-9">Components</TableHead>
                  <TableHead className="text-right h-9 pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((sub, index) => {
                  const isExpanded = expandedSubjectId === sub.id
                  const componentsCount = sub.subject_components?.length || 0
                  return (
                    <Fragment key={sub.id}>
                      <TableRow 
                        onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                        className="cursor-pointer border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20 text-xs transition-colors"
                      >
                        <TableCell className="font-mono text-muted-foreground py-2.5">{index + 1}</TableCell>
                        <TableCell className="font-mono font-semibold py-2.5">{sub.code}</TableCell>
                        <TableCell className="font-bold py-2.5">{sub.name}</TableCell>
                        <TableCell className="py-2.5">
                          {componentsCount > 0 ? (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-50/50 text-emerald-600 border-emerald-500/20 font-semibold gap-1">
                              <Layers className="h-2.5 w-2.5" />
                              {componentsCount} Components
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">None (Normal Subject)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2.5 pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingSubject(sub)}
                              className="h-7 w-7 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => confirmDeleteSubject(sub.id, sub.name)}
                              className="h-7 w-7 p-0 hover:bg-red-500/10 rounded-md"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expandable sub-components panel */}
                      {isExpanded && (
                        <TableRow className="bg-zinc-50/30 dark:bg-zinc-950/20 hover:bg-zinc-50/30 dark:hover:bg-zinc-950/20">
                          <TableCell colSpan={5} className="p-4">
                            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-black/50 space-y-3.5">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                  <Layers className="h-3.5 w-3.5 text-emerald-600" />
                                  Manage components for {sub.name}
                                </h3>
                              </div>

                              {/* Form to add component inline */}
                              <div className="flex gap-2 max-w-sm">
                                <Input 
                                  placeholder="Component name (e.g. Speaking, Oral)" 
                                  value={newCompName}
                                  onChange={(e) => setNewCompName(e.target.value)}
                                  className="h-8 text-xs bg-white dark:bg-zinc-950"
                                  disabled={compLoading}
                                />
                                <Button 
                                  onClick={() => handleAddComponent(sub.id)}
                                  disabled={compLoading || !newCompName.trim()}
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-shrink-0"
                                >
                                  {compLoading ? "Adding..." : "+ Add"}
                                </Button>
                              </div>

                              {/* List of sub-components */}
                              {componentsCount > 0 ? (
                                <div className="flex flex-wrap gap-2 pt-1.5">
                                  {sub.subject_components.map((comp: any) => (
                                    <div 
                                      key={comp.id} 
                                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-xs"
                                    >
                                      <span className="font-semibold">{comp.name}</span>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => confirmDeleteComponent(comp.id, sub.id, comp.name)}
                                        className="h-5 w-5 p-0 text-muted-foreground hover:text-red-650 hover:bg-red-500/10 rounded-md"
                                        disabled={compLoading}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-muted-foreground italic">No sub-components mapped yet. This subject will score as a single unit.</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Edit Subject Dialog */}
          {editingSubject && (
            <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
              <DialogContent className="max-w-md p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl rounded-2xl">
                <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
                  <DialogTitle className="text-base font-bold">Edit Curriculum Subject</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateSubject} className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Subject Name</Label>
                    <Input 
                      value={editingSubject.name} 
                      onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})} 
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Subject Code</Label>
                    <Input 
                      value={editingSubject.code} 
                      onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})} 
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Description</Label>
                    <Input 
                      value={editingSubject.description || ""} 
                      onChange={(e) => setEditingSubject({...editingSubject, description: e.target.value})}
                      className="h-9 text-xs"
                    />
                  </div>
                  <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 gap-2 -mx-5 -mb-5 p-4">
                    <Button type="button" variant="outline" onClick={() => setEditingSubject(null)} className="h-9 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* TAB 2: Class Assignments (Split Layout, Internal Scroll Container) */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* LEFT SIDEBAR: Section Tabs & Class Selection List (Internal Scrollable Container) */}
            <div className="md:col-span-4 lg:col-span-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-white dark:bg-zinc-950 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">School Classes</span>
                <Badge variant="outline" className="text-[10px] font-mono">{filteredClasses.length} Classes</Badge>
              </div>

              {/* Section Pills */}
              {sections.length > 0 && (
                <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                  <button
                    onClick={() => setActiveSectionId("all")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                      activeSectionId === "all" 
                        ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSectionId(sec.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                        activeSectionId === sec.id 
                          ? "bg-emerald-600 text-white shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sec.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Class List Items (Internal Sleek Scrollable Box) */}
              <div className="space-y-1.5 max-h-[calc(100vh-330px)] min-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {filteredClasses.map((cls) => {
                  const isSelected = selectedClassId === cls.id
                  const subCount = classSubjectCounts[cls.id] || 0
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      className={cn(
                        "flex items-center justify-between w-full p-3 rounded-xl text-left border transition-all group",
                        isSelected 
                          ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm" 
                          : "bg-white dark:bg-zinc-950 border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-semibold transition-colors",
                        isSelected ? "text-foreground font-bold" : "text-zinc-700 dark:text-zinc-300"
                      )}>
                        {cls.name}
                      </span>
                      
                      {subCount > 0 ? (
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full min-w-6 text-center">
                          {subCount}
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-900 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          no subjects
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* RIGHT PANEL: Subject Assignment Table (Internal Sleek Scrollable Box) */}
            <div className="md:col-span-8 lg:col-span-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Class Subjects Checklist
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Active subjects and scoring limits for {classes.find(c => c.id === selectedClassId)?.name || "selected class"}
                  </p>
                </div>
              </div>

              {assignmentLoading ? (
                <div className="flex items-center justify-center py-16 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <span>Loading class subjects checklist...</span>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-330px)] min-h-[380px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
                      <TableRow className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                        <TableHead className="w-16 h-10 text-center">ACTIVE</TableHead>
                        <TableHead className="h-10">SUBJECT NAME</TableHead>
                        <TableHead className="w-32 h-10">MAX SCORE</TableHead>
                        <TableHead className="w-32 h-10">PASS MARK</TableHead>
                        <TableHead className="w-32 h-10">CA COUNT</TableHead>
                        <TableHead className="text-right h-10 pr-5">ACTION</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((sub) => {
                        const isAssigned = !!assignedSubjects[sub.id]
                        const maxScore = assignedSubjects[sub.id]?.max_score ?? 100
                        const passMark = assignedSubjects[sub.id]?.pass_mark ?? 40
                        const caCount = assignedSubjects[sub.id]?.ca_count ?? 2
                        const isSaving = savingSubjectId === sub.id

                        return (
                          <Fragment key={sub.id}>
                            <TableRow 
                              className={cn(
                                "border-b border-zinc-150 dark:border-zinc-850 text-xs transition-colors",
                                isAssigned ? "bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]" : "hover:bg-zinc-50/30"
                              )}
                            >
                              <TableCell className="text-center py-3">
                                <Checkbox 
                                  checked={isAssigned}
                                  onCheckedChange={(checked) => handleToggleSubject(sub.id, !!checked)}
                                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4 rounded-full"
                                />
                              </TableCell>
                              <TableCell className="py-3">
                                <div>
                                  <span className="font-bold text-foreground">{sub.name}</span>
                                  <span className="font-mono text-[11px] text-muted-foreground ml-2">({sub.code})</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <Input 
                                  type="number"
                                  value={maxScore}
                                  onChange={(e) => setAssignedSubjects(prev => ({
                                    ...prev,
                                    [sub.id]: { ...prev[sub.id], max_score: Number(e.target.value) }
                                  }))}
                                  disabled={!isAssigned}
                                  className="h-8 text-xs text-center font-mono w-24 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                />
                              </TableCell>
                              <TableCell className="py-3">
                                <Input 
                                  type="number"
                                  value={passMark}
                                  onChange={(e) => setAssignedSubjects(prev => ({
                                    ...prev,
                                    [sub.id]: { ...prev[sub.id], pass_mark: Number(e.target.value) }
                                  }))}
                                  disabled={!isAssigned}
                                  className="h-8 text-xs text-center font-mono w-24 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                />
                              </TableCell>
                              <TableCell className="py-3">
                                <select 
                                  value={caCount}
                                  onChange={(e) => {
                                    const newVal = Number(e.target.value)
                                    setAssignedSubjects(prev => ({
                                      ...prev,
                                      [sub.id]: { ...prev[sub.id], ca_count: newVal }
                                    }))
                                  }}
                                  disabled={!isAssigned}
                                  className="h-8 text-xs text-center font-mono w-24 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1"
                                >
                                  <option value={1}>1 CA</option>
                                  <option value={2}>2 CAs</option>
                                </select>
                              </TableCell>
                              <TableCell className="text-right py-3 pr-5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!isAssigned || isSaving}
                                  onClick={() => handleUpdateAssignmentScores(sub.id, maxScore, passMark, caCount)}
                                  className="h-7 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "Save Limits"
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Component Checklist toggle sub-row */}
                            {isAssigned && sub.subject_components?.length > 0 && (() => {
                              const activeComps = assignedComponents[sub.id] || []
                              
                              // Calculate component sums
                              const totalComponentCA = activeComps.reduce((sum, cId) => {
                                const key = `${selectedClassId}_${sub.id}_${cId}`
                                return sum + (componentLimits[key]?.max_ca ?? 40)
                              }, 0)

                              const totalComponentExam = activeComps.reduce((sum, cId) => {
                                const key = `${selectedClassId}_${sub.id}_${cId}`
                                return sum + (componentLimits[key]?.max_exam ?? 60)
                              }, 0)

                              const totalComponentScore = totalComponentCA + totalComponentExam
                              const parentMaxScore = maxScore

                              return (
                                <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10 border-b border-zinc-150 dark:border-zinc-850">
                                  <TableCell />
                                  <TableCell colSpan={5} className="py-3 px-4">
                                    <div className="space-y-3 max-w-2xl">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                                        Sub-components for this class:
                                      </span>
                                      
                                      <div className="border border-zinc-200/80 dark:border-zinc-850 rounded-lg overflow-hidden bg-white dark:bg-zinc-950 shadow-2xs">
                                        <Table>
                                          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60">
                                            <TableRow className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                                              <TableHead className="py-2 px-3 text-left">Component Name</TableHead>
                                              <TableHead className="w-28 py-2 px-3 text-center">Max CA</TableHead>
                                              <TableHead className="w-28 py-2 px-3 text-center">Max Exam</TableHead>
                                              <TableHead className="w-40 py-2 px-3 text-center">Total CAs</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {sub.subject_components.map((comp: any) => {
                                              const compChecked = activeComps.includes(comp.id)
                                              const key = `${selectedClassId}_${sub.id}_${comp.id}`
                                              const limits = componentLimits[key] || { max_ca: 40, max_exam: 60, ca_count: 2 }

                                              return (
                                                <TableRow key={comp.id} className={cn("border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 text-xs", !compChecked && "opacity-60")}>
                                                  <TableCell className="py-2 px-3">
                                                    <label className="flex items-center gap-2.5 font-bold text-foreground cursor-pointer select-none">
                                                      <Checkbox 
                                                        checked={compChecked}
                                                        onCheckedChange={(checked) => handleToggleComponent(sub.id, comp.id, !!checked)}
                                                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
                                                      />
                                                      <span>{comp.name}</span>
                                                    </label>
                                                  </TableCell>

                                                  <TableCell className="py-1.5 px-3 text-center">
                                                    <Input
                                                      type="number"
                                                      disabled={!compChecked}
                                                      value={limits.max_ca}
                                                      onChange={(e) => {
                                                        const newVal = Number(e.target.value)
                                                        setComponentLimits(prev => ({
                                                          ...prev,
                                                          [key]: { ...prev[key], max_ca: newVal }
                                                        }))
                                                      }}
                                                      onBlur={async () => {
                                                        const currentLimits = componentLimits[key] || { max_ca: 40, max_exam: 60, ca_count: 2 }
                                                        try {
                                                          await updateClassComponentLimits(selectedClassId, sub.id, comp.id, currentLimits.max_ca, currentLimits.max_exam, currentLimits.ca_count ?? 2)
                                                          toast.success(`${comp.name} limits updated`)
                                                        } catch (e: any) {
                                                          toast.error(e.message || "Failed to update component limits")
                                                        }
                                                      }}
                                                      className="h-8 text-xs font-bold text-center font-mono w-20 border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-800 rounded-lg bg-blue-50/5 dark:bg-zinc-900 mx-auto"
                                                    />
                                                  </TableCell>

                                                  <TableCell className="py-1.5 px-3 text-center">
                                                    <Input
                                                      type="number"
                                                      disabled={!compChecked}
                                                      value={limits.max_exam}
                                                      onChange={(e) => {
                                                        const newVal = Number(e.target.value)
                                                        setComponentLimits(prev => ({
                                                          ...prev,
                                                          [key]: { ...prev[key], max_exam: newVal }
                                                        }))
                                                      }}
                                                      onBlur={async () => {
                                                        const currentLimits = componentLimits[key] || { max_ca: 40, max_exam: 60, ca_count: 2 }
                                                        try {
                                                          await updateClassComponentLimits(selectedClassId, sub.id, comp.id, currentLimits.max_ca, currentLimits.max_exam, currentLimits.ca_count ?? 2)
                                                          toast.success(`${comp.name} limits updated`)
                                                        } catch (e: any) {
                                                          toast.error(e.message || "Failed to update component limits")
                                                        }
                                                      }}
                                                      className="h-8 text-xs font-bold text-center font-mono w-20 border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-800 rounded-lg bg-blue-50/5 dark:bg-zinc-900 mx-auto"
                                                    />
                                                  </TableCell>

                                                  <TableCell className="py-1.5 px-3">
                                                    <div className="flex items-center justify-center gap-4">
                                                      <label className={cn("flex items-center gap-1.5 cursor-pointer text-xs font-semibold", !compChecked && "pointer-events-none")}>
                                                        <Checkbox
                                                          checked={limits.ca_count === 1}
                                                          onCheckedChange={async () => {
                                                            if (!compChecked) return
                                                            setComponentLimits(prev => ({
                                                              ...prev,
                                                              [key]: { ...prev[key], ca_count: 1 }
                                                            }))
                                                            try {
                                                              await updateClassComponentLimits(selectedClassId, sub.id, comp.id, limits.max_ca, limits.max_exam, 1)
                                                              toast.success(`${comp.name} CA count updated to 1`)
                                                            } catch (err: any) {
                                                              toast.error(err.message || "Failed to update component CA count")
                                                            }
                                                          }}
                                                          disabled={!compChecked}
                                                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
                                                        />
                                                        <span>1</span>
                                                      </label>
                                                      <label className={cn("flex items-center gap-1.5 cursor-pointer text-xs font-semibold", !compChecked && "pointer-events-none")}>
                                                        <Checkbox
                                                          checked={limits.ca_count !== 1} // defaults to 2
                                                          onCheckedChange={async () => {
                                                            if (!compChecked) return
                                                            setComponentLimits(prev => ({
                                                              ...prev,
                                                              [key]: { ...prev[key], ca_count: 2 }
                                                            }))
                                                            try {
                                                              await updateClassComponentLimits(selectedClassId, sub.id, comp.id, limits.max_ca, limits.max_exam, 2)
                                                              toast.success(`${comp.name} CA count updated to 2`)
                                                            } catch (err: any) {
                                                              toast.error(err.message || "Failed to update component CA count")
                                                            }
                                                          }}
                                                          disabled={!compChecked}
                                                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
                                                        />
                                                        <span>2</span>
                                                      </label>
                                                    </div>
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            })}
                                          </TableBody>
                                        </Table>
                                        
                                        {/* Validation Bar */}
                                        <div className="flex items-center justify-between text-xs py-2.5 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800">
                                          <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                                            <span>Sub-component Max Sum:</span>
                                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-foreground">{totalComponentCA} (CA) + {totalComponentExam} (Exam) = {totalComponentScore}</span>
                                          </div>
                                          {totalComponentScore === parentMaxScore ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                              <Check className="h-4 w-4 stroke-[3px]" /> Match parent max ({parentMaxScore})
                                            </span>
                                          ) : (
                                            <span className="text-amber-600 dark:text-amber-400 font-black flex items-center gap-1 animate-pulse">
                                              <AlertTriangle className="h-4 w-4 shrink-0" /> Mismatch (Parent: {parentMaxScore})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })()}
                          </Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* TAB 3: Behavior Domains */}
        <TabsContent value="behavior" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Affective Domain Card */}
            <Card className="border border-zinc-150 dark:border-zinc-850 shadow-sm">
              <CardHeader className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-650" />
                  <div>
                    <CardTitle className="text-sm font-bold">Affective Domain</CardTitle>
                    <CardDescription className="text-[10px]">Aesthetic character evaluation keys (e.g. neatness, punctuality)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="New Affective trait key..."
                    value={newBehaviorName}
                    onChange={(e) => setNewBehaviorName(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-zinc-950"
                    disabled={behaviorLoading}
                  />
                  <Button 
                    onClick={() => handleAddBehavior("affective")}
                    disabled={behaviorLoading || !newBehaviorName.trim()}
                    className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-shrink-0"
                  >
                    Add Key
                  </Button>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/10 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {behaviorCategories
                    .filter((cat) => cat.type === "affective")
                    .map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 text-xs bg-white dark:bg-zinc-950">
                        <div className="flex items-center gap-2">
                          <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-bold">{cat.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => confirmDeleteBehavior(cat.id, cat.name)}
                          className="h-6 w-6 p-0 hover:bg-red-500/10 rounded-md"
                          disabled={behaviorLoading}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  {behaviorCategories.filter((cat) => cat.type === "affective").length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground">No affective traits registered</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Psychomotor Domain Card */}
            <Card className="border border-zinc-150 dark:border-zinc-850 shadow-sm">
              <CardHeader className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-650" />
                  <div>
                    <CardTitle className="text-sm font-bold">Psychomotor Domain</CardTitle>
                    <CardDescription className="text-[10px]">Physical dexterity/skills traits keys (e.g. handwriting, sports)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="New Psychomotor trait key..."
                    value={newBehaviorName}
                    onChange={(e) => setNewBehaviorName(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-zinc-950"
                    disabled={behaviorLoading}
                  />
                  <Button 
                    onClick={() => handleAddBehavior("psychomotor")}
                    disabled={behaviorLoading || !newBehaviorName.trim()}
                    className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-shrink-0"
                  >
                    Add Key
                  </Button>
                </div>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/10 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {behaviorCategories
                    .filter((cat) => cat.type === "psychomotor")
                    .map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 text-xs bg-white dark:bg-zinc-950">
                        <div className="flex items-center gap-2">
                          <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-bold">{cat.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => confirmDeleteBehavior(cat.id, cat.name)}
                          className="h-6 w-6 p-0 hover:bg-red-500/10 rounded-md"
                          disabled={behaviorLoading}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  {behaviorCategories.filter((cat) => cat.type === "psychomotor").length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground">No psychomotor traits registered</div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* TAB 4: Grading Scheme (Refreshed UI matching wireframe) */}
        <TabsContent value="grading" className="space-y-4">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
            <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Grading Scheme</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Define grade ranges and their corresponding letter grades</p>
              </div>
              <Dialog open={gradingOpen} onOpenChange={(o) => {
                setGradingOpen(o)
                if (!o) setEditingGrade(null)
              }}>
                <DialogTrigger asChild>
                  <Button className="h-8.5 gap-1.5 text-xs font-bold bg-black hover:bg-black/90 text-white rounded-lg">
                    <Plus className="h-4 w-4" /> Add Grade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black rounded-2xl">
                  <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
                    <DialogTitle className="text-base font-bold">{editingGrade ? "Edit Grade Definition" : "Add Grade Scale"}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Define the score limits and remarks for this grade boundary.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveGrade} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="grade_letter" className="text-xs font-semibold">Grade Letter</Label>
                        <Input 
                          id="grade_letter"
                          maxLength={2}
                          placeholder="e.g. A, B+"
                          value={newGradeLetter}
                          onChange={(e) => setNewGradeLetter(e.target.value)}
                          required
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="grade_remark" className="text-xs font-semibold">Remark</Label>
                        <Input 
                          id="grade_remark"
                          placeholder="e.g. Excellent, Good"
                          value={newGradeRemark}
                          onChange={(e) => setNewGradeRemark(e.target.value)}
                          required
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="grade_min" className="text-xs font-semibold">Min Score (%)</Label>
                        <Input 
                          id="grade_min"
                          type="number"
                          min={0}
                          max={100}
                          placeholder="e.g. 75"
                          value={newGradeMin}
                          onChange={(e) => setNewGradeMin(e.target.value)}
                          required
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="grade_max" className="text-xs font-semibold">Max Score (%)</Label>
                        <Input 
                          id="grade_max"
                          type="number"
                          min={0}
                          max={100}
                          placeholder="e.g. 100"
                          value={newGradeMax}
                          onChange={(e) => setNewGradeMax(e.target.value)}
                          required
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 gap-2 -mx-5 -mb-5 p-4">
                      <Button type="button" variant="outline" onClick={() => setGradingOpen(false)} className="h-9 text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                        {editingGrade ? "Save Changes" : "Create Grade"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="max-h-[calc(100vh-320px)] min-h-[380px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
                  <TableRow className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                    <TableHead className="w-24 h-10 pl-6">Grade</TableHead>
                    <TableHead className="h-10">Score Range</TableHead>
                    <TableHead className="h-10">Remark</TableHead>
                    <TableHead className="h-10">Status</TableHead>
                    <TableHead className="text-right h-10 pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradingSchemes.map((scheme) => (
                    <TableRow key={scheme.id} className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/30 text-xs transition-colors">
                      <TableCell className="py-3 pl-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white font-bold text-xs select-none">
                          {scheme.grade}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {scheme.min_score} - {scheme.max_score}%
                      </TableCell>
                      <TableCell className="py-3 text-zinc-500 dark:text-zinc-400 font-medium">
                        {scheme.remark}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={scheme.is_active ? "default" : "secondary"} className={cn("text-[10px] font-bold rounded-full px-2 py-0.5", scheme.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300/40" : "bg-zinc-100 text-zinc-600")}>
                          {scheme.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-3 pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditGrade(scheme)}
                            className="h-7 w-7 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => confirmDeleteGrade(scheme.id, scheme.grade)}
                            className="h-7 w-7 p-0 hover:bg-red-500/10 rounded-md"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {gradingSchemes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground italic">
                        No grading metrics defined. Click "+ Add Grade" to setup boundaries.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sleek Custom Delete Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl">
          <div className="p-5 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {confirmDialog.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {confirmDialog.description}
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-150 dark:border-zinc-800 gap-2 flex flex-row justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              className="h-8 text-xs flex-1 font-medium"
            >
              Cancel
            </Button>
            <Button
              className="h-8 text-xs flex-1 font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              onClick={async () => {
                const action = confirmDialog.onConfirm
                setConfirmDialog(prev => ({ ...prev, open: false }))
                await action()
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
