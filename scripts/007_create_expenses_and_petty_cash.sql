-- Create expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_number TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  recorded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create petty cash transactions table
CREATE TABLE IF NOT EXISTS petty_cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IN', 'OUT')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  recorded_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_categories
CREATE POLICY "Everyone can view expense categories"
  ON expense_categories
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage expense categories"
  ON expense_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Create policies for expenses
CREATE POLICY "Admins and accountants can view expenses"
  ON expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

CREATE POLICY "Admins and accountants can manage expenses"
  ON expenses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

-- Create policies for petty_cash_transactions
CREATE POLICY "Admins and accountants can view petty cash"
  ON petty_cash_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

CREATE POLICY "Admins and accountants can manage petty cash"
  ON petty_cash_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'accountant')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_date ON expenses(payment_date);
CREATE INDEX IF NOT EXISTS idx_petty_cash_transaction_date ON petty_cash_transactions(transaction_date);

-- Insert default expense categories
INSERT INTO expense_categories (name, description) VALUES
  ('Utilities', 'Electricity, water, internet, etc.'),
  ('Salaries', 'Staff salaries and allowances'),
  ('Maintenance', 'Building and equipment maintenance'),
  ('Supplies', 'Office and school supplies'),
  ('Transportation', 'Vehicle fuel and maintenance'),
  ('Food', 'Student meals and refreshments'),
  ('Security', 'Security services and equipment'),
  ('Miscellaneous', 'Other expenses')
ON CONFLICT (name) DO NOTHING;
