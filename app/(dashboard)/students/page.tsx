import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/get-user";
import { StudentsClientPage } from "@/components/students-client-page";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [
    { data: studentsData },
    { data: guardiansData },
    { data: sessionsData },
    { data: termsData },
    { data: classesData },
  ] = await Promise.all([
    supabase
      .from("students")
      .select(`
        *,
        student_enrollments(
          id,
          is_active,
          class:classes(name, section:sections(name))
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("guardians")
      .select("id, first_name, last_name, phone")
      .order("first_name"),
    supabase.from("sessions").select("*").order("created_at", { ascending: false }),
    supabase.from("terms").select("*").order("term_number"),
    supabase
      .from("classes")
      .select(`
        *,
        section:sections(name)
      `)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <StudentsClientPage
      initialStudents={studentsData || []}
      guardians={guardiansData || []}
      sessions={sessionsData || []}
      terms={termsData || []}
      classes={classesData || []}
    />
  );
}
