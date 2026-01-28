import type React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { requireAuth } from "@/lib/auth/get-user"
import { createServerClient } from "@/lib/supabase/server"
import { SessionTimeoutWrapper } from "@/components/session-timeout-wrapper"
import { PrintProvider } from "@/components/finance/print-provider"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await requireAuth()
  const supabase = await createServerClient()

  let userName: string | undefined

  if (authUser.role === "teacher" || authUser.role === "admin" || authUser.role === "super_admin") {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("first_name, last_name")
      .eq("user_id", authUser.id)
      .maybeSingle()

    if (teacher) {
      userName = `${teacher.first_name} ${teacher.last_name}`
    }
  } else if (authUser.role === "parent") {
    const { data: guardian } = await supabase
      .from("guardians")
      .select("first_name, last_name")
      .eq("user_id", authUser.id)
      .maybeSingle()

    if (guardian) {
      userName = `${guardian.first_name} ${guardian.last_name}`
    }
  }

  const { data: settings } = await supabase
    .from("school_settings")
    .select("payment_mode")
    .single()

  const user = {
    id: authUser.id,
    email: authUser.email || "",
    name: userName,
    role: authUser.role,
  }

  return (
    <SessionTimeoutWrapper>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <AppHeader paymentMode={settings?.payment_mode || "test"} />
          <PrintProvider>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
          </PrintProvider>
        </SidebarInset>
      </SidebarProvider>
    </SessionTimeoutWrapper>
  )
}
