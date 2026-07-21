"use server"

import { createClient } from "@/lib/supabase/server"
import { devLog } from "@/lib/logger"
import type { UserRole } from "@/lib/types/database"
import { redirect } from "next/navigation"

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

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, status")
      .eq("user_id", user.id)
      .maybeSingle()

    let userRole: any = profile?.role
    let isActive: boolean = profile ? profile.status === "Active" : true

    if (!userRole) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, is_active")
        .eq("user_id", user.id)
        .maybeSingle()

      userRole = roleData?.role || (user.user_metadata?.role as any) || "admin"
      if (roleData) isActive = roleData.is_active
    }

    return {
      id: user.id,
      email: user.email!,
      role: userRole,
      isActive: isActive,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      devLog.debug("Auth request aborted (navigation in progress)")
      return null
    }
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
export async function requireAuth(p0: string[]): Promise<AuthUser> {
  const user = await getUser()
  if (!user) {
    redirect("/auth/signin")
  }
  return user
}

/**
 * Require admin role - throw error if not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (!["super_admin", "admin"].includes(user.role)) {
    redirect("/dashboard")
  }
  return user
}

export { getUser as getCurrentUser, requireAuth as requireUser }
