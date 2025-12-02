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

export const dynamic = 'force-dynamic'

interface TeacherProfilePageProps {
  params: {
    id: string;
  };
}

export default async function TeacherProfilePage({ params }: TeacherProfilePageProps) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!teacher) {
    notFound();
  }

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
              <BreadcrumbLink href="/teachers">Teachers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{teacher.staff_id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-lg">
              {getInitials(teacher.first_name, teacher.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {teacher.first_name} {teacher.middle_name} {teacher.last_name}
              </h1>
              <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                {teacher.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{teacher.staff_id}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{teacher.role}</Badge>
              <Badge variant="outline">{teacher.employment_type}</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{teacher.email}</span>

                <span className="text-sm text-muted-foreground">Phone:</span>
                <span className="text-sm font-medium">{teacher.phone}</span>

                <span className="text-sm text-muted-foreground">Gender:</span>
                <span className="text-sm font-medium">{teacher.gender}</span>

                {teacher.date_of_birth && (
                  <>
                    <span className="text-sm text-muted-foreground">Date of Birth:</span>
                    <span className="text-sm font-medium">
                      {new Date(teacher.date_of_birth).toLocaleDateString()}
                    </span>
                  </>
                )}

                <span className="text-sm text-muted-foreground">Employment Date:</span>
                <span className="text-sm font-medium">
                  {new Date(teacher.employment_date).toLocaleDateString()}
                </span>
              </div>

              {teacher.address && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <span className="text-sm text-muted-foreground">Address:</span>
                    <p className="text-sm font-medium mt-1">{teacher.address}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {teacher.qualification && (
                  <>
                    <span className="text-sm text-muted-foreground">Qualification:</span>
                    <span className="text-sm font-medium">{teacher.qualification}</span>
                  </>
                )}

                {teacher.specialization && (
                  <>
                    <span className="text-sm text-muted-foreground">Specialization:</span>
                    <span className="text-sm font-medium">{teacher.specialization}</span>
                  </>
                )}

                <span className="text-sm text-muted-foreground">Staff Role:</span>
                <span className="text-sm font-medium">{teacher.role}</span>

                <span className="text-sm text-muted-foreground">Employment Type:</span>
                <span className="text-sm font-medium">{teacher.employment_type}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Class & Subject Assignments</CardTitle>
            <CardDescription>
              Current teaching assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No assignments yet. Assignments can be managed from the Assignments page.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
