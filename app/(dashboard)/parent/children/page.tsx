import { requireAuth } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { ChildrenPageClient } from "@/components/children-page-client"

export const dynamic = "force-dynamic"

export default async function ParentChildrenPage() {
  const user = await requireAuth()

  if (user.role !== "parent") {
    return <div>Access Denied</div>
  }

  const supabase = await createClient()

  // Get guardian record
  const { data: guardian } = await supabase.from("guardians").select("*").eq("user_id", user.id).single()

  if (!guardian) {
    return <div>Guardian record not found</div>
  }

  // Get all children with full details
  const { data: studentGuardians } = await supabase
    .from("student_guardians")
    .select(`
      id,
      relationship,
      is_primary,
      students (
        id,
        student_id,
        first_name,
        middle_name,
        last_name,
        photo_url,
        gender,
        date_of_birth,
        status,
        address,
        nationality,
        state_of_origin,
        admission_date,
        medical_info
      )
    `)
    .eq("guardian_id", guardian.id)

  const children =
    studentGuardians?.map((sg: any) => ({
      ...sg.students,
      relationship: sg.relationship,
      is_primary_guardian: sg.is_primary,
    })) || []

  // Get enrollment info for each child
  const childrenWithDetails = await Promise.all(
    children.map(async (child: any) => {
      // Get current enrollment
      const { data: enrollment } = await supabase
        .from("student_enrollments")
        .select(`
          *,
          sessions (name, is_active),
          terms (name, is_active),
          classes (
            name,
            sections (name),
            class_teacher:teachers (
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .eq("student_id", child.id)
        .eq("is_active", true)
        .maybeSingle()

      // Get enrollment history
      const { data: enrollmentHistory } = await supabase
        .from("student_enrollments")
        .select(`
          *,
          sessions (name),
          terms (name),
          classes (name, sections(name))
        `)
        .eq("student_id", child.id)
        .order("created_at", { ascending: false })

      // Get all guardians for this child
      const { data: allGuardians } = await supabase
        .from("student_guardians")
        .select(`
          relationship,
          is_primary,
          guardians (
            first_name,
            last_name,
            email,
            phone,
            occupation
          )
        `)
        .eq("student_id", child.id)

      return {
        ...child,
        currentEnrollment: enrollment,
        enrollmentHistory: enrollmentHistory || [],
        guardians: allGuardians || [],
      }
    }),
  )

  return <ChildrenPageClient children={childrenWithDetails} />
}
