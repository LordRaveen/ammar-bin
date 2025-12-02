import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic'

export default async function ClassesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [
    { data: sections },
    { data: classes },
    { data: subjects },
  ] = await Promise.all([
    supabase.from("sections").select("*").order("name"),
    supabase.from("classes").select(`
      *,
      section:sections(name),
      class_subjects(count)
    `).order("name"),
    supabase.from("subjects").select("*").order("name"),
  ]);

  const tahfeezClasses = classes?.filter((c: any) => c.section?.name === "Tahfeez") || [];
  const islamiyyaClasses = classes?.filter((c: any) => c.section?.name === "Islamiyya") || [];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Classes & Subjects</h1>
        <p className="text-muted-foreground">
          View and manage classes and subjects
        </p>
      </div>

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tahfeez Section</CardTitle>
              <CardDescription>
                Classes in the Qur'an memorization section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tahfeezClasses.map((classItem: any) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">{classItem.name}</TableCell>
                      <TableCell>{classItem.capacity} students</TableCell>
                      <TableCell>{classItem.class_subjects?.[0]?.count || 0} subjects</TableCell>
                      <TableCell>
                        {classItem.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Islamiyya Section</CardTitle>
              <CardDescription>
                Classes in the Islamic studies section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {islamiyyaClasses.map((classItem: any) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">{classItem.name}</TableCell>
                      <TableCell>{classItem.capacity} students</TableCell>
                      <TableCell>{classItem.class_subjects?.[0]?.count || 0} subjects</TableCell>
                      <TableCell>
                        {classItem.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>All Subjects</CardTitle>
              <CardDescription>
                Subjects available in the school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects?.map((subject: any) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.code}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subject.description || "—"}
                      </TableCell>
                      <TableCell>
                        {subject.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
