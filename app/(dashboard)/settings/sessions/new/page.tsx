import { requireAdmin } from "@/lib/auth/get-user";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createSession } from "../actions";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default async function NewSessionPage() {
  await requireAdmin();

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
              <BreadcrumbLink href="/settings/sessions">Sessions & Terms</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>New Session</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Session</h1>
          <p className="text-muted-foreground">
            Add a new academic session with terms
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>
              Enter the academic session information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createSession} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="2025/2026"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Format: YYYY/YYYY (e.g., 2025/2026)
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is_active" name="is_active" />
                <Label htmlFor="is_active" className="text-sm font-normal">
                  Set as active session (will deactivate other sessions)
                </Label>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Terms</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((termNumber) => (
                    <Card key={termNumber}>
                      <CardHeader>
                        <CardTitle className="text-base">Term {termNumber}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <input type="hidden" name={`term_${termNumber}_number`} value={termNumber} />
                        
                        <div className="space-y-2">
                          <Label htmlFor={`term_${termNumber}_name`}>Term Name</Label>
                          <Input
                            id={`term_${termNumber}_name`}
                            name={`term_${termNumber}_name`}
                            defaultValue={`${termNumber === 1 ? 'First' : termNumber === 2 ? 'Second' : 'Third'} Term`}
                            required
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`term_${termNumber}_start`}>Start Date</Label>
                            <Input
                              id={`term_${termNumber}_start`}
                              name={`term_${termNumber}_start`}
                              type="date"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`term_${termNumber}_end`}>End Date</Label>
                            <Input
                              id={`term_${termNumber}_end`}
                              name={`term_${termNumber}_end`}
                              type="date"
                              required
                            />
                          </div>
                        </div>

                        {termNumber === 1 && (
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`term_${termNumber}_active`} name={`term_${termNumber}_active`} defaultChecked />
                            <Label htmlFor={`term_${termNumber}_active`} className="text-sm font-normal">
                              Set as active term
                            </Label>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href="/settings/sessions">Cancel</Link>
                </Button>
                <Button type="submit">Create Session</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
