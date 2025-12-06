-- Daily reconciliation tracking table

CREATE TABLE IF NOT EXISTS daily_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date DATE NOT NULL UNIQUE,
  reconciled_by UUID REFERENCES auth.users(id),
  reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Expected totals from system
  expected_cash NUMERIC(12,2) DEFAULT 0,
  expected_pos NUMERIC(12,2) DEFAULT 0,
  expected_transfer NUMERIC(12,2) DEFAULT 0,
  expected_total NUMERIC(12,2) DEFAULT 0,
  
  -- Actual counted totals
  actual_cash NUMERIC(12,2) DEFAULT 0,
  actual_pos NUMERIC(12,2) DEFAULT 0,
  actual_transfer NUMERIC(12,2) DEFAULT 0,
  actual_total NUMERIC(12,2) DEFAULT 0,
  
  -- Variances
  cash_variance NUMERIC(12,2) DEFAULT 0,
  pos_variance NUMERIC(12,2) DEFAULT 0,
  transfer_variance NUMERIC(12,2) DEFAULT 0,
  total_variance NUMERIC(12,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Submitted', 'Approved', 'Rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_daily_reconciliations_date ON daily_reconciliations(reconciliation_date DESC);
CREATE INDEX idx_daily_reconciliations_status ON daily_reconciliations(status);

-- Enable RLS
ALTER TABLE daily_reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Cashiers and accountants can view reconciliations"
  ON daily_reconciliations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.user_id = auth.uid()
      AND teachers.role IN ('admin', 'accountant', 'cashier')
    )
  );

CREATE POLICY "Cashiers can create and update own reconciliations"
  ON daily_reconciliations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE teachers.user_id = auth.uid()
      AND teachers.role IN ('admin', 'accountant', 'cashier')
    )
  );

-- Function to calculate expected totals for a date
CREATE OR REPLACE FUNCTION get_expected_totals_for_date(target_date DATE)
RETURNS TABLE (
  cash NUMERIC,
  pos NUMERIC,
  transfer NUMERIC,
  total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END), 0) as cash,
    COALESCE(SUM(CASE WHEN payment_method = 'POS' THEN amount ELSE 0 END), 0) as pos,
    COALESCE(SUM(CASE WHEN payment_method = 'Bank Transfer' THEN amount ELSE 0 END), 0) as transfer,
    COALESCE(SUM(amount), 0) as total
  FROM payments
  WHERE payment_date = target_date;
END;
$$ LANGUAGE plpgsql;
