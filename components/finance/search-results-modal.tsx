"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, GraduationCap } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SearchResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectResult: (result: any, type: "parent" | "student") => void
}

export function SearchResultsModal({ open, onOpenChange, onSelectResult }: SearchResultsModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [parentResults, setParentResults] = useState<any[]>([])
  const [studentResults, setStudentResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length <= 2) {
        setParentResults([])
        setStudentResults([])
        return
      }

      setLoading(true)
      try {
        const searchPattern = `%${searchTerm}%`

        // Search guardians (parents)
        const { data: guardians } = await supabase
          .from("guardians")
          .select("*")
          .or(
            `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},phone.ilike.${searchPattern}`
          )
          .limit(10)

        // Search students
        const { data: students } = await supabase
          .from("students")
          .select("*")
          .or(
            `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},student_id.ilike.${searchPattern}`
          )
          .limit(10)

        setParentResults(guardians || [])
        setStudentResults(students || [])
      } catch (error) {
        console.error("[v0] Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, supabase])

  const handleSelectParent = (parent: any) => {
    onSelectResult(parent, "parent")
    onOpenChange(false)
    setSearchTerm("")
  }

  const handleSelectStudent = (student: any) => {
    onSelectResult(student, "student")
    onOpenChange(false)
    setSearchTerm("")
  }

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Parent or Student</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID or phone"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Results Tabs */}
          {searchTerm.length > 2 && (
            <Tabs defaultValue="parents" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="parents" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Parents ({parentResults.length})
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Students ({studentResults.length})
                </TabsTrigger>
              </TabsList>

              {/* Parents Tab */}
              <TabsContent value="parents" className="max-h-96 overflow-y-auto space-y-2 mt-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Searching...</div>
                ) : parentResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No parents found</div>
                ) : (
                  parentResults.map((parent) => (
                    <div
                      key={parent.id}
                      onClick={() => handleSelectParent(parent)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-500 text-white font-semibold">
                            {getInitials(parent.first_name, parent.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {parent.first_name} {parent.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{parent.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        <span className="text-sm font-medium">{parent.children_count || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="max-h-96 overflow-y-auto space-y-2 mt-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Searching...</div>
                ) : studentResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No students found</div>
                ) : (
                  studentResults.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-500 text-white font-semibold">
                            {getInitials(student.first_name, student.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.student_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">{student.current_class}</p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}

          {searchTerm.length <= 2 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Enter at least 3 characters to search
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
