import { requireAdmin } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from 'lucide-react';
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddTeacherModal } from "@/components/add-teacher-modal";

export const dynamic = 'force-dynamic'

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });

  if (searchParams.search) {
    query = query.or(
      `first_name.ilike.%${searchParams.search}%,last_name.ilike.%${searchParams.search}%,staff_id.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%`
    );
  }

  const { data: teachers } = await query;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers & Staff</h1>
          <p className="text-muted-foreground">
            Manage teaching staff and user accounts
          </p>
        </div>
        <AddTeacherModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teachers</CardTitle>
          <CardDescription>
            View and search all registered teachers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <form className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Search by name, staff ID, or email..."
                  className="pl-8"
                  defaultValue={searchParams.search}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>

          {!teachers || teachers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {searchParams.search
                ? "No teachers found matching your search."
                : "No teachers registered yet. Add your first teacher to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher: any) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.staff_id}</TableCell>
                    <TableCell>
                      {teacher.first_name} {teacher.last_name}
                    </TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{teacher.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={teacher.status === "Active" ? "default" : "secondary"}
                      >
                        {teacher.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/teachers/${teacher.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
