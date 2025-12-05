import { createClient } from "@/lib/supabase/server"
import { devLog } from "@/lib/logger"
import type { UserRole } from "@/lib/types/database"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  isActive: boolean
}

/**
 * Get the current authenticated user with their role
 * Returns null if not authenticated
 */
export async function getUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      devLog.debug("No authenticated user found")
      return null
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .maybeSingle()

    if (roleError) {
      devLog.error("Failed to fetch user role:", roleError)
      return null
    }

    if (!roleData) {
      devLog.warn("User has no role assigned:", user.id)
      return null
    }

    return {
      id: user.id,
      email: user.email!,
      role: roleData.role,
      isActive: roleData.is_active,
    }
  } catch (error) {
    devLog.error("Error in getUser:", error)
    return null
  }
}

/**
 * Check if current user has admin privileges
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  return user ? ["super_admin", "admin"].includes(user.role) : false
}

/**
 * Check if current user is a teacher
 */
export async function isTeacher(): Promise<boolean> {
  const user = await getUser()
  return user?.role === "teacher" || false
}

/**
 * Check if current user is an accountant
 */
export async function isAccountant(): Promise<boolean> {
  const user = await getUser()
  return user ? ["super_admin", "admin", "accountant"].includes(user.role) : false
}

/**
 * Require authentication - redirect to signin if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

/**
 * Require admin role - throw error if not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (!["super_admin", "admin"].includes(user.role)) {
    throw new Error("Forbidden: Admin access required")
  }
  return user
}

export { getUser as getCurrentUser }
