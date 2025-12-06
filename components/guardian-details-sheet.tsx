"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Mail, Phone, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PortalAccessManager } from "./portal-access-manager"

interface GuardianDetailsSheetProps {
  guardianId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GuardianDetailsSheet({ guardianId, open, onOpenChange }: GuardianDetailsSheetProps) {
  const [guardian, setGuardian] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchGuardian() {
      if (!guardianId || !open) {
        setGuardian(null)
        return
      }

      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("guardians")
        .select(
          `
          *,
          student_guardians(
            relationship,
            is_primary,
            student:students(
              id,
              student_id,
              first_name,
              last_name,
              student_enrollments(
                is_active,
                class:classes(name)
              )
            )
          )
        `,
        )
        .eq("id", guardianId)
        .single()

      if (!error && data) {
        setGuardian(data)
      }
      setLoading(false)
    }

    fetchGuardian()
  }, [guardianId, open])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const handleActivationSuccess = () => {
    // Refresh guardian data
    if (guardianId && open) {
      const supabase = createClient()
      supabase
        .from("guardians")
        .select("*")
        .eq("id", guardianId)
        .single()
        .then(({ data }) => {
          if (data) {
            setGuardian((prev: any) => ({ ...prev, ...data }))
          }
        })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle>Guardian Details</SheetTitle>
              <SheetDescription>View guardian information and manage portal access</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : guardian ? (
          <div className="px-6 pb-6 space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(guardian.first_name, guardian.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold">
                    {guardian.first_name} {guardian.last_name}
                  </h2>
                  <Badge variant="outline">{guardian.relationship_type}</Badge>
                </div>
                <div className="space-y-1">
                  {guardian.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {guardian.phone}
                    </div>
                  )}
                  {guardian.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {guardian.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <PortalAccessManager
              guardianId={guardian.id}
              guardianEmail={guardian.email}
              guardianPhone={guardian.phone}
              hasAccess={!!guardian.user_id}
              onSuccess={handleActivationSuccess}
            />

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{guardian.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{guardian.email || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Occupation:</span>
                  <p className="font-medium">{guardian.occupation || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">National ID:</span>
                  <p className="font-medium">{guardian.national_id || "—"}</p>
                </div>
                {guardian.address && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="font-medium">{guardian.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Linked Children</h3>
              {guardian.student_guardians && guardian.student_guardians.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Primary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guardian.student_guardians.map((sg: any) => {
                        const activeEnrollment = sg.student?.student_enrollments?.find((e: any) => e.is_active)
                        return (
                          <TableRow key={sg.student?.id}>
                            <TableCell className="text-sm font-medium">{sg.student?.student_id}</TableCell>
                            <TableCell className="text-sm">
                              {sg.student?.first_name} {sg.student?.last_name}
                            </TableCell>
                            <TableCell className="text-sm">{sg.relationship}</TableCell>
                            <TableCell className="text-sm">
                              {activeEnrollment?.class?.name || (
                                <span className="text-muted-foreground italic">Not enrolled</span>
                              )}
                            </TableCell>
                            <TableCell>{sg.is_primary && <Badge variant="outline">Primary</Badge>}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No children linked to this guardian</p>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
