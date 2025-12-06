"use client"

import { useSelectedChild } from "@/lib/contexts/selected-child-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ChildSelector() {
  const { selectedChild, setSelectedChild, children } = useSelectedChild()

  if (children.length === 0) {
    return null
  }

  // If only one child, show them without dropdown
  if (children.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50">
        <Avatar className="h-8 w-8">
          <AvatarImage src={children[0].photo_url || "/placeholder.svg"} alt={children[0].first_name} />
          <AvatarFallback>
            {children[0].first_name[0]}
            {children[0].last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {children[0].first_name} {children[0].last_name}
          </p>
          <p className="text-xs text-muted-foreground">{children[0].student_id}</p>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between bg-transparent">
          <div className="flex items-center gap-2">
            {selectedChild ? (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedChild.photo_url || "/placeholder.svg"} alt={selectedChild.first_name} />
                  <AvatarFallback>
                    {selectedChild.first_name[0]}
                    {selectedChild.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {selectedChild.first_name} {selectedChild.last_name}
                </span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                <span className="text-sm">Select Child</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>My Children ({children.length})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children.map((child) => (
          <DropdownMenuItem key={child.id} onClick={() => setSelectedChild(child)} className="cursor-pointer">
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={child.photo_url || "/placeholder.svg"} alt={child.first_name} />
                <AvatarFallback>
                  {child.first_name[0]}
                  {child.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {child.first_name} {child.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{child.student_id}</p>
              </div>
              {selectedChild?.id === child.id && <Badge variant="default">Selected</Badge>}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setSelectedChild(null)} className="cursor-pointer">
          <Users className="h-4 w-4 mr-2" />
          View All Children
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
