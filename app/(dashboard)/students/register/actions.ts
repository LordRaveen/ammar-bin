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

    // Get current year
    const year = new Date().getFullYear();

    // Count students to generate next ID
    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    const studentNumber = String((count || 0) + 1).padStart(3, '0');
    
    // Get enrollment_type
    const enrollmentType = (formData.get("enrollment_type") as string || "islamiyya").toLowerCase();
    
    // Choose prefix based on enrollment type
    let prefix = "ABYI/ISL";
    if (enrollmentType === "tahfeez") {
      prefix = "ABYI/TAH";
    } else if (enrollmentType === "combined") {
      prefix = "ABYI/CMB";
    }

    const yearShort = String(year).slice(-2);
    const studentId = `${prefix}/${yearShort}/${studentNumber}`;

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
      enrollment_type: enrollmentType,
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
      }
    }

    // Auto-enroll if class information is provided
    const classId = formData.get("class_id") as string; // Islamiyya class or main class
    const tahfeezClassId = formData.get("tahfeez_class_id") as string; // Tahfeez class for combined

    if (classId || (enrollmentType === "combined" && tahfeezClassId)) {
      // Get active session
      const { data: actSession } = await supabase
        .from("sessions")
        .select("id")
        .eq("is_active", true)
        .single();
      
      const sessionId = actSession?.id;

      if (sessionId) {
        // Get active term
        const { data: actTerm } = await supabase
          .from("terms")
          .select("id")
          .eq("is_active", true)
          .eq("session_id", sessionId)
          .single();
        
        const termId = actTerm?.id || null;

        const enrollmentsToCreate = [];

        if (enrollmentType === "combined") {
          if (classId) {
            enrollmentsToCreate.push({
              student_id: student.id,
              class_id: classId,
              session_id: sessionId,
              term_id: termId,
              is_active: true,
            });
          }
          if (tahfeezClassId) {
            enrollmentsToCreate.push({
              student_id: student.id,
              class_id: tahfeezClassId,
              session_id: sessionId,
              term_id: termId,
              is_active: true,
            });
          }
        } else {
          const selectedClassId = classId || tahfeezClassId;
          if (selectedClassId) {
            enrollmentsToCreate.push({
              student_id: student.id,
              class_id: selectedClassId,
              session_id: sessionId,
              term_id: termId,
              is_active: true,
            });
          }
        }

        if (enrollmentsToCreate.length > 0) {
          const { error: enrollError } = await supabase
            .from("student_enrollments")
            .insert(enrollmentsToCreate);

          if (enrollError) {
            devLog.error("Failed to create student enrollments:", enrollError);
          }
        }
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
