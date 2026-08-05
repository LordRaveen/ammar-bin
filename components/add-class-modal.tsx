"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { createClass } from "@/app/(dashboard)/classes/actions"

interface Section {
  id: string
  name: string
}

interface Teacher {
  id: string
  first_name: string
  last_name: string
  staff_id?: string
}

export function AddClassModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string>("")
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [teacherSearch, setTeacherSearch] = useState("")
  const [teacherPickerOpen, setTeacherPickerOpen] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  async function fetchData() {
    // Fetch sections
    const { data: sectionsData } = await supabase
      .from("sections")
      .select("id, name")
      .eq("is_active", true)
      .order("name")

    if (sectionsData) {
      setSections(sectionsData)
      if (sectionsData.length > 0 && !selectedSectionId) {
        setSelectedSectionId(sectionsData[0].id)
      }
    }

    // Fetch teachers (using ilike for status to handle active/Active robustly)
    const { data: teachersData } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, staff_id")
      .ilike("status", "active")
      .order("first_name")

    if (teachersData) setTeachers(teachersData)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSectionId) {
      alert("Please select a section")
      return
    }
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set("section_id", selectedSectionId)
      formData.set("class_teacher_id", selectedTeacher?.id || "")

      const result = await createClass(formData)

      if (result.error) {
        alert(result.error)
        return
      }

      setOpen(false)
      setSelectedTeacher(null)
      setTeacherSearch("")
      router.refresh()
      
      // Reset form
      e.currentTarget.reset()
    } catch (error) {
      console.error("[v0] Error creating class:", error)
      alert("Failed to create class. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filteredTeachers = teachers.filter((t) => {
    const fullName = `${t.first_name} ${t.last_name}`.toLowerCase()
    const staffId = (t.staff_id || "").toLowerCase()
    const query = teacherSearch.toLowerCase()
    return fullName.includes(query) || staffId.includes(query)
  })

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-9 font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all">
            <IconPlus className="h-4 w-4 mr-1.5" />
            Add Class
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Create New Class</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new class to your school academic structure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Class Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Class Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Class 1, Raudah"
                required
                className="h-9 text-xs bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 font-medium"
              />
            </div>

            {/* Section Selection Pills */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Section *
              </Label>
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => {
                  const isSelected = selectedSectionId === section.id
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setSelectedSectionId(section.id)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-zinc-50/50 dark:bg-zinc-900/10 text-muted-foreground border-zinc-200/80 dark:border-zinc-800/80 hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                      )}
                    >
                      {section.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-1">
              <Label htmlFor="capacity" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Capacity *
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                placeholder="e.g., 30"
                min="1"
                required
                className="h-9 text-xs bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 font-medium"
              />
            </div>

            {/* Class Teacher (Search Modal Reuse Trigger) */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Class Teacher (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeacherPickerOpen(true)}
                  className="flex-1 flex items-center justify-between px-3 h-9 text-xs bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 text-left font-medium transition-all"
                >
                  <span className={selectedTeacher ? "text-foreground font-semibold" : "text-muted-foreground"}>
                    {selectedTeacher
                      ? `${selectedTeacher.first_name} ${selectedTeacher.last_name} (${selectedTeacher.staff_id || "No ID"})`
                      : "Select teacher..."}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                    {selectedTeacher ? "Change" : "Browse"}
                  </span>
                </button>
                {selectedTeacher && (
                  <button
                    type="button"
                    onClick={() => setSelectedTeacher(null)}
                    className="px-3.5 h-9 text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="h-9 text-xs font-bold px-4"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="h-9 text-xs font-bold px-5 bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reuse select teacher modal layout */}
      <Dialog open={teacherPickerOpen} onOpenChange={setTeacherPickerOpen}>
        <DialogContent className="max-w-md p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Assign Class Teacher</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign a teacher to lead this classroom
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search teachers by name..."
                className="pl-9 h-9 text-xs bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-200/80 dark:border-zinc-800/80 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[240px] overflow-y-auto border border-zinc-100 dark:border-zinc-800/80 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 bg-background/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredTeachers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">No teachers match your search</p>
              ) : (
                filteredTeachers.map((t) => {
                  const isSelected = selectedTeacher?.id === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeacher(t)
                        setTeacherPickerOpen(false)
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer",
                        isSelected ? "bg-emerald-500/5 font-bold" : ""
                      )}
                    >
                      <div className="flex flex-col">
                        <span className={isSelected ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-foreground"}>
                          {t.first_name} {t.last_name}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{t.staff_id || "—"}</span>
                      </div>
                      
                      {isSelected && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-950 text-[9px] px-1.5 py-0 h-4 font-semibold">
                          Selected
                        </Badge>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
