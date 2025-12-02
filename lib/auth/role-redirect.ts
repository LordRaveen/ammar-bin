/**
 * Get the appropriate dashboard URL based on user role
 */
export function getRoleDashboardUrl(role: string): string {
  switch (role) {
    case "teacher":
      return "/teacher-dashboard"
    case "super_admin":
    case "admin":
      return "/dashboard"
    default:
      return "/dashboard"
  }
}

/**
 * Check if the current user has admin privileges
 */
export function isAdmin(role: string): boolean {
  return role === "super_admin" || role === "admin"
}

/**
 * Check if the current user is a teacher
 */
export function isTeacher(role: string): boolean {
  return role === "teacher"
}
