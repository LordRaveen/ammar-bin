import type React from "react"
import { SelectedChildProvider } from "@/lib/contexts/selected-child-context"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <SelectedChildProvider>{children}</SelectedChildProvider>
}
