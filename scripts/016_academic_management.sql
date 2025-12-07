-- Assignments/Homework table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  total_marks INT DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'late')),
  marks_obtained INT,
  teacher_remarks TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Class timetable
CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 10),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number TEXT,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, day_of_week, period_number, session_id, term_id),
  UNIQUE(teacher_id, day_of_week, start_time, session_id, term_id) -- Prevent teacher double-booking
);

-- Attendance statistics view
CREATE OR REPLACE VIEW attendance_statistics AS
SELECT 
  s.id AS student_id,
  s.student_id AS student_number,
  s.first_name || ' ' || s.last_name AS student_name,
  c.id AS class_id,
  c.name AS class_name,
  sess.id AS session_id,
  t.id AS term_id,
  COUNT(*) FILTER (WHERE a.status = 'Present') AS days_present,
  COUNT(*) FILTER (WHERE a.status = 'Absent') AS days_absent,
  COUNT(*) FILTER (WHERE a.status = 'Late') AS days_late,
  COUNT(*) FILTER (WHERE a.status = 'Excused') AS days_excused,
  COUNT(*) AS total_days,
  ROUND(
    (COUNT(*) FILTER (WHERE a.status = 'Present')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) AS attendance_percentage
FROM students s
JOIN attendance a ON s.id = a.student_id
JOIN classes c ON a.class_id = c.id
JOIN sessions sess ON EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM sess.start_date)
JOIN terms t ON a.date BETWEEN t.start_date AND t.end_date
GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.id, c.name, sess.id, t.id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable(day_of_week);

-- RLS Policies for assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their assignments"
  ON assignments FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view assignments for their class"
  ON assignments FOR SELECT
  USING (
    class_id IN (
      SELECT se.class_id FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      WHERE s.user_id = auth.uid() AND se.is_active = TRUE
    )
  );

CREATE POLICY "Parents can view assignments for their children's classes"
  ON assignments FOR SELECT
  USING (
    class_id IN (
      SELECT se.class_id FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN guardian_students gs ON s.id = gs.student_id
      JOIN guardians g ON gs.guardian_id = g.id
      WHERE g.user_id = auth.uid() AND se.is_active = TRUE
    )
  );

-- RLS Policies for assignment submissions
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage submissions for their assignments"
  ON assignment_submissions FOR ALL
  USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can view their own submissions"
  ON assignment_submissions FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own submissions"
  ON assignment_submissions FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for timetable
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view timetables"
  ON timetable FOR SELECT
  USING (true);

CREATE POLICY "Teachers and admins can manage timetables"
  ON timetable FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers WHERE user_id = auth.uid()
    )
  );

-- Function to notify about new assignments
CREATE OR REPLACE FUNCTION notify_new_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_student RECORD;
  v_teacher_name TEXT;
BEGIN
  -- Get teacher name
  SELECT first_name || ' ' || last_name INTO v_teacher_name
  FROM teachers WHERE id = NEW.teacher_id;
  
  -- Notify all students in the class
  FOR v_student IN 
    SELECT s.id AS student_id, s.user_id
    FROM students s
    JOIN student_enrollments se ON s.id = se.student_id
    WHERE se.class_id = NEW.class_id 
    AND se.is_active = TRUE
  LOOP
    IF v_student.user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_student.user_id,
        'New Assignment: ' || NEW.title,
        'Due: ' || NEW.due_date::TEXT,
        'general',
        NEW.id,
        'assignment'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_assignment
  AFTER INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_assignment();

-- Function to check for overdue assignments
CREATE OR REPLACE FUNCTION mark_late_submissions()
RETURNS void AS $$
BEGIN
  UPDATE assignment_submissions
  SET status = 'late'
  WHERE status = 'pending'
  AND assignment_id IN (
    SELECT id FROM assignments 
    WHERE due_date < CURRENT_DATE 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_late_submissions IS 'Mark pending submissions as late after due date. Run this daily via cron job.';
