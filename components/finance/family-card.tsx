'use client';

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InboxIcon, Users, GraduationCap, CheckSquare } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { InvoiceItemSelector } from "./invoice-item-selector"

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
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  )

  // Mock data for demonstration - will be replaced with real data
  const parentRelations = selectedFamily?.type === "parent" ? [
    { id: 1, first_name: "Student", last_name: "One", student_id: "STU001", current_class: "Class 1" },
    { id: 2, first_name: "Student", last_name: "Two", student_id: "STU002", current_class: "Class 2" },
  ] : []

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  const handleStudentToggle = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  return (
    <Card className="min-h-96">
      <CardContent className="p-6">
        {!selectedFamily ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <InboxIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <p className="font-medium text-muted-foreground">No family selected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Search and select a parent or student to view their family information
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header with family info */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Avatar className="h-12 w-12">
                <AvatarFallback className={selectedFamily.type === "parent" ? "bg-green-500 text-white" : "bg-blue-500 text-white"}>
                  {getInitials(selectedFamily.first_name, selectedFamily.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {selectedFamily.first_name} {selectedFamily.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedFamily.type === "parent" ? "Guardian" : "Student"} • {selectedFamily.phone || selectedFamily.student_id}
                </p>
              </div>
            </div>

            {/* Tabs for related data */}
            {selectedFamily.type === "parent" && (
              <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="students" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Students ({parentRelations.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="space-y-2 max-h-64 overflow-y-auto">
                  {parentRelations.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentToggle(student.id)}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted hover:bg-muted/70 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => {}} // Handled by parent div click
                        className="rounded"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          {getInitials(student.first_name, student.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.current_class}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            )}

            {/* Invoice Item Selector */}
            {selectedFamily.type === "parent" && selectedStudents.size > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Select Items to Pay
                </p>
                <InvoiceItemSelector
                  studentIds={Array.from(selectedStudents)}
                  onItemsSelected={onItemsSelected || (() => {})}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
