"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Search, Users, CheckCircle2, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectGuardianModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "select_only" | "select_with_relationship"
  existingRelation?: {
    id: string
    guardian_id: string
    relationship: string
    is_primary: boolean
  }
  onSelect: (data: {
    guardianId: string
    first_name: string
    last_name: string
    phone?: string
    relationship?: string
    isPrimary?: boolean
    relationId?: string
  }) => void
}

export function SelectGuardianModal({
  open,
  onOpenChange,
  mode = "select_with_relationship",
  existingRelation,
  onSelect,
}: SelectGuardianModalProps) {
  const [guardians, setGuardians] = useState<any[]>([])
  const [filteredGuardians, setFilteredGuardians] = useState<any[]>([])
  const [selectedGuardianId, setSelectedGuardianId] = useState("")
  const [relationship, setRelationship] = useState("Father")
  const [isPrimary, setIsPrimary] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadGuardians() {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("guardians")
        .select(`
          id,
          first_name,
          last_name,
          phone,
          student_guardians (
            id
          )
        `)
        .is("deleted_at", null)
        .order("first_name", { ascending: true })

      if (error) {
        console.error("Error loading guardians:", error)
        toast.error("Failed to load guardians")
      } else {
        setGuardians(data || [])
        setFilteredGuardians(data || [])
      }
      setLoading(false)
    }

    if (open) {
      loadGuardians()
      if (existingRelation) {
        setSelectedGuardianId(existingRelation.guardian_id)
        setRelationship(existingRelation.relationship)
        setIsPrimary(existingRelation.is_primary)
      } else {
        setSelectedGuardianId("")
        setSearchTerm("")
        setRelationship("Father")
        setIsPrimary(true)
      }
    }
  }, [open, existingRelation])

  useEffect(() => {
    if (searchTerm) {
      const filtered = guardians.filter(
        (g) =>
          `${g.first_name} ${g.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.phone && g.phone.includes(searchTerm))
      )
      setFilteredGuardians(filtered)
    } else {
      setFilteredGuardians(guardians)
    }
  }, [searchTerm, guardians])

  const handleConfirm = () => {
    if (!selectedGuardianId) {
      toast.error("Please select a guardian first")
      return
    }

    const selectedGuardian = guardians.find((g) => g.id === selectedGuardianId)
    if (!selectedGuardian) return

    onSelect({
      guardianId: selectedGuardian.id,
      first_name: selectedGuardian.first_name,
      last_name: selectedGuardian.last_name,
      phone: selectedGuardian.phone,
      ...(mode === "select_with_relationship" && {
        relationship,
        isPrimary,
        relationId: existingRelation?.id,
      }),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {existingRelation ? "Edit guardian details" : "Select guardian"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {existingRelation 
                  ? "Change connection credentials or swap selected profile."
                  : "Select an existing guardian and declare relationship details."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Inputs wrapper with padding */}
        <div className="px-5 pt-4 pb-3 space-y-3">
          {/* Search Guardian */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
              disabled={loading}
            />
          </div>

          {/* Relationship inputs if selected */}
          {mode === "select_with_relationship" && (
            <div className="flex items-center justify-between gap-4 pt-1 bg-zinc-50/20 dark:bg-zinc-950/20 p-2 rounded-xl border border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Label htmlFor="relation_select" className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex-shrink-0">Relationship:</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger id="relation_select" className="h-8 w-28 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Father" className="text-xs">Father</SelectItem>
                    <SelectItem value="Mother" className="text-xs">Mother</SelectItem>
                    <SelectItem value="Guardian" className="text-xs">Guardian</SelectItem>
                    <SelectItem value="Uncle" className="text-xs">Uncle</SelectItem>
                    <SelectItem value="Aunt" className="text-xs">Aunt</SelectItem>
                    <SelectItem value="Grandfather" className="text-xs">Grandfather</SelectItem>
                    <SelectItem value="Grandmother" className="text-xs">Grandmother</SelectItem>
                    <SelectItem value="Brother" className="text-xs">Brother</SelectItem>
                    <SelectItem value="Sister" className="text-xs">Sister</SelectItem>
                    <SelectItem value="Other" className="text-xs">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="primary_check"
                  checked={isPrimary}
                  onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
                />
                <Label htmlFor="primary_check" className="text-xs font-semibold cursor-pointer select-none">
                  Set as primary guardian
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* List of Guardians (Stretches full width, no bottom borders/radii, compact rows, no gap to footer) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-xs text-muted-foreground gap-2 border-t border-zinc-150 dark:border-zinc-850 bg-zinc-50/5 dark:bg-zinc-950/5">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span>Fetching guardians database...</span>
          </div>
        ) : filteredGuardians.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-10 bg-zinc-50 dark:bg-zinc-905 rounded-none border-t border-zinc-200 dark:border-zinc-800 border-dashed">
            No matching guardians found.
          </div>
        ) : (
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/10 dark:bg-zinc-900/5 divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[190px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            {filteredGuardians.map((g) => {
              const isSelected = selectedGuardianId === g.id
              const childrenCount = g.student_guardians?.length || 0
              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGuardianId(g.id)}
                  className={cn(
                    "flex items-center justify-between py-2 px-5 cursor-pointer transition-colors text-left",
                    isSelected
                      ? "bg-emerald-500/5 dark:bg-emerald-500/10"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Circular Select Radio */}
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200",
                        isSelected
                          ? "border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white"
                          : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                      )}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {g.first_name} {g.last_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {g.phone || "No phone registered"}
                      </p>
                    </div>
                  </div>

                  {/* Linked students count */}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-zinc-150/50 dark:bg-zinc-900 px-2 py-0.5 rounded-md">
                    <Users className="h-3 w-3 text-emerald-655" />
                    <span className="font-semibold">{childrenCount}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedGuardianId}
            className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Select Guardian</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
