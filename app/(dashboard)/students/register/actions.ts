"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { devLog } from "@/lib/logger";

export async function registerStudent(formData: FormData) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get school settings for student ID prefix
    const { data: settings } = await supabase
      .from("school_settings")
      .select("student_id_prefix")
      .single();

    // Get current year
    const year = new Date().getFullYear();

    // Count students to generate next ID
    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    const studentNumber = String((count || 0) + 1).padStart(3, '0');
    const studentId = `${settings?.student_id_prefix || 'ISM'}/${year}/${studentNumber}`;

    const studentData = {
      student_id: studentId,
      first_name: formData.get("first_name") as string,
      middle_name: formData.get("middle_name") as string || null,
      last_name: formData.get("last_name") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      gender: formData.get("gender") as string,
      address: formData.get("address") as string,
      state_of_origin: formData.get("state_of_origin") as string || null,
      nationality: formData.get("nationality") as string || 'Nigerian',
      medical_info: formData.get("medical_info") as string || null,
      admission_date: formData.get("admission_date") as string || new Date().toISOString().split('T')[0],
      status: 'Active',
    };

    devLog.debug("Registering student:", studentData);

    // Insert student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert(studentData)
      .select()
      .single();

    if (studentError) {
      devLog.error("Failed to register student:", studentError);
      throw studentError;
    }

    // Link to guardian if provided
    const guardianId = formData.get("guardian_id") as string;
    const relationship = formData.get("relationship") as string;

    if (guardianId && relationship) {
      const { error: linkError } = await supabase
        .from("student_guardians")
        .insert({
          student_id: student.id,
          guardian_id: guardianId,
          relationship: relationship,
          is_primary: true,
        });

      if (linkError) {
        devLog.error("Failed to link guardian:", linkError);
        // Don't throw - student is created, just log the error
      }
    }

    devLog.info("Student registered successfully:", student.student_id);
    revalidatePath("/students");
    
    redirect(`/students/${student.id}`);
  } catch (error) {
    devLog.error("Error in registerStudent:", error);
    throw error;
  }
}
