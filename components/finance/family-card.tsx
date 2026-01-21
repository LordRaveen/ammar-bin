'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InboxIcon, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StudentInvoiceCard } from "./student-invoice-card"

interface StudentInvoiceItem {
  id: string
  description: string
  dueDate: string
  balance: number
  status: "pending" | "paid" | "partial"
}

interface StudentData {
  id: string
  name: string
  class: string
  invoiceNumber: string
  invoices: StudentInvoiceItem[]
}

interface FamilyCardProps {
  selectedFamily: any
  onSelectFamily: (family: any) => void
  onItemsSelected?: (items: any[]) => void
  userRole?: "admin" | "parent" | "accountant"
  parentId?: string
}

export function FamilyCard({
  selectedFamily,
  onSelectFamily,
  onItemsSelected,
  userRole = "admin",
  parentId,
}: FamilyCardProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())

  // Mock data for guardian
  const guardianInfo = selectedFamily?.type === "parent" ? {
    name: selectedFamily.first_name + " " + selectedFamily.last_name,
    relationship: "Guardian",
    phone: selectedFamily.phone || "0801 234 5678",
    type: selectedFamily.type,
  } : null

  // Mock data for students with invoices
  const studentsData: StudentData[] = selectedFamily?.type === "parent" ? [
    {
      id: "1",
      name: "Aisha Aliyu",
      class: "Class 2 - Islamiya",
      invoiceNumber: "INV-9920192881",
      invoices: [
        {
          id: "item-1",
          description: "School Fees",
          dueDate: "8 days",
          balance: 20000,
          status: "pending",
        },
        {
          id: "item-2",
          description: "Project Fee",
          dueDate: "1 Month",
          balance: 15000,
          status: "pending",
        },
        {
          id: "item-3",
          description: "Books",
          dueDate: "N/A",
          balance: 0,
          status: "paid",
        },
      ],
    },
    {
      id: "2",
      name: "Sadiq Aliyu",
      class: "Class 1 - Islamiya",
      invoiceNumber: "INV-0192881271",
      invoices: [
        {
          id: "item-4",
          description: "Uniform Male",
          dueDate: "Overdue",
          balance: 39000,
          status: "pending",
        },
        {
          id: "item-5",
          description: "Exam Fee",
          dueDate: "1 Month",
          balance: 2000,
          status: "pending",
        },
      ],
    },
  ] : []

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItemIds)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItemIds(newSelected)

    // Callback with selected items
    const items = studentsData
      .flatMap((student) =>
        student.invoices
          .filter((item) => newSelected.has(item.id))
          .map((item) => ({
            ...item,
            studentId: student.id,
            studentName: student.name,
          }))
      )
    onItemsSelected?.(items)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-3">
      {guardianInfo ? (
        <>
          {/* Guardian/Parent Card */}
          <Card className="border shadow-none py-2">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-green-500">
                    <AvatarFallback className="bg-green-500 text-white font-semibold">
                      {getInitials(guardianInfo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{guardianInfo.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {guardianInfo.relationship}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{guardianInfo.phone}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Payment History</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Student Invoice Cards */}
          <div className="space-y-3">
            {studentsData.map((student) => (
              <StudentInvoiceCard
                key={student.id}
                studentId={student.id}
                studentName={student.name}
                studentClass={student.class}
                invoiceNumber={student.invoiceNumber}
                invoices={student.invoices}
                selectedItemIds={selectedItemIds}
                onItemToggle={handleItemToggle}
              />
            ))}
          </div>
        </>
      ) : !selectedFamily ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <InboxIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="font-medium text-muted-foreground">No family selected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Search and select a parent or student to view their invoices
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
