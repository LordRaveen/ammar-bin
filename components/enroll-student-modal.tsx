"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { enrollStudent } from "@/app/(dashboard)/students/actions";
import { toast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrollStudentModalProps {
  student: any;
  sessions: any[];
  terms: any[];
  classes: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnrollStudentModal({
  student,
  sessions,
  terms,
  classes,
  open,
  onOpenChange,
}: EnrollStudentModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Pre-populate with global/active session and term
  const [selectedSession, setSelectedSession] = useState(() => {
    return sessions.find((s) => s.is_active)?.id || "";
  });
  const [selectedTerm, setSelectedTerm] = useState(() => {
    const activeSessionId = sessions.find((s) => s.is_active)?.id;
    return terms.find((t) => t.is_active && t.session_id === activeSessionId)?.id || "";
  });

  const isCombined = student?.enrollment_type === "combined" || student?.student_id?.startsWith("ABYI/CMB");

  // Allow selecting the section (Islamiyya vs Tahfeez) for single-shift students
  const [selectedSection, setSelectedSection] = useState(() => {
    if (isCombined) return "";
    return student?.enrollment_type || (student?.student_id?.startsWith("ABYI/TAH") ? "tahfeez" : "islamiyya");
  });

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTahfeezClass, setSelectedTahfeezClass] = useState("");

  const filteredTerms = terms.filter(
    (term) => term.session_id === selectedSession
  );

  // Filter classes by selected section
  const filteredClasses = classes.filter((classItem) => {
    return classItem.section?.name?.toLowerCase() === selectedSection?.toLowerCase();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verification
    if (!selectedSession || !selectedTerm) {
      toast({
        title: "Validation Error",
        description: "Please select academic session and term",
        variant: "destructive"
      });
      return;
    }

    if (isCombined) {
      if (!selectedClass && !selectedTahfeezClass) {
        toast({
          title: "Validation Error",
          description: "Please select at least one class to enroll",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!selectedClass) {
        toast({
          title: "Validation Error",
          description: "Please select a class to enroll",
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("student_id", student.id);
      formData.append("session_id", selectedSession);
      formData.append("term_id", selectedTerm);

      if (isCombined) {
        if (selectedClass) formData.append("class_id", selectedClass);
        if (selectedTahfeezClass) formData.append("tahfeez_class_id", selectedTahfeezClass);
      } else {
        formData.append("class_id", selectedClass);
      }

      const result = await enrollStudent(formData);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Student enrolled successfully",
        });
        onOpenChange(false);
        // Reset classes but keep session/term defaults
        setSelectedClass("");
        setSelectedTahfeezClass("");
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll student",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Enroll Student</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Enroll {student.first_name} {student.last_name} in a class ({isCombined ? "Combined Shift" : "Single Shift"}).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            
            {/* Academic Period */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Academic Period
              </h3>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="session" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Academic Session *</Label>
                  <Select
                    value={selectedSession}
                    onValueChange={(value) => {
                      setSelectedSession(value);
                      setSelectedTerm("");
                    }}
                    required
                  >
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id} className="text-xs">
                          {session.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Term *</Label>
                  {filteredTerms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {filteredTerms.map((term) => {
                        const isActive = selectedTerm === term.id;
                        return (
                          <button
                            key={term.id}
                            type="button"
                            onClick={() => setSelectedTerm(term.id)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-150",
                              isActive
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                            )}
                          >
                            {term.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Select a session first to view terms</p>
                  )}
                </div>
              </div>
            </div>

            {/* Class Placement */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Class Placement
              </h3>

              {isCombined ? (
                <div className="space-y-4">
                  {/* Islamiyya Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Islamiyya Class (Evening)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {classes
                        .filter((c) => c.section?.name?.toLowerCase() === "islamiyya")
                        .map((cls) => {
                          const isActive = selectedClass === cls.id;
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => setSelectedClass(isActive ? "" : cls.id)}
                              className={cn(
                                "px-2.5 py-2 text-left text-xs font-medium rounded-lg border transition-all duration-150 flex items-center justify-between",
                                isActive
                                  ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20"
                                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                              )}
                            >
                              <span className="truncate">{cls.name}</span>
                              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Tahfeez Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tahfeez Class (Morning)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {classes
                        .filter((c) => c.section?.name?.toLowerCase() === "tahfeez")
                        .map((cls) => {
                          const isActive = selectedTahfeezClass === cls.id;
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => setSelectedTahfeezClass(isActive ? "" : cls.id)}
                              className={cn(
                                "px-2.5 py-2 text-left text-xs font-medium rounded-lg border transition-all duration-150 flex items-center justify-between",
                                isActive
                                  ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20"
                                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                              )}
                            >
                              <span className="truncate">{cls.name}</span>
                              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Section Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Section *</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "islamiyya", label: "Islamiyya" },
                        { id: "tahfeez", label: "Tahfeez" },
                      ].map((sec) => {
                        const isActive = selectedSection?.toLowerCase() === sec.id;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              setSelectedSection(sec.id);
                              setSelectedClass("");
                            }}
                            className={cn(
                              "px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all duration-150",
                              isActive
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                            )}
                          >
                            {sec.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Class Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Class *</Label>
                    {filteredClasses.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {filteredClasses.map((cls) => {
                          const isActive = selectedClass === cls.id;
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => setSelectedClass(cls.id)}
                              className={cn(
                                "px-2.5 py-2 text-left text-xs font-medium rounded-lg border transition-all duration-150 flex items-center justify-between",
                                isActive
                                  ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20"
                                  : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                              )}
                            >
                              <span className="truncate">{cls.name}</span>
                              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No classes found in this section</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enroll Student</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
