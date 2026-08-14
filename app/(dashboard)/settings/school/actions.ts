"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";
import { devLog } from "@/lib/logger";

export async function updateSchoolSettings(formData: FormData) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const id = formData.get("id") as string;
    const updateData: Record<string, any> = {
      school_name: formData.get("school_name") as string,
      school_name_arabic: formData.get("school_name_arabic") as string,
      address: formData.get("address") as string,
      phone_primary: formData.get("phone_primary") as string,
      phone_secondary: formData.get("phone_secondary") as string,
      email: formData.get("email") as string,
      logo_url: (formData.get("logo_url") as string) || null,
      principal_name: (formData.get("principal_name") as string) || null,
      principal_signature_url: (formData.get("principal_signature_url") as string) || null,
      student_id_prefix: formData.get("student_id_prefix") as string,
      staff_id_prefix: formData.get("staff_id_prefix") as string,
      number_of_terms: parseInt(formData.get("number_of_terms") as string),
    };

    devLog.debug("Updating school settings:", updateData);

    const { error } = await supabase
      .from("school_settings")
      .update(updateData)
      .eq("id", id);

    if (error) {
      devLog.error("Failed to update school settings:", error);
      throw error;
    }

    revalidatePath("/settings/school");
    revalidatePath("/settings");
    devLog.info("School settings updated successfully");

    return { success: true };
  } catch (error) {
    devLog.error("Error in updateSchoolSettings:", error);
    return { success: false, error: "Failed to update school settings" };
  }
}
