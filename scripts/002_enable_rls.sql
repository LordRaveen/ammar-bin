-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahfeez_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
    AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
    AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is accountant
CREATE OR REPLACE FUNCTION is_accountant()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'accountant')
    AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is parent
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'parent'
    AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES: SCHOOL SETTINGS
-- ============================================

-- Everyone can view school settings
CREATE POLICY "Anyone can view school settings"
ON school_settings FOR SELECT
USING (true);

-- Only admins can update school settings
CREATE POLICY "Admins can update school settings"
ON school_settings FOR UPDATE
USING (is_admin());

-- ============================================
-- RLS POLICIES: CONFIGURATION TABLES
-- ============================================

-- Sessions: Everyone can read, only admins can write
CREATE POLICY "Anyone can view sessions"
ON sessions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sessions"
ON sessions FOR ALL
USING (is_admin());

-- Terms: Everyone can read, only admins can write
CREATE POLICY "Anyone can view terms"
ON terms FOR SELECT
USING (true);

CREATE POLICY "Admins can manage terms"
ON terms FOR ALL
USING (is_admin());

-- Sections: Everyone can read, only admins can write
CREATE POLICY "Anyone can view sections"
ON sections FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sections"
ON sections FOR ALL
USING (is_admin());

-- Classes: Everyone can read, only admins can write
CREATE POLICY "Anyone can view classes"
ON classes FOR SELECT
USING (true);

CREATE POLICY "Admins can manage classes"
ON classes FOR ALL
USING (is_admin());

-- Subjects: Everyone can read, only admins can write
CREATE POLICY "Anyone can view subjects"
ON subjects FOR SELECT
USING (true);

CREATE POLICY "Admins can manage subjects"
ON subjects FOR ALL
USING (is_admin());

-- Class Subjects: Everyone can read, only admins can write
CREATE POLICY "Anyone can view class subjects"
ON class_subjects FOR SELECT
USING (true);

CREATE POLICY "Admins can manage class subjects"
ON class_subjects FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: USER ROLES
-- ============================================

-- Users can view their own role
CREATE POLICY "Users can view their own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid() OR is_admin());

-- Only admins can manage roles
CREATE POLICY "Admins can manage user roles"
ON user_roles FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: TEACHERS
-- ============================================

-- Teachers can view all teachers, admins can do anything
CREATE POLICY "Teachers and admins can view teachers"
ON teachers FOR SELECT
USING (is_teacher() OR is_admin());

-- Only admins can manage teachers
CREATE POLICY "Admins can manage teachers"
ON teachers FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update teachers"
ON teachers FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete teachers"
ON teachers FOR DELETE
USING (is_admin());

-- ============================================
-- RLS POLICIES: GUARDIANS
-- ============================================

-- Admins can view all guardians, parents can view their own record
CREATE POLICY "Admins and self can view guardians"
ON guardians FOR SELECT
USING (is_admin() OR user_id = auth.uid());

-- Only admins can create guardians
CREATE POLICY "Admins can insert guardians"
ON guardians FOR INSERT
WITH CHECK (is_admin());

-- Only admins can update guardians
CREATE POLICY "Admins can update guardians"
ON guardians FOR UPDATE
USING (is_admin());

-- Only admins can delete guardians
CREATE POLICY "Admins can delete guardians"
ON guardians FOR DELETE
USING (is_admin());

-- ============================================
-- RLS POLICIES: STUDENTS
-- ============================================

-- Teachers and admins can view all students
-- Parents can view their linked students
CREATE POLICY "Staff can view all students"
ON students FOR SELECT
USING (
  is_admin() OR 
  is_teacher() OR 
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND sg.student_id = students.id
  )
);

-- Only admins can manage students
CREATE POLICY "Admins can manage students"
ON students FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: STUDENT GUARDIANS
-- ============================================

CREATE POLICY "Staff and parents can view student guardians"
ON student_guardians FOR SELECT
USING (
  is_admin() OR 
  is_teacher() OR
  EXISTS (
    SELECT 1 FROM guardians g
    WHERE g.user_id = auth.uid() AND g.id = student_guardians.guardian_id
  )
);

CREATE POLICY "Admins can manage student guardians"
ON student_guardians FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: ENROLLMENTS
-- ============================================

CREATE POLICY "Staff and parents can view enrollments"
ON student_enrollments FOR SELECT
USING (
  is_admin() OR 
  is_teacher() OR
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND sg.student_id = student_enrollments.student_id
  )
);

CREATE POLICY "Admins can manage enrollments"
ON student_enrollments FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: TEACHER ASSIGNMENTS
-- ============================================

CREATE POLICY "Staff can view teacher assignments"
ON teacher_class_assignments FOR SELECT
USING (is_admin() OR is_teacher());

CREATE POLICY "Admins can manage teacher class assignments"
ON teacher_class_assignments FOR ALL
USING (is_admin());

CREATE POLICY "Staff can view teacher subject assignments"
ON teacher_subject_assignments FOR SELECT
USING (is_admin() OR is_teacher());

CREATE POLICY "Admins can manage teacher subject assignments"
ON teacher_subject_assignments FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: ASSESSMENTS
-- ============================================

CREATE POLICY "Staff can view assessment types"
ON assessment_types FOR SELECT
USING (is_admin() OR is_teacher());

CREATE POLICY "Admins can manage assessment types"
ON assessment_types FOR ALL
USING (is_admin());

CREATE POLICY "Staff can view assessments"
ON assessments FOR SELECT
USING (is_admin() OR is_teacher());

CREATE POLICY "Admins can manage assessments"
ON assessments FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: STUDENT SCORES
-- ============================================

-- Teachers can view scores for their assigned classes
-- Admins can view all
-- Parents can view their children's scores
CREATE POLICY "Staff and parents can view student scores"
ON student_scores FOR SELECT
USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM assessments a
    JOIN teacher_subject_assignments tsa ON (
      tsa.class_id = a.class_id AND 
      tsa.subject_id = a.subject_id AND
      tsa.session_id = a.session_id
    )
    JOIN teachers t ON t.id = tsa.teacher_id
    WHERE t.user_id = auth.uid() AND a.id = student_scores.assessment_id
  ) OR
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND sg.student_id = student_scores.student_id
  )
);

-- Teachers can enter scores for their assigned subjects
CREATE POLICY "Teachers can enter scores for assigned subjects"
ON student_scores FOR INSERT
WITH CHECK (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM assessments a
    JOIN teacher_subject_assignments tsa ON (
      tsa.class_id = a.class_id AND 
      tsa.subject_id = a.subject_id AND
      tsa.session_id = a.session_id
    )
    JOIN teachers t ON t.id = tsa.teacher_id
    WHERE t.user_id = auth.uid() AND a.id = student_scores.assessment_id
  )
);

-- Teachers can update scores for their assigned subjects
CREATE POLICY "Teachers can update scores for assigned subjects"
ON student_scores FOR UPDATE
USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM assessments a
    JOIN teacher_subject_assignments tsa ON (
      tsa.class_id = a.class_id AND 
      tsa.subject_id = a.subject_id AND
      tsa.session_id = a.session_id
    )
    JOIN teachers t ON t.id = tsa.teacher_id
    WHERE t.user_id = auth.uid() AND a.id = student_scores.assessment_id
  )
);

-- Only admins can delete scores
CREATE POLICY "Admins can delete student scores"
ON student_scores FOR DELETE
USING (is_admin());

-- ============================================
-- RLS POLICIES: GRADING SCHEMES
-- ============================================

CREATE POLICY "Everyone can view grading schemes"
ON grading_schemes FOR SELECT
USING (true);

CREATE POLICY "Admins can manage grading schemes"
ON grading_schemes FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: STUDENT RESULTS
-- ============================================

CREATE POLICY "Staff and parents can view student results"
ON student_results FOR SELECT
USING (
  is_admin() OR 
  is_teacher() OR
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND sg.student_id = student_results.student_id
  )
);

CREATE POLICY "Admins can manage student results"
ON student_results FOR ALL
USING (is_admin());

-- ============================================
-- RLS POLICIES: TAHFEEZ ASSESSMENTS
-- ============================================

CREATE POLICY "Staff and parents can view tahfeez assessments"
ON tahfeez_assessments FOR SELECT
USING (
  is_admin() OR 
  is_teacher() OR
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND sg.student_id = tahfeez_assessments.student_id
  )
);

CREATE POLICY "Teachers and admins can manage tahfeez assessments"
ON tahfeez_assessments FOR ALL
USING (is_admin() OR is_teacher());

-- ============================================
-- RLS POLICIES: FINANCIAL TABLES
-- ============================================

-- Fee Categories
CREATE POLICY "Everyone can view fee categories"
ON fee_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage fee categories"
ON fee_categories FOR ALL
USING (is_admin());

-- Fee Structures
CREATE POLICY "Everyone can view fee structures"
ON fee_structures FOR SELECT
USING (true);

CREATE POLICY "Admins can manage fee structures"
ON fee_structures FOR ALL
USING (is_admin());

-- Invoices
CREATE POLICY "Staff and parents can view invoices"
ON invoices FOR SELECT
USING (
  is_admin() OR 
  is_accountant() OR
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND sg.student_id = invoices.student_id
  )
);

CREATE POLICY "Admins and accountants can manage invoices"
ON invoices FOR ALL
USING (is_admin() OR is_accountant());

-- Invoice Items
CREATE POLICY "Staff and parents can view invoice items"
ON invoice_items FOR SELECT
USING (
  is_admin() OR 
  is_accountant() OR
  EXISTS (
    SELECT 1 FROM invoices i
    JOIN student_guardians sg ON sg.student_id = i.student_id
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND i.id = invoice_items.invoice_id
  )
);

CREATE POLICY "Admins and accountants can manage invoice items"
ON invoice_items FOR ALL
USING (is_admin() OR is_accountant());

-- Payments
CREATE POLICY "Staff and parents can view payments"
ON payments FOR SELECT
USING (
  is_admin() OR 
  is_accountant() OR
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid() AND sg.student_id = payments.student_id
  )
);

CREATE POLICY "Admins and accountants can manage payments"
ON payments FOR ALL
USING (is_admin() OR is_accountant());
