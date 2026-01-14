-- Phase 1 MVP - Additional RLS Policies for new tables and features
-- This script adds only new policies for Phase 1 features
-- Existing policies on other tables are preserved

-- Enable RLS on new tables that may not have it yet
ALTER TABLE IF EXISTS fee_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS result_publication_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS result_publication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Removed IF NOT EXISTS syntax (not supported by PostgreSQL for policies)
-- Using DROP POLICY IF EXISTS followed by CREATE POLICY

-- FEE GENERATION LOGS - Admins only
DROP POLICY IF EXISTS "Admins can create fee logs" ON fee_generation_logs;
CREATE POLICY "Admins can create fee logs"
  ON fee_generation_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can view fee logs" ON fee_generation_logs;
CREATE POLICY "Admins can view fee logs"
  ON fee_generation_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    )
  );

-- RESULT PUBLICATION WORKFLOW - Teachers/admins manage
DROP POLICY IF EXISTS "Staff can manage result workflows" ON result_publication_workflow;
CREATE POLICY "Staff can manage result workflows"
  ON result_publication_workflow FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Parents can view published results workflow" ON result_publication_workflow;
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

-- RESULT PUBLICATION HISTORY - Audit trail, staff only
DROP POLICY IF EXISTS "Staff can view result history" ON result_publication_history;
CREATE POLICY "Staff can view result history"
  ON result_publication_history FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'teacher', 'cashier')
    )
  );

DROP POLICY IF EXISTS "System can create history records" ON result_publication_history;
CREATE POLICY "System can create history records"
  ON result_publication_history FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin', 'teacher')
    )
  );

-- DASHBOARD METRICS CACHE - Staff view for their own dashboards
DROP POLICY IF EXISTS "Staff can view dashboard metrics" ON dashboard_metrics_cache;
CREATE POLICY "Staff can view dashboard metrics"
  ON dashboard_metrics_cache FOR SELECT
  TO authenticated
  USING (
    (
      auth.uid() IN (
        SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
      )
      AND dashboard_type = 'admin'
    )
    OR
    (
      auth.uid() IN (
        SELECT user_id FROM user_roles WHERE role IN ('teacher')
      )
      AND dashboard_type = 'teacher'
    )
    OR
    (
      auth.uid() IN (
        SELECT user_id FROM user_roles WHERE role IN ('cashier', 'accountant')
      )
      AND dashboard_type = 'financial'
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
CREATE INDEX IF NOT EXISTS idx_result_publication_history_workflow_id ON result_publication_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_cache_dashboard_type ON dashboard_metrics_cache(dashboard_type);
