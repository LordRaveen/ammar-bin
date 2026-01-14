-- Phase 1 MVP Schema Enhancements
-- Adds tables and columns needed for fee templates, result publication, and dashboards

-- 1. Fee Generation Logs Table (track when invoices are auto-generated)
CREATE TABLE IF NOT EXISTS fee_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
  total_students_processed INTEGER NOT NULL,
  total_invoices_created INTEGER NOT NULL,
  generated_by UUID NOT NULL REFERENCES teachers(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Result Publication Workflow Table
CREATE TABLE IF NOT EXISTS result_publication_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_result_id UUID NOT NULL REFERENCES student_results(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, approved, published
  submitted_by UUID REFERENCES teachers(id),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES teachers(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Result Publication History (audit trail for result changes)
CREATE TABLE IF NOT EXISTS result_publication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_publication_id UUID NOT NULL REFERENCES result_publication_workflow(id),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Dashboard Metrics Cache (for performance optimization)
CREATE TABLE IF NOT EXISTS dashboard_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'admin_dashboard', 'parent_dashboard', 'teacher_dashboard'
  user_id UUID,
  metric_key TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  session_id UUID REFERENCES sessions(id),
  term_id UUID REFERENCES terms(id),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- Add columns to student_results for result publication tracking
ALTER TABLE student_results ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE student_results ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_results ADD COLUMN IF NOT EXISTS parent_can_view BOOLEAN DEFAULT FALSE;

-- Add column to track fee template application
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fee_structure_id UUID REFERENCES fee_structures(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS generated_from_template BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_generation_logs_session_term ON fee_generation_logs(session_id, term_id);
CREATE INDEX IF NOT EXISTS idx_result_publication_status ON result_publication_workflow(status);
CREATE INDEX IF NOT EXISTS idx_result_publication_student ON result_publication_workflow(student_result_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_user ON dashboard_metrics_cache(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_expires ON dashboard_metrics_cache(expires_at);

-- Enable RLS on new tables
ALTER TABLE fee_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_publication_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_publication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;

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
      WHERE student_guardians.student_id = result_publication_workflow.student_result_id
      AND student_guardians.guardian_id = (
        SELECT id FROM guardians WHERE user_id = auth.uid()
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

-- RLS Policies for dashboard_metrics_cache
CREATE POLICY "Users can view their own dashboard metrics"
  ON dashboard_metrics_cache
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "System can manage dashboard metrics"
  ON dashboard_metrics_cache
  FOR ALL
  USING (TRUE);
