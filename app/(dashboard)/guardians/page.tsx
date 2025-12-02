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
import { Search } from 'lucide-react';
import { AddGuardianModal } from '@/components/add-guardian-modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default async function GuardiansPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("guardians")
    .select(`
      *,
      student_guardians(count)
    `)
    .order("created_at", { ascending: false });

  if (searchParams.search) {
    query = query.or(
      `first_name.ilike.%${searchParams.search}%,last_name.ilike.%${searchParams.search}%,phone.ilike.%${searchParams.search}%`
    );
  }

  const { data: guardians } = await query;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guardians</h1>
          <p className="text-muted-foreground">
            Manage parents and guardians
          </p>
        </div>
        <AddGuardianModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Guardians</CardTitle>
          <CardDescription>
            View and search all registered guardians
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
                  placeholder="Search by name or phone..."
                  className="pl-8"
                  defaultValue={searchParams.search}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>

          {!guardians || guardians.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {searchParams.search
                ? "No guardians found matching your search."
                : "No guardians registered yet. Add your first guardian to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relationship Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guardians.map((guardian: any) => (
                  <TableRow key={guardian.id}>
                    <TableCell className="font-medium">
                      {guardian.first_name} {guardian.last_name}
                    </TableCell>
                    <TableCell>{guardian.relationship_type}</TableCell>
                    <TableCell>{guardian.phone}</TableCell>
                    <TableCell>{guardian.email || "—"}</TableCell>
                    <TableCell>
                      {guardian.student_guardians?.[0]?.count || 0} student(s)
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/guardians/${guardian.id}`}>View</Link>
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
