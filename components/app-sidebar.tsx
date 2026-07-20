"use client"

import type * as React from "react"
import {
  IconBuildingBank,
  IconChartBar,
  IconClipboardCheck,
  IconCoin,
  IconDashboard,
  IconFileText,
  IconSchool,
  IconSettings,
  IconUser,
  IconUsers,
  IconUsersGroup,
  IconSpeakerphone,
  IconCalendarEvent,
  IconHistory,
  IconMessage,
  IconShield,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { UserRole } from "@/lib/types/database"

const getNavigationByRole = (role: UserRole) => {
  const baseNav = [
    {
      title: "Dashboard",
      url:
        role === "teacher"
          ? "/teacher-dashboard"
          : role === "accountant" || role === "cashier"
            ? "/cashier-dashboard"
            : "/dashboard",
      icon: IconDashboard,
    },
  ]

  const adminNav = [
    ...baseNav,
    {
      title: "Classes",
      url: "/classes",
      icon: IconSchool,
    },
    {
      title: "Students",
      url: "/students",
      icon: IconUsers,
    },
    {
      title: "Teachers",
      url: "/teachers",
      icon: IconUsersGroup,
    },
    {
      title: "Users",
      url: "/users",
      icon: IconUsersGroup,
    },
    {
      title: "Guardians",
      url: "/guardians",
      icon: IconUser,
    },
    {
      title: "Assessments",
      url: "/assessments/results",
      icon: IconClipboardCheck,
    },
    {
      title: "Assignments",
      url: "/assignments",
      icon: IconClipboardCheck,
    },
    {
      title: "Finance",
      url: "/finance",
      icon: IconCoin,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconFileText,
    },
    {
      title: "Announcements",
      url: "/announcements",
      icon: IconSpeakerphone,
    },
    {
      title: "Audit Trail",
      url: "/finance/audit-trail",
      icon: IconHistory,
    },
    {
      title: "Account Lockouts",
      url: "/settings/account-lockouts",
      icon: IconShield,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ]

  const teacherNav = [
    ...baseNav,
    {
      title: "Students",
      url: "/students",
      icon: IconUsers,
    },
    {
      title: "Attendance",
      url: "/teacher/attendance",
      icon: IconCalendarEvent,
    },
    {
      title: "Assessments",
      url: "/assessments/results",
      icon: IconClipboardCheck,
    },
  ]

  const cashierNav = [
    {
      title: "Dashboard",
      url: "/cashier-dashboard",
      icon: IconDashboard,
    },
    {
      title: "Students",
      url: "/students",
      icon: IconUsers,
    },
    {
      title: "Finance",
      url: "/finance",
      icon: IconCoin,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconFileText,
    },
  ]

  const accountantNav = [
    {
      title: "Dashboard",
      url: "/cashier-dashboard",
      icon: IconDashboard,
    },
    {
      title: "Students",
      url: "/students",
      icon: IconUsers,
    },
    {
      title: "Finance",
      url: "/finance",
      icon: IconCoin,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconFileText,
    },
    {
      title: "Audit Trail",
      url: "/finance/audit-trail",
      icon: IconHistory,
    },
  ]

  const parentNav = [
    ...baseNav,
    {
      title: "My Children",
      url: "/parent/children",
      icon: IconUsers,
    },
    {
      title: "Messages",
      url: "/parent/messages",
      icon: IconMessage,
    },
    {
      title: "Payments",
      url: "/parent/payments",
      icon: IconBuildingBank,
    },
    {
      title: "Results",
      url: "/parent/results",
      icon: IconChartBar,
    },
    {
      title: "Attendance",
      url: "/parent/attendance",
      icon: IconCalendarEvent,
    },
    {
      title: "Announcements",
      url: "/parent/announcements",
      icon: IconFileText,
    },
    {
      title: "Profile",
      url: "/parent/profile",
      icon: IconSettings,
    },
  ]

  switch (role) {
    case "super_admin":
    case "admin":
      return adminNav
    case "teacher":
      return teacherNav
    case "cashier":
      return cashierNav
    case "accountant":
      return accountantNav
    case "parent":
      return parentNav
    default:
      return baseNav
  }
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: string
    email: string
    name?: string
    role: UserRole
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const navigationItems = getNavigationByRole(user.role)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <IconSchool className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Ammar Bin Yasir</span>
                  <span className="text-muted-foreground truncate text-xs">Institute</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
