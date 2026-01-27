"use client"

import { IconMenu2, IconMoon, IconSun } from "@tabler/icons-react"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import React from "react"
import { NotificationsPopover } from "@/components/notifications-popover"
import { CommandMenu } from "@/components/command-menu"

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/")
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    return {
      label,
      path,
      isLast: index === segments.length - 1,
    }
  })

  return breadcrumbs
}

export function AppHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)
  const { theme, setTheme } = useTheme()

  return (
    <header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <IconMenu2 className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 flex justify-center px-4">
        <CommandMenu />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <IconSun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <IconMoon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <NotificationsPopover />
      </div>
    </header>
  )
}
