-- Create saved reports table for custom report builder
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

-- Create report execution history
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

-- Academic performance summary view
CREATE OR REPLACE VIEW vw_academic_performance AS
SELECT 
  s.id AS student_id,
  s.student_id AS student_number,
  s.first_name || ' ' || s.last_name AS student_name,
  c.name AS class_name,
  se.name AS session_name,
  se.term,
  COUNT(DISTINCT r.id) AS total_assessments,
  ROUND(AVG(r.total_score), 2) AS average_score,
  ROUND(AVG((r.total_score::FLOAT / r.max_score::FLOAT) * 100), 2) AS average_percentage,
  RANK() OVER (PARTITION BY c.id, se.id ORDER BY AVG(r.total_score) DESC) AS class_rank
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN results r ON s.id = r.student_id
JOIN sessions se ON r.session_id = se.id
WHERE s.status = 'active'
  AND s.deleted_at IS NULL
GROUP BY s.id, s.student_id, s.first_name, s.last_name, c.name, c.id, se.name, se.id, se.term;

-- Subject performance view
CREATE OR REPLACE VIEW vw_subject_performance AS
SELECT 
  sub.id AS subject_id,
  sub.name AS subject_name,
  c.name AS class_name,
  se.name AS session_name,
  se.term,
  COUNT(DISTINCT r.student_id) AS student_count,
  ROUND(AVG(r.total_score), 2) AS avg_score,
  ROUND(AVG((r.total_score::FLOAT / r.max_score::FLOAT) * 100), 2) AS avg_percentage,
  MIN(r.total_score) AS min_score,
  MAX(r.total_score) AS max_score
FROM subjects sub
JOIN results r ON sub.id = r.subject_id
JOIN classes c ON r.class_id = c.id
JOIN sessions se ON r.session_id = se.id
GROUP BY sub.id, sub.name, c.name, se.name, se.term;

-- Teacher workload view
CREATE OR REPLACE VIEW vw_teacher_workload AS
SELECT 
  t.id AS teacher_id,
  t.staff_id,
  t.first_name || ' ' || t.last_name AS teacher_name,
  COUNT(DISTINCT cs.class_id) AS classes_taught,
  COUNT(DISTINCT cs.subject_id) AS subjects_taught,
  COUNT(DISTINCT s.id) AS total_students,
  COUNT(DISTINCT a.id) AS assignments_created
FROM teachers t
LEFT JOIN class_subjects cs ON t.id = cs.teacher_id
LEFT JOIN students s ON cs.class_id = s.class_id
LEFT JOIN assignments a ON t.user_id = a.created_by
WHERE t.status = 'active'
  AND t.deleted_at IS NULL
GROUP BY t.id, t.staff_id, t.first_name, t.last_name;

-- Enable RLS
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved reports
CREATE POLICY "Users can view their own reports" ON saved_reports
  FOR SELECT USING (created_by = auth.uid() OR is_public = true);

CREATE POLICY "Users can create reports" ON saved_reports
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own reports" ON saved_reports
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own reports" ON saved_reports
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for report executions
CREATE POLICY "Users can view their own executions" ON report_executions
  FOR SELECT USING (executed_by = auth.uid());

CREATE POLICY "Users can create executions" ON report_executions
  FOR INSERT WITH CHECK (executed_by = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_reports_created_by ON saved_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_reports_type ON saved_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_executed_by ON report_executions(executed_by);

COMMENT ON TABLE saved_reports IS 'Stores custom report configurations for reusable reporting';
COMMENT ON TABLE report_executions IS 'Tracks report execution history and performance';
