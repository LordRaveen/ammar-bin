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

    if (authError) {
      const errMsg = authError.message?.toLowerCase() || ""
      const isNetworkError =
        errMsg.includes("fetch") ||
        errMsg.includes("network") ||
        errMsg.includes("connect") ||
        errMsg.includes("timeout") ||
        errMsg.includes("abort") ||
        errMsg.includes("econnrefused") ||
        errMsg.includes("enotfound")

      if (isNetworkError) {
        throw authError
      }

      devLog.debug("No authenticated user found")
      return null
    }

    if (!user) {
      devLog.debug("No authenticated user found")
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, status")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    let userRole: any = profile?.role
    let isActive: boolean = profile ? profile.status === "Active" : true

    if (!userRole) {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role, is_active")
        .eq("user_id", user.id)
        .maybeSingle()

      if (roleError) {
        throw roleError
      }

      userRole = roleData?.role || (user.user_metadata?.role as any) || "admin"
      if (roleData) isActive = roleData.is_active
    }

    return {
      id: user.id,
      email: user.email!,
      role: userRole,
      isActive: isActive,
    }
  } catch (error: any) {
    const errMsg = error?.message?.toLowerCase() || ""
    const isNetworkError =
      errMsg.includes("failed to fetch") ||
      errMsg.includes("network") ||
      errMsg.includes("timeout") ||
      errMsg.includes("connect") ||
      errMsg.includes("econnrefused") ||
      errMsg.includes("enotfound") ||
      error?.name === "TypeError" ||
      error?.code === "ENOTFOUND" ||
      error?.code === "ECONNREFUSED" ||
      error?.code === "ETIMEDOUT"

    if (isNetworkError) {
      throw new Error(`Connection issue: ${error.message || "Failed to reach server. Please check your internet connection."}`)
    }

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
 * Optionally checks if user has one of the allowed roles
 */
export async function requireAuth(allowedRoles?: UserRole[] | string[]): Promise<AuthUser> {
  const user = await getUser()
  if (!user) {
    redirect("/auth/signin")
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/dashboard")
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
