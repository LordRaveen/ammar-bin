"use client"

import { requireAdmin } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { IconUsers, IconBook } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddClassModal } from "@/components/add-class-modal"
import { AddSectionModal } from "@/components/add-section-modal"
import { AssignTeacherClientWrapper } from "@/components/assign-teacher-modal-client"

export const dynamic = "force-dynamic"

interface Class {
  id: string
  name: string
  capacity: number
  is_active: boolean
  section_id: string
  class_teacher_id: string | null
  section: {
    id: string
    name: string
  }
  teacher?: {
    id: string
    first_name: string
    last_name: string
  }
  student_count: number
  subject_count: number
}

interface Section {
  id: string
  name: string
  classes: Class[]
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { search?: string; section?: string }
}) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: sectionsData, error: sectionsError } = await supabase
    .from("sections")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (sectionsError) {
    console.error("Error fetching sections:", sectionsError)
  }

  const { data: classesData, error: classesError } = await supabase
    .from("classes")
    .select(`
      *,
      section:sections(id, name)
    `)
    .eq("is_active", true)
    .order("name")

  if (classesError) {
    console.error("Error fetching classes:", classesError)
  }

  const teacherIds = (classesData?.map((c) => c.class_teacher_id).filter(Boolean) as string[]) || []

  const teachersMap = new Map()
  if (teacherIds.length > 0) {
    const { data: teachersData } = await supabase
      .from("teachers")
      .select("id, first_name, last_name")
      .in("id", teacherIds)

    teachersData?.forEach((t) => teachersMap.set(t.id, t))
  }

  const studentCounts = new Map<string, number>()
  const { data: enrollmentsData } = await supabase.from("student_enrollments").select("class_id").eq("is_active", true)

  enrollmentsData?.forEach((e) => {
    studentCounts.set(e.class_id, (studentCounts.get(e.class_id) || 0) + 1)
  })

  const subjectCounts = new Map<string, number>()
  const { data: subjectsData } = await supabase.from("class_subjects").select("class_id")

  subjectsData?.forEach((s) => {
    subjectCounts.set(s.class_id, (subjectCounts.get(s.class_id) || 0) + 1)
  })

  const sections: Section[] =
    sectionsData?.map((section) => ({
      ...section,
      classes:
        classesData
          ?.filter((c) => c.section_id === section.id)
          .map((c) => ({
            ...c,
            teacher: c.class_teacher_id ? teachersMap.get(c.class_teacher_id) : undefined,
            student_count: studentCounts.get(c.id) || 0,
            subject_count: subjectCounts.get(c.id) || 0,
          })) || [],
    })) || []

  const filteredSections = searchParams.search
    ? sections
        .map((section) => ({
          ...section,
          classes: section.classes.filter((c) => c.name.toLowerCase().includes(searchParams.search!.toLowerCase())),
        }))
        .filter((section) => section.classes.length > 0)
    : sections

  const defaultSection = searchParams.section || filteredSections[0]?.id || ""

  const { data: teachersDataForModal } = await supabase
    .from("teachers")
    .select("id, first_name, middle_name, last_name, email")
    .eq("status", "Active")
    .order("first_name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">Manage all classes across sections</p>
        </div>
        <div className="flex gap-2">
          <AddSectionModal />
          <AddClassModal />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-sm">
          <Input name="search" placeholder="Search classes..." defaultValue={searchParams.search} className="w-full" />
        </form>
      </div>

      {filteredSections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchParams.search
            ? "No classes found matching your search."
            : "No sections available. Create a section first to get started."}
        </div>
      ) : (
        <Tabs defaultValue={defaultSection} className="space-y-6">
          <TabsList>
            {filteredSections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.name} ({section.classes.length})
              </TabsTrigger>
            ))}
          </TabsList>

          {filteredSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-4">
              {section.classes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No classes in {section.name} section yet. Add a class to get started.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.classes.map((classItem) => (
                    <div key={classItem.id} className="group">
                      <Link href={`/classes/${classItem.id}`}>
                        <Card className="hover:border-primary transition-colors cursor-pointer h-full flex flex-col">
                          <CardContent className="p-6 flex flex-col flex-1">
                            <div className="space-y-4 flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg">{classItem.name}</h3>
                                  {classItem.teacher ? (
                                    <p className="text-muted-foreground text-sm">
                                      {classItem.teacher.first_name} {classItem.teacher.last_name}
                                    </p>
                                  ) : (
                                    <p className="text-muted-foreground text-sm italic">No teacher assigned</p>
                                  )}
                                </div>
                                <Badge variant="default" className="bg-green-500">
                                  Active
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <IconUsers className="h-4 w-4" />
                                  <span>Students: {classItem.student_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <IconBook className="h-4 w-4" />
                                  <span>Subjects: {classItem.subject_count}</span>
                                </div>
                              </div>
                            </div>

                            {!classItem.teacher && (
                              <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                                <AssignTeacherClientWrapper
                                  classId={classItem.id}
                                  sessionId="default"
                                  teachers={teachersDataForModal || []}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
