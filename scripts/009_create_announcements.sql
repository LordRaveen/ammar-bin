-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('General', 'Event', 'Exam', 'Holiday', 'Emergency', 'PTA')) DEFAULT 'General',
  priority TEXT CHECK (priority IN ('Normal', 'Important', 'Urgent')) DEFAULT 'Normal',
  target_audience TEXT CHECK (target_audience IN ('All', 'Parents', 'Students', 'Teachers')) DEFAULT 'All',
  created_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  attachment_url TEXT
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view announcements targeted to them
CREATE POLICY "Everyone can view announcements"
  ON announcements
  FOR SELECT
  USING (
    target_audience = 'All' OR
    target_audience IN (
      SELECT role FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Only admins can manage announcements
CREATE POLICY "Admins can manage announcements"
  ON announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create index for faster queries
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_announcements_category ON announcements(category);
