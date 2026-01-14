-- Phase 1 MVP Security Policies - Enable RLS on all tables and implement role-based access control

-- Enable RLS on tables that don't have it yet
ALTER TABLE grading_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahfeez_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- GRADING SCHEMES - Public read, admin write
DROP POLICY IF EXISTS "Everyone can view grading schemes" ON grading_schemes;
DROP POLICY IF EXISTS "Admins can manage grading schemes" ON grading_schemes;

CREATE POLICY "Everyone can view grading schemes"
  ON grading_schemes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage grading schemes"
  ON grading_schemes FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin' OR role = 'admin'
    )
  );

-- STUDENT RESULTS - Staff see all, parents see own children, admins see all
DROP POLICY IF EXISTS "Admins can manage student results" ON student_results;
DROP POLICY IF EXISTS "Staff can view student results" ON student_results;
DROP POLICY IF EXISTS "Parents can view own children results" ON student_results;

CREATE POLICY "Admins can manage student results"
  ON student_results FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin' OR role = 'admin'
    )
  );

CREATE POLICY "Staff can view student results"
  ON student_results FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('teacher', 'cashier', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Parents can view published results of own children"
  ON student_results FOR SELECT
  TO authenticated
  USING (
    is_published = true AND
    auth.uid() IN (
      SELECT DISTINCT g.user_id
      FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE sg.student_id = student_results.student_id
    )
  );

-- STUDENT SCORES - Teachers enter for their subjects, staff view, admins manage
DROP POLICY IF EXISTS "Teachers can enter scores for assigned subjects" ON student_scores;
DROP POLICY IF EXISTS "Teachers can update scores for assigned subjects" ON student_scores;
DROP POLICY IF EXISTS "Staff and parents can view scores" ON student_scores;
DROP POLICY IF EXISTS "Admins can delete scores" ON student_scores;

CREATE POLICY "Teachers can enter scores for assigned subjects"
  ON student_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT DISTINCT tsa.teacher_id
      FROM teacher_subject_assignments tsa
      JOIN assessments a ON tsa.subject_id = a.subject_id
      WHERE a.id = student_scores.assessment_id
    )
  );

CREATE POLICY "Teachers can update scores for assigned subjects"
  ON student_scores FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT DISTINCT tsa.teacher_id
      FROM teacher_subject_assignments tsa
      JOIN assessments a ON tsa.subject_id = a.subject_id
      WHERE a.id = student_scores.assessment_id
    )
  );

CREATE POLICY "Staff and parents can view scores"
  ON student_scores FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('teacher', 'cashier', 'admin', 'super_admin')
    )
    OR
    auth.uid() IN (
      SELECT DISTINCT g.user_id
      FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE sg.student_id = student_scores.student_id
    )
  );

CREATE POLICY "Admins can delete scores"
  ON student_scores FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin' OR role = 'admin'
    )
  );

-- STUDENTS - Staff view all, admins manage, parents see own children
DROP POLICY IF EXISTS "Admins can manage students" ON students;
DROP POLICY IF EXISTS "Staff can view students" ON students;
DROP POLICY IF EXISTS "Parents can view own children" ON students;

CREATE POLICY "Admins can manage students"
  ON students FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin' OR role = 'admin'
    )
  );

CREATE POLICY "Staff can view all students"
  ON students FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('teacher', 'cashier', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Parents can view own children"
  ON students FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT DISTINCT g.user_id
      FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE sg.student_id = students.id
    )
  );

-- GUARDIANS - Parents see own record, admins manage all
DROP POLICY IF EXISTS "Admins can manage guardians" ON guardians;
DROP POLICY IF EXISTS "Admins can view guardians" ON guardians;
DROP POLICY IF EXISTS "Parents can view own record" ON guardians;

CREATE POLICY "Admins can manage guardians"
  ON guardians FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin' OR role = 'admin'
    )
  );

CREATE POLICY "Admins can view all guardians"
  ON guardians FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'super_admin' OR role = 'admin'
    )
  );

CREATE POLICY "Parents can view own record"
  ON guardians FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INVOICES - Admins manage, staff/parents view
DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Staff can view invoices" ON invoices;
DROP POLICY IF EXISTS "Parents can view own children invoices" ON invoices;

CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'cashier', 'accountant')
    )
  );

CREATE POLICY "Staff can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'cashier', 'accountant', 'teacher')
    )
  );

CREATE POLICY "Parents can view own children invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT DISTINCT g.user_id
      FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE sg.student_id = invoices.student_id
    )
  );

-- PAYMENTS - Admins manage, staff/parents view
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
DROP POLICY IF EXISTS "Staff can view payments" ON payments;
DROP POLICY IF EXISTS "Parents can view own children payments" ON payments;

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'cashier', 'accountant')
    )
  );

CREATE POLICY "Staff can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'cashier', 'accountant', 'teacher')
    )
  );

CREATE POLICY "Parents can view own children payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT DISTINCT g.user_id
      FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      WHERE sg.student_id = payments.student_id
    )
  );

-- ASSESSMENTS - Staff view, admins manage
DROP POLICY IF EXISTS "Staff can view assessments" ON assessments;
DROP POLICY IF EXISTS "Admins can manage assessments" ON assessments;

CREATE POLICY "Staff can view assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'teacher', 'cashier')
    )
  );

CREATE POLICY "Admins can manage assessments"
  ON assessments FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    )
  );

-- FEE GENERATION LOGS - Admins only
DROP POLICY IF EXISTS "Admins can create fee logs" ON fee_generation_logs;
DROP POLICY IF EXISTS "Admins can view fee logs" ON fee_generation_logs;

CREATE POLICY "Admins can create fee logs"
  ON fee_generation_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view fee logs"
  ON fee_generation_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    )
  );

-- RESULT PUBLICATION WORKFLOW - Teachers/admins manage, parents view published
DROP POLICY IF EXISTS "Staff can manage workflows" ON result_publication_workflow;
DROP POLICY IF EXISTS "Parents can view published results workflow" ON result_publication_workflow;

CREATE POLICY "Staff can manage result workflows"
  ON result_publication_workflow FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'teacher')
    )
  );

CREATE POLICY "Parents can view published results workflow"
  ON result_publication_workflow FOR SELECT
  TO authenticated
  USING (
    (status = 'published' OR status = 'approved') AND
    auth.uid() IN (
      SELECT DISTINCT g.user_id
      FROM student_guardians sg
      JOIN guardians g ON sg.guardian_id = g.id
      JOIN student_results sr ON sr.id = result_publication_workflow.student_result_id
      WHERE sg.student_id = sr.student_id
    )
  );

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id ON student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian_id ON student_guardians(guardian_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_student_scores_student_id ON student_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_student_scores_assessment_id ON student_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_student_results_student_id ON student_results(student_id);
CREATE INDEX IF NOT EXISTS idx_student_results_is_published ON student_results(is_published);
CREATE INDEX IF NOT EXISTS idx_fee_generation_logs_fee_structure_id ON fee_generation_logs(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_result_publication_workflow_status ON result_publication_workflow(status);
