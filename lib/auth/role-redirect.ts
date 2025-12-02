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
