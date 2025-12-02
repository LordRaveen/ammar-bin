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
import { Plus } from 'lucide-react';
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

export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      *,
      terms:terms(count)
    `)
    .order("start_date", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions & Terms</h1>
          <p className="text-muted-foreground">
            Manage academic sessions and terms
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/sessions/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Session
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Sessions</CardTitle>
          <CardDescription>
            View and manage all academic sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sessions || sessions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No sessions found. Create your first session to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.name}</TableCell>
                    <TableCell>{new Date(session.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(session.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>{session.terms?.[0]?.count || 0} terms</TableCell>
                    <TableCell>
                      {session.is_active ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/settings/sessions/${session.id}`}>
                          View
                        </Link>
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
