"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"
import { devLog } from "@/lib/logger"

export async function addStaff(formData: FormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const email = formData.get("email") as string
    const role = (formData.get("role") as string || "teacher").toLowerCase()

    // Get school settings for staff ID prefix
    const { data: settings } = await supabase
      .from("school_settings")
      .select("staff_id_prefix")
      .single()

    const year = new Date().getFullYear()
    const { count } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })

    const staffNumber = String((count || 0) + 1).padStart(3, "0")
    const staffId = `${settings?.staff_id_prefix || "STAFF"}/${year}/${staffNumber}`

    const phone = formData.get("phone") as string
    const cleanPhone = phone ? phone.replace(/[^\d]/g, "") : ""
    let tempPassword = `${staffId.replace(/\//g, "")}@Temp`
    if (cleanPhone.length >= 6) {
      tempPassword = cleanPhone
    }

    if (createAccount && email) {
      const adminClient = createAdminClient()

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role },
      })

      if (authError) {
        devLog.error("Failed to create auth user:", authError)
        return { success: false, error: `Failed to create user account: ${authError.message}` }
      }

      userId = authData.user.id

      // Create user role entry
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: role,
        is_active: true,
      })
    }

    const staffData = {
      user_id: userId,
      staff_id: staffId,
      first_name: formData.get("first_name") as string,
      middle_name: (formData.get("middle_name") as string) || null,
      last_name: formData.get("last_name") as string,
      email: email,
      phone: formData.get("phone") as string,
      gender: (formData.get("gender") as string) || "Male",
      date_of_birth: (formData.get("date_of_birth") as string) || null,
      address: (formData.get("address") as string) || null,
      qualification: (formData.get("qualification") as string) || null,
      specialization: (formData.get("specialization") as string) || null,
      employment_date: (formData.get("employment_date") as string) || new Date().toISOString().split("T")[0],
      employment_type: (formData.get("employment_type") as string) || "Full-time",
      role: role,
      status: "Active",
    }

    devLog.debug("Inserting staff into user_profiles:", staffData)

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .insert(staffData)
      .select()
      .single()

    if (profileError) {
      devLog.error("Failed to create user_profile:", profileError)
      return { success: false, error: profileError.message }
    }

    // Insert into teachers table if it exists
    try {
      await supabase.from("teachers").insert(staffData)
    } catch (e) {
      // Ignore if view or constrained
    }

    revalidatePath("/users")
    return { success: true, profile }
  } catch (error: any) {
    devLog.error("Error in addStaff:", error)
    return { success: false, error: error.message || "Failed to add staff" }
  }
}
