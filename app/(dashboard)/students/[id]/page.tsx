import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EnrollStudentModal } from "@/components/enroll-student-modal";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic'

interface StudentProfilePageProps {
  params: {
    id: string;
  };
}

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select(`
      *,
      student_guardians(
        relationship,
        is_primary,
        guardian:guardians(*)
      ),
      student_enrollments(
        enrollment_date,
        is_active,
        session:sessions(name),
        term:terms(name),
        class:classes(
          name,
          section:sections(name)
        )
      )
    `)
    .eq("id", params.id)
    .single();

  if (!student) {
    notFound();
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: terms } = await supabase
    .from("terms")
    .select("*")
    .order("term_number");

  const { data: classes } = await supabase
    .from("classes")
    .select(`
      *,
      section:sections(name)
    `)
    .eq("is_active", true)
    .order("name");

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/students">Students</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{student.student_id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-lg">
              {getInitials(student.first_name, student.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {student.first_name} {student.middle_name} {student.last_name}
              </h1>
              <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                {student.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{student.student_id}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Date of Birth:</span>
                <span className="text-sm font-medium">
                  {new Date(student.date_of_birth).toLocaleDateString()}
                </span>

                <span className="text-sm text-muted-foreground">Gender:</span>
                <span className="text-sm font-medium">{student.gender}</span>

                <span className="text-sm text-muted-foreground">Nationality:</span>
                <span className="text-sm font-medium">{student.nationality}</span>

                <span className="text-sm text-muted-foreground">State of Origin:</span>
                <span className="text-sm font-medium">{student.state_of_origin || "—"}</span>

                <span className="text-sm text-muted-foreground">Admission Date:</span>
                <span className="text-sm font-medium">
                  {new Date(student.admission_date).toLocaleDateString()}
                </span>
              </div>

              <Separator className="my-4" />

              <div>
                <span className="text-sm text-muted-foreground">Address:</span>
                <p className="text-sm font-medium mt-1">{student.address}</p>
              </div>

              {student.medical_info && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <span className="text-sm text-muted-foreground">Medical Information:</span>
                    <p className="text-sm font-medium mt-1">{student.medical_info}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardians</CardTitle>
              <CardDescription>
                Parents and emergency contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {student.student_guardians && student.student_guardians.length > 0 ? (
                <div className="space-y-4">
                  {student.student_guardians.map((sg: any) => (
                    <div key={sg.guardian.id} className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {sg.guardian.first_name} {sg.guardian.last_name}
                          {sg.is_primary && (
                            <Badge variant="outline" className="ml-2">Primary</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{sg.relationship}</p>
                        <p className="text-sm text-muted-foreground">{sg.guardian.phone}</p>
                        {sg.guardian.email && (
                          <p className="text-sm text-muted-foreground">{sg.guardian.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No guardians linked</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Enrollment History</CardTitle>
                <CardDescription>
                  Class assignments by session and term
                </CardDescription>
              </div>
              <EnrollStudentModal
                student={student}
                sessions={sessions || []}
                terms={terms || []}
                classes={classes || []}
                open={false}
                onOpenChange={() => {}}
              >
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll
                </Button>
              </EnrollStudentModal>
            </div>
          </CardHeader>
          <CardContent>
            {student.student_enrollments && student.student_enrollments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.student_enrollments.map((enrollment: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{enrollment.session?.name}</TableCell>
                      <TableCell>{enrollment.term?.name}</TableCell>
                      <TableCell>{enrollment.class?.section?.name}</TableCell>
                      <TableCell className="font-medium">{enrollment.class?.name}</TableCell>
                      <TableCell>
                        {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={enrollment.is_active ? "default" : "secondary"}>
                          {enrollment.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Not enrolled in any class yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
