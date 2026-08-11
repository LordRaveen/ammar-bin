"use client"

import { IconLayoutSidebar, IconMoon, IconSun } from "@tabler/icons-react"
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
import { cn } from "@/lib/utils"

function generateBreadcrumbs(pathname: string, labels: Record<string, string>) {
  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/")
    let label = labels[segment] || segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
    if (isUUID && !labels[segment]) {
      label = "Report Card"
    }

    return {
      label,
      path,
      isLast: index === segments.length - 1,
    }
  })

  return breadcrumbs
}

import { Badge } from "@/components/ui/badge"

interface AppHeaderProps {
  paymentMode?: string
}

export function AppHeader({ paymentMode = "test" }: AppHeaderProps) {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const [labels, setLabels] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalLabels = (window as any).__breadcrumbLabels || {}
      setLabels({ ...globalLabels })
      
      const handleUpdate = () => {
        const updated = (window as any).__breadcrumbLabels || {}
        setLabels({ ...updated })
      }
      
      window.addEventListener('breadcrumb-update', handleUpdate)
      return () => window.removeEventListener('breadcrumb-update', handleUpdate)
    }
  }, [pathname])

  const breadcrumbs = React.useMemo(() => generateBreadcrumbs(pathname, labels), [pathname, labels])
  const { theme, setTheme } = useTheme()

  return (
    <header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <IconLayoutSidebar className="h-5 w-5" />
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

      <div className="ml-auto flex items-center gap-4">
        {/* Payment Mode Indicator */}
        <Badge
          variant={paymentMode === "live" ? "default" : "outline"}
          className={cn(
            "rounded-full font-black uppercase text-[10px] tracking-widest px-2 sm:px-3 py-1",
            paymentMode === "live"
              ? "bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold"
          )}
        >
          <span className="hidden sm:inline">{paymentMode === "live" ? "Live Mode" : "Test Mode"}</span>
          <span className="inline sm:hidden font-extrabold text-[12px]">{paymentMode === "live" ? "●" : "!"}</span>
        </Badge>

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
