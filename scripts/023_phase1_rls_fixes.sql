-- Drop conflicting policies and recreate with correct column names
DROP POLICY IF EXISTS "Admins can view fee generation logs" ON fee_generation_logs;
DROP POLICY IF EXISTS "Admins can create fee generation logs" ON fee_generation_logs;
DROP POLICY IF EXISTS "Teachers and admins can manage result workflows" ON result_publication_workflow;
DROP POLICY IF EXISTS "Parents can view published results" ON result_publication_workflow;
DROP POLICY IF EXISTS "Staff can view result history" ON result_publication_history;
DROP POLICY IF EXISTS "Users can view their own dashboard metrics" ON dashboard_metrics_cache;
DROP POLICY IF EXISTS "System can manage dashboard metrics" ON dashboard_metrics_cache;

-- RLS Policies for fee_generation_logs
CREATE POLICY "Admins can view fee generation logs"
  ON fee_generation_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can create fee generation logs"
  ON fee_generation_logs
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  ));

-- RLS Policies for result_publication_workflow
CREATE POLICY "Teachers and admins can manage result workflows"
  ON result_publication_workflow
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin', 'teacher')
  ));

CREATE POLICY "Parents can view published results"
  ON result_publication_workflow
  FOR SELECT
  USING (
    status = 'published' 
    AND EXISTS (
      SELECT 1 FROM student_guardians 
      WHERE student_guardians.student_id IN (
        SELECT student_id FROM student_results 
        WHERE student_results.id = result_publication_workflow.student_result_id
      )
      AND student_guardians.guardian_id = (
        SELECT id FROM guardians WHERE user_id = auth.uid() LIMIT 1
      )
    )
  );

-- RLS Policies for result_publication_history
CREATE POLICY "Staff can view result history"
  ON result_publication_history
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin', 'teacher')
  ));

-- RLS Policies for dashboard_metrics_cache (using correct column: metric_type, not dashboard_type)
CREATE POLICY "Users can view their own dashboard metrics"
  ON dashboard_metrics_cache
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "System can manage dashboard metrics"
  ON dashboard_metrics_cache
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "System can update dashboard metrics"
  ON dashboard_metrics_cache
  FOR UPDATE
  USING (TRUE);
