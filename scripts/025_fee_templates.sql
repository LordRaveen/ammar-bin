-- Add tables and columns needed for fee templates
-- 1. Fee Templates Table
CREATE TABLE IF NOT EXISTS fee_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fee Template Items Table
CREATE TABLE IF NOT EXISTS fee_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES fee_templates(id) ON DELETE CASCADE,
  fee_category_id UUID REFERENCES fee_categories(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, fee_category_id)
);

-- 3. Enable RLS
ALTER TABLE fee_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_template_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admins can manage fee templates"
  ON fee_templates
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can manage fee template items"
  ON fee_template_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  ));

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS update_fee_templates_updated_at ON fee_templates;
CREATE TRIGGER update_fee_templates_updated_at BEFORE UPDATE ON fee_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
