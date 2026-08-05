"use client"

import { useState, useEffect, Fragment } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IconLoader2, IconAlertTriangle, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  assignComponentToClass,
  unassignComponentFromClass,
  updateClassComponentLimits,
  updateClassSubjectLimits,
} from "@/app/(dashboard)/settings/subjects/actions"

interface Subject {
  id: string
  name: string
  code: string
  subject_components: Array<{
    id: string
    name: string
  }>
}

interface ClassSubjectsChecklistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  classNameText: string
  onAssignedSubjectsChanged?: () => void
}

export function ClassSubjectsChecklistModal({
  open,
  onOpenChange,
  classId,
  classNameText,
  onAssignedSubjectsChanged,
}: ClassSubjectsChecklistModalProps) {
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignedSubjects, setAssignedSubjects] = useState<Record<string, any>>({})
  const [assignedComponents, setAssignedComponents] = useState<Record<string, string[]>>({})
  const [componentLimits, setComponentLimits] = useState<Record<string, any>>({})
  const [savingSubjectId, setSavingSubjectId] = useState<string | null>(null)

  const supabase = createBrowserClient()

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, classId])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch subjects
      const { data: subs, error: subsErr } = await supabase
        .from("subjects")
        .select(`
          id,
          name,
          code,
          subject_components(id, name)
        `)
        .eq("is_active", true)
        .order("name")

      if (subsErr) throw subsErr
      setSubjects(subs || [])

      // 2. Fetch class subjects
      const { data: classSubs, error: csErr } = await supabase
        .from("class_subjects")
        .select("*")
        .eq("class_id", classId)

      if (csErr) throw csErr
      const assignedSubsMap: any = {}
      if (classSubs) {
        classSubs.forEach((cs) => {
          assignedSubsMap[cs.subject_id] = {
            id: cs.id,
            max_score: cs.max_score,
            pass_mark: cs.pass_mark,
            ca_count: cs.ca_count || 2,
          }
        })
      }
      setAssignedSubjects(assignedSubsMap)

      // 3. Fetch assigned components
      const { data: classComps, error: ccErr } = await supabase
        .from("class_subject_components")
        .select("*")
        .eq("class_id", classId)

      if (ccErr) throw ccErr
      const assignedCompsMap: Record<string, string[]> = {}
      const limitsMap: Record<string, any> = {}

      if (classComps) {
        classComps.forEach((cc) => {
          if (!assignedCompsMap[cc.subject_id]) {
            assignedCompsMap[cc.subject_id] = []
          }
          assignedCompsMap[cc.subject_id].push(cc.subject_component_id)

          const key = `${classId}_${cc.subject_id}_${cc.subject_component_id}`
          limitsMap[key] = {
            max_ca: cc.max_ca,
            max_exam: cc.max_exam,
            ca_count: cc.ca_count || 2,
          }
        })
      }
      setAssignedComponents(assignedCompsMap)
      setComponentLimits(limitsMap)
    } catch (error) {
      console.error("[v0] Error loading checklist data:", error)
      toast.error("Failed to load checklist data")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSubject = async (subjectId: string, checked: boolean) => {
    // 1. Optimistic UI update
    if (checked) {
      setAssignedSubjects((prev) => ({
        ...prev,
        [subjectId]: { id: "", max_score: 100, pass_mark: 40, ca_count: 2 },
      }))

      // Pre-populate components optimistically
      const targetSub = subjects.find((s) => s.id === subjectId)
      if (targetSub?.subject_components) {
        const compIds = targetSub.subject_components.map((c) => c.id)
        setAssignedComponents((prev) => ({
          ...prev,
          [subjectId]: compIds,
        }))
        compIds.forEach((cid) => {
          const key = `${classId}_${subjectId}_${cid}`
          setComponentLimits((prev) => ({
            ...prev,
            [key]: { max_ca: 40, max_exam: 60, ca_count: 2 },
          }))
        })
      }
    } else {
      setAssignedSubjects((prev) => {
        const next = { ...prev }
        delete next[subjectId]
        return next
      })
      setAssignedComponents((prev) => {
        const next = { ...prev }
        delete next[subjectId]
        return next
      })
    }

    // 2. Database Sync
    try {
      if (checked) {
        // Insert class subject
        const { error } = await supabase
          .from("class_subjects")
          .insert({
            class_id: classId,
            subject_id: subjectId,
            max_score: 100,
            pass_mark: 40,
            ca_count: 2,
          })
        if (error) throw error

        // Auto-assign components
        const targetSub = subjects.find((s) => s.id === subjectId)
        const compIds = targetSub?.subject_components?.map((c) => c.id) || []
        if (compIds.length > 0) {
          const payload = compIds.map((cid) => ({
            class_id: classId,
            subject_id: subjectId,
            subject_component_id: cid,
            max_ca: 40,
            max_exam: 60,
            ca_count: 2,
          }))
          const { error: compErr } = await supabase
            .from("class_subject_components")
            .insert(payload)
          if (compErr) throw compErr
        }
        toast.success("Subject assigned to class")
      } else {
        // Delete class subject
        const { error } = await supabase
          .from("class_subjects")
          .delete()
          .eq("class_id", classId)
          .eq("subject_id", subjectId)
        if (error) throw error

        // Delete components
        await supabase
          .from("class_subject_components")
          .delete()
          .eq("class_id", classId)
          .eq("subject_id", subjectId)
        toast.success("Subject unassigned from class")
      }
      
      if (onAssignedSubjectsChanged) {
        onAssignedSubjectsChanged()
      }
    } catch (e: any) {
      console.error("[v0] Toggle subject failed:", e)
      toast.error(e.message || "Operation failed")
      loadData()
    }
  }

  const handleToggleComponent = async (subjectId: string, componentId: string, checked: boolean) => {
    const key = `${classId}_${subjectId}_${componentId}`
    
    // Optimistic Update
    if (checked) {
      setAssignedComponents((prev) => ({
        ...prev,
        [subjectId]: [...(prev[subjectId] || []), componentId],
      }))
      setComponentLimits((prev) => ({
        ...prev,
        [key]: { max_ca: 40, max_exam: 60, ca_count: 2 },
      }))
    } else {
      setAssignedComponents((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).filter((id) => id !== componentId),
      }))
      setComponentLimits((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }

    try {
      if (checked) {
        await assignComponentToClass(classId, subjectId, componentId)
        toast.success("Component activated")
      } else {
        await unassignComponentFromClass(classId, subjectId, componentId)
        toast.success("Component deactivated")
      }
      if (onAssignedSubjectsChanged) {
        onAssignedSubjectsChanged()
      }
    } catch (e: any) {
      console.error("[v0] Toggle component failed:", e)
      toast.error(e.message || "Failed to update component assignment")
      loadData()
    }
  }

  const handleUpdateAssignmentScores = async (
    subjectId: string,
    maxScore: number,
    passMark: number,
    caCount: number
  ) => {
    setSavingSubjectId(subjectId)
    try {
      await updateClassSubjectLimits(classId, subjectId, maxScore, passMark, caCount)
      toast.success("Score limits saved successfully")
      if (onAssignedSubjectsChanged) {
        onAssignedSubjectsChanged()
      }
    } catch (e: any) {
      console.error("[v0] Save score limits failed:", e)
      toast.error(e.message || "Failed to save score limits")
    } finally {
      setSavingSubjectId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] w-full p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold text-foreground">Class Subjects Checklist</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Active subjects and scoring limits for {classNameText}
            </DialogDescription>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-2">
            <IconLoader2 className="h-6 w-6 animate-spin text-zinc-400" />
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Loading checklist data...
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mt-2 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-850 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Table>
              <TableHeader className="bg-zinc-55 dark:bg-zinc-900/60 sticky top-0 z-10">
                <TableRow className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider">
                  <TableHead className="w-16 text-center">ACTIVE</TableHead>
                  <TableHead>SUBJECT NAME</TableHead>
                  <TableHead className="w-28 text-center">MAX SCORE</TableHead>
                  <TableHead className="w-28 text-center">PASS MARK</TableHead>
                  <TableHead className="w-28 text-center">CA COUNT</TableHead>
                  <TableHead className="text-right pr-5">ACTION</TableHead>
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
                          isAssigned ? "bg-emerald-500/[0.01] hover:bg-emerald-500/[0.02]" : "hover:bg-zinc-50/30"
                        )}
                      >
                        <TableCell className="text-center py-3">
                          <Checkbox
                            checked={isAssigned}
                            onCheckedChange={(checked) => handleToggleSubject(sub.id, !!checked)}
                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4.5 w-4.5 rounded-full"
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <div>
                            <span className="font-bold text-foreground">{sub.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground ml-2">({sub.code})</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Input
                            type="number"
                            value={maxScore}
                            onChange={(e) =>
                              setAssignedSubjects((prev) => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], max_score: Number(e.target.value) },
                              }))
                            }
                            disabled={!isAssigned}
                            className="h-8 text-xs text-center font-mono w-20 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80 rounded-lg mx-auto font-bold"
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <Input
                            type="number"
                            value={passMark}
                            onChange={(e) =>
                              setAssignedSubjects((prev) => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], pass_mark: Number(e.target.value) },
                              }))
                            }
                            disabled={!isAssigned}
                            className="h-8 text-xs text-center font-mono w-20 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80 rounded-lg mx-auto font-bold"
                          />
                        </TableCell>
                        <TableCell className="py-3">
                          <select
                            value={caCount}
                            onChange={(e) => {
                              const newVal = Number(e.target.value)
                              setAssignedSubjects((prev) => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], ca_count: newVal },
                              }))
                            }}
                            disabled={!isAssigned}
                            className="h-8 text-xs text-center font-mono w-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg px-1 mx-auto block font-semibold focus:outline-none"
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
                            className="h-7 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          >
                            {isSaving ? (
                              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Save Limits"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Component Checklist sub-row */}
                      {isAssigned && sub.subject_components?.length > 0 && (() => {
                        const activeComps = assignedComponents[sub.id] || []

                        const totalComponentCA = activeComps.reduce((sum, cId) => {
                          const key = `${classId}_${sub.id}_${cId}`
                          return sum + (componentLimits[key]?.max_ca ?? 40)
                        }, 0)

                        const totalComponentExam = activeComps.reduce((sum, cId) => {
                          const key = `${classId}_${sub.id}_${cId}`
                          return sum + (componentLimits[key]?.max_exam ?? 60)
                        }, 0)

                        const totalComponentScore = totalComponentCA + totalComponentExam

                        return (
                          <TableRow className="bg-zinc-50/20 dark:bg-zinc-900/10 border-b border-zinc-150 dark:border-zinc-850">
                            <TableCell />
                            <TableCell colSpan={5} className="py-3 px-4">
                              <div className="space-y-3 max-w-2xl">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                                  Sub-components for this class:
                                </span>

                                <div className="border border-zinc-200/80 dark:border-zinc-850 rounded-lg overflow-hidden bg-white dark:bg-zinc-950 shadow-2xs">
                                  <Table>
                                    <TableHeader className="bg-zinc-55 dark:bg-zinc-900/60">
                                      <TableRow className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider">
                                        <TableHead className="py-2 px-3 text-left">Component Name</TableHead>
                                        <TableHead className="w-28 py-2 px-3 text-center">Max CA</TableHead>
                                        <TableHead className="w-28 py-2 px-3 text-center">Max Exam</TableHead>
                                        <TableHead className="w-40 py-2 px-3 text-center">Total CAs</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sub.subject_components.map((comp) => {
                                        const compChecked = activeComps.includes(comp.id)
                                        const key = `${classId}_${sub.id}_${comp.id}`
                                        const limits = componentLimits[key] || {
                                          max_ca: 40,
                                          max_exam: 60,
                                          ca_count: 2,
                                        }

                                        return (
                                          <TableRow
                                            key={comp.id}
                                            className={cn(
                                              "border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 text-xs",
                                              !compChecked && "opacity-60"
                                            )}
                                          >
                                            <TableCell className="py-2 px-3">
                                              <label className="flex items-center gap-2.5 font-bold text-foreground cursor-pointer select-none">
                                                <Checkbox
                                                  checked={compChecked}
                                                  onCheckedChange={(checked) =>
                                                    handleToggleComponent(sub.id, comp.id, !!checked)
                                                  }
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
                                                  setComponentLimits((prev) => ({
                                                    ...prev,
                                                    [key]: { ...prev[key], max_ca: newVal },
                                                  }))
                                                }}
                                                onBlur={async () => {
                                                  const currentLimits = componentLimits[key] || {
                                                    max_ca: 40,
                                                    max_exam: 60,
                                                    ca_count: 2,
                                                  }
                                                  try {
                                                    await updateClassComponentLimits(
                                                      classId,
                                                      sub.id,
                                                      comp.id,
                                                      currentLimits.max_ca,
                                                      currentLimits.max_exam,
                                                      currentLimits.ca_count ?? 2
                                                    )
                                                    toast.success(`${comp.name} CA limit updated`)
                                                  } catch (err: any) {
                                                    toast.error(err.message || "Failed to update limits")
                                                  }
                                                }}
                                                className="h-8 text-xs font-bold text-center font-mono w-20 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900 mx-auto"
                                              />
                                            </TableCell>

                                            <TableCell className="py-1.5 px-3 text-center">
                                              <Input
                                                type="number"
                                                disabled={!compChecked}
                                                value={limits.max_exam}
                                                onChange={(e) => {
                                                  const newVal = Number(e.target.value)
                                                  setComponentLimits((prev) => ({
                                                    ...prev,
                                                    [key]: { ...prev[key], max_exam: newVal },
                                                  }))
                                                }}
                                                onBlur={async () => {
                                                  const currentLimits = componentLimits[key] || {
                                                    max_ca: 40,
                                                    max_exam: 60,
                                                    ca_count: 2,
                                                  }
                                                  try {
                                                    await updateClassComponentLimits(
                                                      classId,
                                                      sub.id,
                                                      comp.id,
                                                      currentLimits.max_ca,
                                                      currentLimits.max_exam,
                                                      currentLimits.ca_count ?? 2
                                                    )
                                                    toast.success(`${comp.name} Exam limit updated`)
                                                  } catch (err: any) {
                                                    toast.error(err.message || "Failed to update limits")
                                                  }
                                                }}
                                                className="h-8 text-xs font-bold text-center font-mono w-20 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900 mx-auto"
                                              />
                                            </TableCell>

                                            <TableCell className="py-1.5 px-3">
                                              <div className="flex items-center justify-center gap-4">
                                                <label
                                                  className={cn(
                                                    "flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold",
                                                    !compChecked && "pointer-events-none"
                                                  )}
                                                >
                                                  <Checkbox
                                                    checked={limits.ca_count === 1}
                                                    onCheckedChange={async () => {
                                                      if (!compChecked) return
                                                      setComponentLimits((prev) => ({
                                                        ...prev,
                                                        [key]: { ...prev[key], ca_count: 1 },
                                                      }))
                                                      try {
                                                        await updateClassComponentLimits(
                                                          classId,
                                                          sub.id,
                                                          comp.id,
                                                          limits.max_ca,
                                                          limits.max_exam,
                                                          1
                                                        )
                                                        toast.success(`${comp.name} CA count updated to 1`)
                                                      } catch (err: any) {
                                                        toast.error(err.message || "Failed to update limits")
                                                      }
                                                    }}
                                                    disabled={!compChecked}
                                                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
                                                  />
                                                  <span>1 CA</span>
                                                </label>
                                                <label
                                                  className={cn(
                                                    "flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold",
                                                    !compChecked && "pointer-events-none"
                                                  )}
                                                >
                                                  <Checkbox
                                                    checked={limits.ca_count !== 1}
                                                    onCheckedChange={async () => {
                                                      if (!compChecked) return
                                                      setComponentLimits((prev) => ({
                                                        ...prev,
                                                        [key]: { ...prev[key], ca_count: 2 },
                                                      }))
                                                      try {
                                                        await updateClassComponentLimits(
                                                          classId,
                                                          sub.id,
                                                          comp.id,
                                                          limits.max_ca,
                                                          limits.max_exam,
                                                          2
                                                        )
                                                        toast.success(`${comp.name} CA count updated to 2`)
                                                      } catch (err: any) {
                                                        toast.error(err.message || "Failed to update limits")
                                                      }
                                                    }}
                                                    disabled={!compChecked}
                                                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
                                                  />
                                                  <span>2 CAs</span>
                                                </label>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}
                                    </TableBody>
                                  </Table>

                                  {/* Validation info bar */}
                                  <div className="flex items-center justify-between text-[10px] font-bold py-2 px-3 bg-zinc-55 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <span>Sum limits:</span>
                                      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-foreground">
                                        {totalComponentCA} (CA) + {totalComponentExam} (Exam) = {totalComponentScore}
                                      </span>
                                    </div>
                                    {totalComponentScore === maxScore ? (
                                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <IconCheck className="h-3.5 w-3.5 stroke-[3px]" /> Matches parent ({maxScore})
                                      </span>
                                    ) : (
                                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                                        <IconAlertTriangle className="h-3.5 w-3.5" /> Mismatch (Parent: {maxScore})
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
      </DialogContent>
    </Dialog>
  )
}
