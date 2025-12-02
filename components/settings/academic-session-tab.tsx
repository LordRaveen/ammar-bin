"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconCalendar, IconCheck } from "@tabler/icons-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { setActiveSession, setActiveTerm } from "@/app/(dashboard)/settings/sessions/actions"

export function AcademicSessionTab({
  sessions,
  activeSession,
  activeTerm,
}: {
  sessions: any[]
  activeSession: any
  activeTerm: any
}) {
  return (
    <div className="space-y-4">
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Current Academic Configuration
          </CardTitle>
          <CardDescription>Active session and term for all school operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Active Session</div>
              <div className="text-2xl font-bold">{activeSession?.name || "Not Set"}</div>
              <div className="text-sm text-muted-foreground">
                {activeSession
                  ? `${new Date(activeSession.start_date).toLocaleDateString()} - ${new Date(activeSession.end_date).toLocaleDateString()}`
                  : "No active session"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Active Term</div>
              <div className="text-2xl font-bold">{activeTerm?.name || "Not Set"}</div>
              <div className="text-sm text-muted-foreground">
                {activeTerm
                  ? `${new Date(activeTerm.start_date).toLocaleDateString()} - ${new Date(activeTerm.end_date).toLocaleDateString()}`
                  : "No active term"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Sessions & Terms</CardTitle>
          <CardDescription>View and manage academic sessions and their terms</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No sessions found. Create your first session to get started.
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session: any) => (
                <div key={session.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{session.name}</h3>
                      {session.is_active && <Badge>Active Session</Badge>}
                    </div>
                    {!session.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Set as Active
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Change Active Session?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will affect fee generation, score entry, and result calculations. Are you sure you
                              want to set {session.name} as the active session?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => setActiveSession(session.id)}>Confirm</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term Name</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.terms?.map((term: any) => (
                        <TableRow key={term.id}>
                          <TableCell className="font-medium">{term.name}</TableCell>
                          <TableCell>{new Date(term.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(term.end_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {term.is_active ? (
                              <Badge className="gap-1">
                                <IconCheck className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!term.is_active && session.is_active && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Activate
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Change Active Term?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will change the active term to {term.name}. All assessments and fee
                                      calculations will use this term.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => setActiveTerm(term.id, session.id)}>
                                      Confirm
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
