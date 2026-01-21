"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Search } from "lucide-react"

interface LinkGuardianModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  onGuardianLinked: () => void
}

export function LinkGuardianModal({
  open,
  onOpenChange,
  studentId,
  onGuardianLinked,
}: LinkGuardianModalProps) {
  const [guardians, setGuardians] = useState<any[]>([])
  const [filteredGuardians, setFilteredGuardians] = useState<any[]>([])
  const [selectedGuardianId, setSelectedGuardianId] = useState("")
  const [relationship, setRelationship] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (open) {
      fetchGuardians()
    }
  }, [open])

  useEffect(() => {
    if (searchTerm) {
      const filtered = guardians.filter(
        g =>
          `${g.first_name} ${g.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.phone && g.phone.includes(searchTerm))
      )
      setFilteredGuardians(filtered)
    } else {
      setFilteredGuardians(guardians)
    }
  }, [searchTerm, guardians])

  const fetchGuardians = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("guardians")
        .select("*")
        .is("deleted_at", null)
        .order("first_name", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching guardians:", error)
        toast.error("Failed to load guardians")
        return
      }

      setGuardians(data || [])
    } catch (error) {
      console.error("[v0] Error fetching guardians:", error)
      toast.error("Error loading guardians")
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async () => {
    if (!selectedGuardianId || !relationship) {
      toast.error("Please select a guardian and relationship")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("student_guardians")
        .insert({
          student_id: studentId,
          guardian_id: selectedGuardianId,
          relationship,
          is_primary: false,
        })

      if (error) {
        console.error("[v0] Error linking guardian:", error)
        toast.error("Failed to link guardian")
        return
      }

      toast.success("Guardian linked successfully")
      onOpenChange(false)
      onGuardianLinked()
      
      // Reset form
      setSelectedGuardianId("")
      setRelationship("")
      setSearchTerm("")
    } catch (error) {
      console.error("[v0] Error linking guardian:", error)
      toast.error("Error linking guardian")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Guardian</DialogTitle>
          <DialogDescription>
            Select an existing guardian and their relationship to the student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Guardian</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Name or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Guardian Selection */}
          <div className="space-y-2">
            <Label htmlFor="guardian">Guardian</Label>
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Loading guardians...
              </div>
            ) : filteredGuardians.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No guardians found
              </div>
            ) : (
              <Select value={selectedGuardianId} onValueChange={setSelectedGuardianId}>
                <SelectTrigger id="guardian">
                  <SelectValue placeholder="Select a guardian" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGuardians.map(guardian => (
                    <SelectItem key={guardian.id} value={guardian.id}>
                      {guardian.first_name} {guardian.last_name}
                      {guardian.phone && ` (${guardian.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Relationship Selection */}
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger id="relationship">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Father">Father</SelectItem>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Guardian">Guardian</SelectItem>
                <SelectItem value="Uncle">Uncle</SelectItem>
                <SelectItem value="Aunt">Aunt</SelectItem>
                <SelectItem value="Grandfather">Grandfather</SelectItem>
                <SelectItem value="Grandmother">Grandmother</SelectItem>
                <SelectItem value="Brother">Brother</SelectItem>
                <SelectItem value="Sister">Sister</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={isSubmitting || !selectedGuardianId || !relationship}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link Guardian
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
