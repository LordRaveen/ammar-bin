"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTahfeezClass, setSelectedTahfeezClass] = useState("");

  const filteredTerms = terms.filter(
    (term) => term.session_id === selectedSession
  );

  const isCombined = student?.enrollment_type === "combined" || student?.student_id?.startsWith("ABYI/CMB");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setSelectedSession("");
        setSelectedTerm("");
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
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
          <DialogDescription>
            Enroll {student.first_name} {student.last_name} in a class for a
            session and term. ({isCombined ? "Combined/Dual Shift" : "Single Shift"})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session">Academic Session *</Label>
            <Select
              value={selectedSession}
              onValueChange={(value) => {
                setSelectedSession(value);
                setSelectedTerm("");
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term *</Label>
            <Select
              value={selectedTerm}
              onValueChange={setSelectedTerm}
              disabled={!selectedSession}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {filteredTerms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCombined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Islamiyya Class (Evening) *</Label>
                <Select
                  value={selectedClass}
                  onValueChange={setSelectedClass}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Islamiyya class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes
                      .filter((c) => c.section?.name?.toLowerCase() === "islamiyya")
                      .map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tahfeez_class">Tahfeez Class (Morning) *</Label>
                <Select
                  value={selectedTahfeezClass}
                  onValueChange={setSelectedTahfeezClass}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tahfeez class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes
                      .filter((c) => c.section?.name?.toLowerCase() === "tahfeez")
                      .map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .filter((classItem) => {
                      const type = student?.enrollment_type || (student?.student_id?.startsWith("ABYI/TAH") ? "tahfeez" : "islamiyya");
                      return classItem.section?.name?.toLowerCase() === type.toLowerCase();
                    })
                    .map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enrolling..." : "Enroll Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
