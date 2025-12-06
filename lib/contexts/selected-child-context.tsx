"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Child {
  id: string
  student_id: string
  first_name: string
  middle_name?: string
  last_name: string
  photo_url?: string
  gender: string
  date_of_birth: string
  status: string
}

interface SelectedChildContextType {
  selectedChild: Child | null
  setSelectedChild: (child: Child | null) => void
  children: Child[]
  setChildren: (children: Child[]) => void
}

const SelectedChildContext = createContext<SelectedChildContextType | undefined>(undefined)

export function SelectedChildProvider({ children }: { children: ReactNode }) {
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [childrenList, setChildrenList] = useState<Child[]>([])

  return (
    <SelectedChildContext.Provider
      value={{
        selectedChild,
        setSelectedChild,
        children: childrenList,
        setChildren: setChildrenList,
      }}
    >
      {children}
    </SelectedChildContext.Provider>
  )
}

export function useSelectedChild() {
  const context = useContext(SelectedChildContext)
  if (context === undefined) {
    throw new Error("useSelectedChild must be used within a SelectedChildProvider")
  }
  return context
}
