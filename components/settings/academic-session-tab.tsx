"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconCalendar, IconCheck, IconPlus, IconPencil } from "@tabler/icons-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { setActiveSession, setActiveTerm, createNewSession, updateTermDates } from "@/app/(dashboard)/settings/sessions/actions"
import { toast } from "sonner"

export function AcademicSessionTab({
  sessions,
  activeSession,
  activeTerm,
}: {
  sessions: any[]
  activeSession: any
  activeTerm: any
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const res = await createNewSession(formData)
    setIsSubmitting(false)

    if (res.success) {
      toast.success("Session Created!", { description: "Academic session created with 3 automatic terms." })
      setCreateOpen(false)
    } else {
      toast.error("Failed to create session", { description: res.error })
    }
  }

  const handleUpdateTermDates = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const res = await updateTermDates(formData)
    setIsSubmitting(false)

    if (res.success) {
      toast.success("Term Dates Updated!")
      setEditingTerm(null)
    } else {
      toast.error("Failed to update term dates", { description: res.error })
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set"
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? "Not set" : d.toLocaleDateString()
  }

  return (
    <div className="space-y-3">
      {/* Compact Top Banner for Current Active Configuration */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-primary shrink-0" />
          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Active Session:</span>
          <span className="font-black text-sm text-foreground">{activeSession?.name || "Not Set"}</span>
          <span className="text-muted-foreground text-[11px]">
            ({activeSession ? `${formatDate(activeSession.start_date)} - ${formatDate(activeSession.end_date)}` : "No active session"})
          </span>
        </div>

        <div className="flex items-center gap-2 border-l border-border/60 pl-3">
          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Active Term:</span>
          <span className="font-black text-sm text-primary">{activeTerm?.name || "Not Set"}</span>
          <span className="text-muted-foreground text-[11px]">
            ({activeTerm ? `${formatDate(activeTerm.start_date)} - ${formatDate(activeTerm.end_date)}` : "No active term"})
          </span>
        </div>
      </div>

      {/* Main Sessions Card */}
      <Card className="shadow-2xs border-0">
        <CardHeader className="py-3 px-0 flex flex-row items-center justify-between border-b border-border/50">
          <div>
            <CardTitle className="text-base font-bold">Academic Sessions & Terms</CardTitle>
            <CardDescription className="text-xs">Manage sessions, terms, and academic calendar dates</CardDescription>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs font-bold gap-1 px-3">
                <IconPlus className="h-3.5 w-3.5" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Add New Academic Session</DialogTitle>
                  <DialogDescription>
                    Create a new academic session. 3 terms (First Term, Second Term, Third Term) will be automatically created.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-1">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs">Session Name</Label>
                    <Input id="name" name="name" placeholder="e.g. 2026/2027" required className="h-8 text-xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="start_date" className="text-xs">Start Date (Optional)</Label>
                      <Input id="start_date" name="start_date" type="date" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end_date" className="text-xs">End Date (Optional)</Label>
                      <Input id="end_date" name="end_date" type="date" className="h-8 text-xs" />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold">
                    {isSubmitting ? "Creating..." : "Create Session & 3 Terms"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="py-3 px-0">
          {sessions.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No sessions found. Click &quot;Add Session&quot; above to create your first session.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session: any) => (
                <div key={session.id} className="border rounded-lg overflow-hidden bg-card text-xs">
                  {/* Session Header Bar */}
                  <div className="flex items-center justify-between py-1.5 px-3 bg-muted/40 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{session.name}</span>
                      {session.is_active && (
                        <Badge className="text-[10px] py-0 px-1.5 font-bold bg-primary text-primary-foreground">
                          Active Session
                        </Badge>
                      )}
                    </div>

                    {!session.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 text-[11px] font-bold px-2">
                            Set as Active
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Change Active Session?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will affect fee generation, score entry, and result calculations. Set {session.name} as active session?
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

                  {/* Compact Terms Table */}
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="h-7 hover:bg-transparent">
                        <TableHead className="h-7 text-[11px] py-1">Term Name</TableHead>
                        <TableHead className="h-7 text-[11px] py-1">Start Date</TableHead>
                        <TableHead className="h-7 text-[11px] py-1">End Date</TableHead>
                        <TableHead className="h-7 text-[11px] py-1">Status</TableHead>
                        <TableHead className="h-7 text-[11px] py-1 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.terms?.map((term: any) => (
                        <TableRow key={term.id} className="h-8">
                          <TableCell className="py-1 font-semibold">{term.name}</TableCell>
                          <TableCell className="py-1 text-muted-foreground">{formatDate(term.start_date)}</TableCell>
                          <TableCell className="py-1 text-muted-foreground">{formatDate(term.end_date)}</TableCell>
                          <TableCell className="py-1">
                            {term.is_active ? (
                              <Badge className="text-[10px] py-0 px-1.5 gap-0.5 font-bold">
                                <IconCheck className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1 text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                              onClick={() => setEditingTerm(term)}
                              title="Edit Term Dates"
                            >
                              <IconPencil className="h-3 w-3 mr-1" />
                              Edit Dates
                            </Button>

                            {!term.is_active && session.is_active && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] font-bold text-primary hover:text-primary">
                                    Activate
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Change Active Term?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will set active term to {term.name}. All assessments and fee calculations will use this term.
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

      {/* Edit Term Dates Dialog */}
      {editingTerm && (
        <Dialog open={!!editingTerm} onOpenChange={(open) => !open && setEditingTerm(null)}>
          <DialogContent>
            <form onSubmit={handleUpdateTermDates} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Edit Dates — {editingTerm.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  Set or update start and end dates for this term. Leave blank if not yet decided.
                </DialogDescription>
              </DialogHeader>

              <input type="hidden" name="term_id" value={editingTerm.id} />

              <div className="grid grid-cols-2 gap-3 py-1">
                <div className="space-y-1">
                  <Label htmlFor="start_date" className="text-xs">Term Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    className="h-8 text-xs"
                    defaultValue={editingTerm.start_date ? editingTerm.start_date.split("T")[0] : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end_date" className="text-xs">Term End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    className="h-8 text-xs"
                    defaultValue={editingTerm.end_date ? editingTerm.end_date.split("T")[0] : ""}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingTerm(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? "Saving..." : "Save Dates"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
