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

    const prefix = settings?.staff_id_prefix || "STAFF"
    const year = new Date().getFullYear()

    const adminClient = createAdminClient()

    // Query existing staff_ids to find the highest number
    const { data: existingStaff } = await adminClient
      .from("user_profiles")
      .select("staff_id")
      .like("staff_id", `${prefix}/${year}/%`)

    let maxNum = 0
    existingStaff?.forEach((s: any) => {
      if (s.staff_id) {
        const parts = s.staff_id.split("/")
        const num = parseInt(parts[parts.length - 1], 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      }
    })

    let currentNum = maxNum
    let staffId = `${prefix}/${year}/${String(currentNum + 1).padStart(3, "0")}`

    const phone = formData.get("phone") as string
    const cleanPhone = phone ? phone.replace(/[^\d]/g, "") : ""
    let tempPassword = `${staffId.replace(/\//g, "")}@Temp`
    if (cleanPhone.length >= 6) {
      tempPassword = cleanPhone
    }

    const createAccount = formData.get("create_account") === "true" || formData.get("createAccount") === "true" || formData.get("create_account") === "on" || true
    let userId: string | null = null

    if (createAccount && email) {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role },
      })

      if (authError) {
        if (
          authError.code === "email_exists" ||
          authError.status === 422 ||
          authError.message?.toLowerCase().includes("already been registered") ||
          authError.message?.toLowerCase().includes("email_exists")
        ) {
          devLog.info("Email already registered in Auth, fetching existing user:", email)
          const { data: listData } = await adminClient.auth.admin.listUsers()
          const existingUser = listData?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          )
          if (existingUser) {
            userId = existingUser.id
          } else {
            return { success: false, error: "A user account with this email address already exists." }
          }
        } else {
          devLog.error("Failed to create auth user:", authError)
          return { success: false, error: `Failed to create user account: ${authError.message}` }
        }
      } else {
        userId = authData.user.id
      }

      if (userId) {
        // Create or update user role entry
        await adminClient.from("user_roles").upsert(
          {
            user_id: userId,
            role: role,
            is_active: true,
          },
          { onConflict: "user_id" }
        )
      }
    }

    const baseStaffData = {
      user_id: userId,
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
      employment_type: (formData.get("employment_type") as string) || "Full-time",
      role: role,
      status: "Active",
    }

    let profile: any = null
    let profileError: any = null

    // Try inserting profile with auto-incrementing staff_id on collision
    for (let attempt = 0; attempt < 10; attempt++) {
      currentNum += 1
      staffId = `${prefix}/${year}/${String(currentNum).padStart(3, "0")}`

      const staffData = {
        ...baseStaffData,
        staff_id: staffId,
      }

      devLog.debug(`Upserting staff into user_profiles (attempt ${attempt + 1}):`, staffData)

      const res = await adminClient
        .from("user_profiles")
        .upsert(staffData, { onConflict: "email" })
        .select()
        .single()

      if (!res.error) {
        profile = res.data
        profileError = null
        break
      }

      if (res.error.code === "23505" && res.error.message?.includes("staff_id")) {
        devLog.info(`Staff ID collision for ${staffId}, incrementing to next number...`)
        continue
      }

      profileError = res.error
      break
    }

    if (profileError || !profile) {
      devLog.error("Failed to create user_profile:", profileError)
      return { success: false, error: profileError?.message || "Failed to create user profile" }
    }

    const employmentDate = (formData.get("employment_date") as string) || new Date().toISOString().split("T")[0]

    // Upsert into teachers table if role is teacher
    if (role === "teacher") {
      try {
        const { error: teacherError } = await adminClient.from("teachers").upsert(
          {
            user_id: userId,
            staff_id: profile.staff_id,
            first_name: profile.first_name,
            middle_name: profile.middle_name,
            last_name: profile.last_name,
            email: profile.email,
            phone: profile.phone,
            gender: profile.gender,
            date_of_birth: profile.date_of_birth,
            address: profile.address,
            qualification: profile.qualification,
            specialization: profile.specialization,
            employment_date: employmentDate,
            employment_type: profile.employment_type,
            status: profile.status,
            role: "teacher", // Explicitly set lowercase role
          },
          { onConflict: "email" }
        )
        if (teacherError) {
          devLog.error("Failed to upsert teacher record during addStaff:", teacherError.message)
        }
      } catch (e) {
        devLog.error("Error upserting into teachers table:", e)
      }
    }

    revalidatePath("/users")
    revalidatePath("/teachers")
    return { success: true, profile }
  } catch (error: any) {
    devLog.error("Error in addStaff:", error)
    return { success: false, error: error.message || "Failed to add staff" }
  }
}
