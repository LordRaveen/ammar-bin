"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { IconPlus } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
}

export function AddClassModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
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

    if (sectionsData) setSections(sectionsData)

    // Fetch teachers
    const { data: teachersData } = await supabase
      .from("teachers")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .order("first_name")

    if (teachersData) setTeachers(teachersData)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await createClass(formData)

      if (result.error) {
        alert(result.error)
        return
      }

      setOpen(false)
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Add a new class to your school system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Class 1, Raudah"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section_id">Section *</Label>
            <Select name="section_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity *</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              placeholder="e.g., 30"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="class_teacher_id">Class Teacher (Optional)</Label>
            <Select name="class_teacher_id">
              <SelectTrigger>
                <SelectValue placeholder="Select teacher (optional)" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
