-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  discount_type TEXT CHECK (discount_type IN ('Percentage', 'Fixed', 'Waiver')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment reversals table
CREATE TABLE IF NOT EXISTS payment_reversals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  reversed_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reversals ENABLE ROW LEVEL SECURITY;

-- Create policies for discounts
CREATE POLICY "Admins can manage discounts"
  ON discounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Staff can view discounts"
  ON discounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'accountant', 'teacher')
    )
  );

-- Create policies for payment_reversals
CREATE POLICY "Admins can manage payment reversals"
  ON payment_reversals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Staff can view payment reversals"
  ON payment_reversals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discounts_invoice_id ON discounts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_discounts_student_id ON discounts(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_reversals_payment_id ON payment_reversals(payment_id);
