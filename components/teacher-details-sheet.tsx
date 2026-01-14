"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Loader2, Mail, Phone, MapPin, Briefcase, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface TeacherDetailsSheetProps {
  teacherId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeacherDetailsSheet({ teacherId, open, onOpenChange }: TeacherDetailsSheetProps) {
  const [teacher, setTeacher] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [assignClassModalOpen, setAssignClassModalOpen] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<any[]>([])

  useEffect(() => {
    async function fetchTeacher() {
      if (!teacherId || !open) {
        setTeacher(null)
        return
      }

      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("teachers")
        .select(`
          *,
          teacher_class_assignments(
            class:classes(
              id,
              name,
              section:sections(name)
            )
          )
        `)
        .eq("id", teacherId)
        .single()

      const { data: allClasses } = await supabase
        .from("classes")
        .select("id, name, section:sections(name)")
        .eq("is_active", true)

      if (data && allClasses) {
        const assignedClassIds = data.teacher_class_assignments?.map((a: any) => a.class?.id) || []
        const unassignedClasses = allClasses.filter((c: any) => !assignedClassIds.includes(c.id))
        setAvailableClasses(unassignedClasses)
      }

      if (!error && data) {
        setTeacher(data)
      }
      setLoading(false)
    }

    fetchTeacher()
  }, [teacherId, open])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>Teacher Details</SheetTitle>
            <SheetDescription>View teacher information and assigned classes</SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12 px-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : teacher ? (
            <div className="px-6 pb-6 space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(teacher.first_name, teacher.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-xl font-bold">
                      {teacher.first_name} {teacher.last_name}
                    </h2>
                    <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>{teacher.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{teacher.staff_id}</p>
                  <Badge variant="outline" className="font-medium">
                    {teacher.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{teacher.phone}</p>
                    </div>
                  </div>
                  {teacher.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{teacher.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {teacher.qualification && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Qualification</p>
                        <p className="font-medium">{teacher.qualification}</p>
                      </div>
                    </div>
                  )}
                  {teacher.date_of_joining && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Joining</p>
                        <p className="font-medium">{new Date(teacher.date_of_joining).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Assigned Classes</h3>
                {teacher.teacher_class_assignments && teacher.teacher_class_assignments.length > 0 ? (
                  <div className="space-y-2">
                    {teacher.teacher_class_assignments.map((assignment: any, index: number) => (
                      <div key={index} className="p-3 rounded-lg border bg-muted/50">
                        <p className="font-medium">
                          {assignment.class?.name}
                          {assignment.class?.section?.name && ` - ${assignment.class.section.name}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No classes assigned yet</p>
                )}
                <Button onClick={() => setAssignClassModalOpen(true)} size="sm" className="mt-4">
                  Assign Class
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {teacher && (
        <Dialog open={assignClassModalOpen} onOpenChange={setAssignClassModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Classes</DialogTitle>
              <DialogDescription>Select a class to assign to {teacher.first_name}</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const selectedClassElement = (e.target as HTMLFormElement).querySelector(
                  'input[name="classId"]:checked',
                ) as HTMLInputElement
                if (!selectedClassElement) return

                try {
                  const { assignClassTeacher } = await import("@/app/(dashboard)/classes/[id]/actions")
                  await assignClassTeacher(selectedClassElement.value, teacher.id, "default")
                  setAssignClassModalOpen(false)
                  window.location.reload()
                } catch (error) {
                  console.error("Failed to assign class:", error)
                  alert("Failed to assign class")
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-3">
                {availableClasses.length > 0 ? (
                  availableClasses.map((cls: any) => (
                    <label
                      key={cls.id}
                      className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent"
                    >
                      <input type="radio" name="classId" value={cls.id} required />
                      <span>
                        {cls.name} {cls.section?.name && `- ${cls.section.name}`}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No available classes to assign</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAssignClassModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={availableClasses.length === 0}>
                  Assign Class
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
