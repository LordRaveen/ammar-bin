"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Calendar, GraduationCap, MapPin, Phone, Mail, User, Users, Heart } from "lucide-react"

interface ChildrenPageClientProps {
  children: any[]
}

export function ChildrenPageClient({ children }: ChildrenPageClientProps) {
  const [selectedChild, setSelectedChild] = useState<any>(null)

  if (selectedChild) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedChild(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Children
        </Button>

        {/* Child Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={selectedChild.photo_url || "/placeholder.svg"} alt={selectedChild.first_name} />
                <AvatarFallback className="text-2xl">
                  {selectedChild.first_name[0]}
                  {selectedChild.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {selectedChild.first_name} {selectedChild.middle_name} {selectedChild.last_name}
                  </h1>
                  <Badge variant={selectedChild.status === "Active" ? "default" : "secondary"}>
                    {selectedChild.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">Student ID: {selectedChild.student_id}</p>
                {selectedChild.currentEnrollment && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedChild.currentEnrollment.classes?.sections?.name} -{" "}
                        {selectedChild.currentEnrollment.classes?.name}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {selectedChild.currentEnrollment.sessions?.name} - {selectedChild.currentEnrollment.terms?.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-medium">{new Date(selectedChild.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Gender</p>
                  <p className="font-medium">{selectedChild.gender}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nationality</p>
                  <p className="font-medium">{selectedChild.nationality}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Admission Date</p>
                  <p className="font-medium">{new Date(selectedChild.admission_date).toLocaleDateString()}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </p>
                <p className="font-medium">{selectedChild.address}</p>
              </div>
              {selectedChild.medical_info && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Medical Information
                    </p>
                    <p className="font-medium">{selectedChild.medical_info}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Guardians */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guardians
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedChild.guardians.map((sg: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          {sg.guardians.first_name} {sg.guardians.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{sg.relationship}</p>
                      </div>
                      {sg.is_primary && <Badge variant="outline">Primary</Badge>}
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{sg.guardians.phone}</span>
                      </div>
                      {sg.guardians.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{sg.guardians.email}</span>
                        </div>
                      )}
                      {sg.guardians.occupation && (
                        <p className="text-muted-foreground">Occupation: {sg.guardians.occupation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class Teacher */}
        {selectedChild.currentEnrollment?.classes?.class_teacher && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Class Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-lg">
                    {selectedChild.currentEnrollment.classes.class_teacher.first_name}{" "}
                    {selectedChild.currentEnrollment.classes.class_teacher.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedChild.currentEnrollment.classes.sections?.name} -{" "}
                    {selectedChild.currentEnrollment.classes.name}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedChild.currentEnrollment.classes.class_teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedChild.currentEnrollment.classes.class_teacher.phone}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enrollment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Enrollment History
            </CardTitle>
            <CardDescription>Academic progression across sessions and terms</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChild.enrollmentHistory.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedChild.enrollmentHistory.map((enrollment: any) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.sessions?.name}</TableCell>
                        <TableCell>{enrollment.terms?.name}</TableCell>
                        <TableCell>
                          {enrollment.classes?.sections?.name} - {enrollment.classes?.name}
                        </TableCell>
                        <TableCell>{new Date(enrollment.enrollment_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={enrollment.is_active ? "default" : "secondary"}>
                            {enrollment.is_active ? "Active" : "Completed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No enrollment history available</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
        <p className="text-muted-foreground">View and manage information about your children</p>
      </div>

      {children.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Card
              key={child.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedChild(child)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={child.photo_url || "/placeholder.svg"} alt={child.first_name} />
                    <AvatarFallback className="text-2xl">
                      {child.first_name[0]}
                      {child.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {child.first_name} {child.last_name}
                      </h3>
                      <Badge variant={child.status === "Active" ? "default" : "secondary"}>{child.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{child.student_id}</p>
                    {child.currentEnrollment && (
                      <Badge variant="outline" className="text-xs">
                        {child.currentEnrollment.classes?.sections?.name} - {child.currentEnrollment.classes?.name}
                      </Badge>
                    )}
                  </div>
                  <Separator />
                  <div className="w-full space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="font-medium">{child.gender}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Age:</span>
                      <span className="font-medium">
                        {new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()} years
                      </span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setSelectedChild(child)}>
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No Children Found</p>
            <p className="text-sm text-muted-foreground">No students are linked to your account</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
