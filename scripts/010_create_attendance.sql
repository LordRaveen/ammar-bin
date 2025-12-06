-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')) DEFAULT 'Present',
  remarks TEXT,
  recorded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view attendance" ON attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'teacher', 'cashier', 'accountant')
    )
  );

CREATE POLICY "Parents can view their children's attendance" ON attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardians g
      INNER JOIN student_guardians sg ON sg.guardian_id = g.id
      WHERE g.user_id = auth.uid()
      AND sg.student_id = attendance.student_id
    )
  );

CREATE POLICY "Teachers and admins can manage attendance" ON attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'teacher')
    )
  );

COMMENT ON TABLE attendance IS 'Student attendance records';
COMMENT ON COLUMN attendance.status IS 'Present, Absent, Late, or Excused';
