-- Reporting System SQL Script
-- Creates tables and views for comprehensive reporting
-- Fixed to match actual database schema

-- ============================================================================
-- SAVED REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- 'academic', 'financial', 'attendance', 'custom'
  configuration JSONB NOT NULL, -- Stores report columns, filters, grouping
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  schedule_config JSONB -- For automated report generation
);

-- ============================================================================
-- REPORT EXECUTION HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES saved_reports(id) ON DELETE CASCADE,
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  parameters JSONB,
  result_count INTEGER,
  execution_time_ms INTEGER,
  status VARCHAR(20) DEFAULT 'success' -- 'success', 'failed', 'timeout'
);

-- ============================================================================
-- ACADEMIC PERFORMANCE SUMMARY VIEW
-- ============================================================================
-- Fixed to use actual tables: student_enrollments, student_scores, assessments, terms
CREATE OR REPLACE VIEW vw_academic_performance AS
SELECT 
  s.id AS student_id,
  s.student_id AS student_number,
  s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name AS student_name,
  c.name AS class_name,
  se.name AS session_name,
  t.name AS term_name,
  COUNT(DISTINCT ss.assessment_id) AS total_assessments,
  ROUND(AVG(ss.score::NUMERIC), 2) AS average_score,
  ROUND(AVG((ss.score::NUMERIC / a.total_marks::NUMERIC) * 100), 2) AS average_percentage,
  RANK() OVER (PARTITION BY c.id, se.id, t.id ORDER BY AVG(ss.score) DESC) AS class_rank
FROM students s
JOIN student_enrollments enr ON s.id = enr.student_id AND enr.is_active = true
JOIN classes c ON enr.class_id = c.id
JOIN sessions se ON enr.session_id = se.id
JOIN terms t ON enr.term_id = t.id
JOIN student_scores ss ON s.id = ss.student_id
JOIN assessments a ON ss.assessment_id = a.id AND a.session_id = se.id AND a.term_id = t.id
WHERE s.status = 'active'
  AND s.deleted_at IS NULL
GROUP BY s.id, s.student_id, s.first_name, s.middle_name, s.last_name, c.name, c.id, se.name, se.id, t.name, t.id;

-- ============================================================================
-- SUBJECT PERFORMANCE VIEW
-- ============================================================================
-- Fixed to use student_scores, assessments with proper joins
CREATE OR REPLACE VIEW vw_subject_performance AS
SELECT 
  sub.id AS subject_id,
  sub.name AS subject_name,
  sub.code AS subject_code,
  c.name AS class_name,
  se.name AS session_name,
  t.name AS term_name,
  COUNT(DISTINCT ss.student_id) AS student_count,
  ROUND(AVG(ss.score::NUMERIC), 2) AS avg_score,
  ROUND(AVG((ss.score::NUMERIC / a.total_marks::NUMERIC) * 100), 2) AS avg_percentage,
  MIN(ss.score) AS min_score,
  MAX(ss.score) AS max_score,
  COUNT(CASE WHEN ss.score >= cs.pass_mark THEN 1 END) AS students_passed,
  COUNT(CASE WHEN ss.score < cs.pass_mark THEN 1 END) AS students_failed
FROM subjects sub
JOIN assessments a ON sub.id = a.subject_id
JOIN student_scores ss ON a.id = ss.assessment_id
JOIN classes c ON a.class_id = c.id
JOIN class_subjects cs ON c.id = cs.class_id AND sub.id = cs.subject_id
JOIN sessions se ON a.session_id = se.id
JOIN terms t ON a.term_id = t.id
WHERE sub.is_active = true
GROUP BY sub.id, sub.name, sub.code, c.name, se.name, t.name;

-- ============================================================================
-- TEACHER WORKLOAD VIEW
-- ============================================================================
-- Fixed to use teacher_subject_assignments and teacher_class_assignments
CREATE OR REPLACE VIEW vw_teacher_workload AS
SELECT 
  t.id AS teacher_id,
  t.staff_id,
  t.first_name || ' ' || COALESCE(t.middle_name || ' ', '') || t.last_name AS teacher_name,
  COUNT(DISTINCT tca.class_id) AS classes_assigned,
  COUNT(DISTINCT tsa.subject_id) AS subjects_taught,
  COUNT(DISTINCT se.student_id) AS total_students,
  COUNT(DISTINCT a.id) AS assignments_created,
  COUNT(DISTINCT CASE WHEN tca.is_class_teacher = true THEN tca.class_id END) AS classes_as_class_teacher
FROM teachers t
LEFT JOIN teacher_class_assignments tca ON t.id = tca.teacher_id
LEFT JOIN teacher_subject_assignments tsa ON t.id = tsa.teacher_id
LEFT JOIN student_enrollments se ON tsa.class_id = se.class_id AND se.is_active = true
LEFT JOIN assignments a ON t.id = a.teacher_id
WHERE t.status = 'active'
  AND t.deleted_at IS NULL
GROUP BY t.id, t.staff_id, t.first_name, t.middle_name, t.last_name;

-- ============================================================================
-- CLASS PERFORMANCE VIEW
-- ============================================================================
-- New view for class-level performance analytics
CREATE OR REPLACE VIEW vw_class_performance AS
SELECT 
  c.id AS class_id,
  c.name AS class_name,
  se.name AS session_name,
  t.name AS term_name,
  COUNT(DISTINCT enr.student_id) AS total_students,
  COUNT(DISTINCT sub.id) AS subjects_offered,
  ROUND(AVG(ss.score::NUMERIC), 2) AS class_average_score,
  ROUND(AVG((ss.score::NUMERIC / a.total_marks::NUMERIC) * 100), 2) AS class_average_percentage,
  teacher.first_name || ' ' || teacher.last_name AS class_teacher
FROM classes c
JOIN student_enrollments enr ON c.id = enr.class_id AND enr.is_active = true
JOIN sessions se ON enr.session_id = se.id
JOIN terms t ON enr.term_id = t.id
LEFT JOIN assessments a ON c.id = a.class_id AND a.session_id = se.id AND a.term_id = t.id
LEFT JOIN student_scores ss ON a.id = ss.assessment_id
LEFT JOIN class_subjects cs ON c.id = cs.class_id
LEFT JOIN subjects sub ON cs.subject_id = sub.id
LEFT JOIN teacher_class_assignments tca ON c.id = tca.class_id AND tca.is_class_teacher = true
LEFT JOIN teachers teacher ON tca.teacher_id = teacher.id
WHERE c.is_active = true
  AND c.deleted_at IS NULL
GROUP BY c.id, c.name, se.name, t.name, teacher.first_name, teacher.last_name;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR SAVED REPORTS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own reports" ON saved_reports;
CREATE POLICY "Users can view their own reports" ON saved_reports
  FOR SELECT USING (created_by = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "Users can create reports" ON saved_reports;
CREATE POLICY "Users can create reports" ON saved_reports
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reports" ON saved_reports;
CREATE POLICY "Users can update their own reports" ON saved_reports
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own reports" ON saved_reports;
CREATE POLICY "Users can delete their own reports" ON saved_reports
  FOR DELETE USING (created_by = auth.uid());

-- ============================================================================
-- RLS POLICIES FOR REPORT EXECUTIONS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own executions" ON report_executions;
CREATE POLICY "Users can view their own executions" ON report_executions
  FOR SELECT USING (executed_by = auth.uid());

DROP POLICY IF EXISTS "Users can create executions" ON report_executions;
CREATE POLICY "Users can create executions" ON report_executions
  FOR INSERT WITH CHECK (executed_by = auth.uid());

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_saved_reports_created_by ON saved_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_reports_type ON saved_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_saved_reports_public ON saved_reports(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_executed_by ON report_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================
COMMENT ON TABLE saved_reports IS 'Stores custom report configurations for reusable reporting';
COMMENT ON TABLE report_executions IS 'Tracks report execution history and performance';
COMMENT ON VIEW vw_academic_performance IS 'Academic performance summary by student, class, and term';
COMMENT ON VIEW vw_subject_performance IS 'Subject-level performance analytics with pass/fail rates';
COMMENT ON VIEW vw_teacher_workload IS 'Teacher workload and assignment metrics';
COMMENT ON VIEW vw_class_performance IS 'Class-level performance overview with averages';
