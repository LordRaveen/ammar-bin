"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";
import { devLog } from "@/lib/logger";

export async function addTeacher(formData: FormData) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get school settings for staff ID prefix
    const { data: settings } = await supabase
      .from("school_settings")
      .select("staff_id_prefix")
      .single();

    // Get current year
    const year = new Date().getFullYear();

    // Count teachers to generate next ID
    const { count } = await supabase
      .from("teachers")
      .select("*", { count: "exact", head: true });

    const staffNumber = String((count || 0) + 1).padStart(3, '0');
    const staffId = `${settings?.staff_id_prefix || 'STAFF'}/${year}/${staffNumber}`;

    const email = formData.get("email") as string;
    const createAccount = formData.get("create_account") === "on";
    let userId: string | null = null;

    if (createAccount) {
      const tempPassword = `${staffId.replace(/\//g, '')}@Temp`;

      devLog.debug("Creating auth user for:", email);

      // Create admin client with service role key
      const adminClient = createAdminClient();
      
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        devLog.error("Failed to create auth user:", authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      userId = authData.user.id;

      // Create user role
      const userRole = formData.get("user_role") as string;
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: userRole,
          is_active: true,
        });

      if (roleError) {
        devLog.error("Failed to create user role:", roleError);
        // Don't throw - we can fix this manually later
      }

      devLog.info(`User account created. Email: ${email}, Temp Password: ${tempPassword}`);
      // In production, this should send an email instead of logging
    }

    const teacherData = {
      user_id: userId,
      staff_id: staffId,
      first_name: formData.get("first_name") as string,
      middle_name: formData.get("middle_name") as string || null,
      last_name: formData.get("last_name") as string,
      email: email,
      phone: formData.get("phone") as string,
      gender: formData.get("gender") as string,
      date_of_birth: formData.get("date_of_birth") as string || null,
      address: formData.get("address") as string || null,
      qualification: formData.get("qualification") as string || null,
      specialization: formData.get("specialization") as string || null,
      employment_date: formData.get("employment_date") as string || new Date().toISOString().split('T')[0],
      employment_type: formData.get("employment_type") as string,
      role: formData.get("role") as string,
      status: 'Active',
    };

    devLog.debug("Creating teacher record:", teacherData);

    // Insert teacher
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .insert(teacherData)
      .select()
      .single();

    if (teacherError) {
      devLog.error("Failed to create teacher:", teacherError);
      throw teacherError;
    }

    devLog.info("Teacher created successfully:", teacher.staff_id);
    
    revalidatePath("/teachers");
    return { success: true, teacher };
  } catch (error) {
    devLog.error("Error in addTeacher:", error);
    throw error;
  }
}
