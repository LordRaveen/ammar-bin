import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/get-user"
import { getRoleDashboardUrl } from "@/lib/auth/role-redirect"

export default async function HomePage() {
  const user = await getUser()

  if (user) {
    const dashboardUrl = getRoleDashboardUrl(user.role)
    redirect(dashboardUrl)
  }

  // If not authenticated, redirect to signin
  redirect("/auth/signin")
}
