-- Messages table for parent-teacher communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- For threading
  student_id UUID REFERENCES students(id) ON DELETE SET NULL, -- Which child this is about
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'result', 'message', 'announcement', 'attendance', 'general')),
  reference_id UUID, -- ID of related record (payment, invoice, message, etc.)
  reference_type TEXT, -- Type of reference (payment, invoice, message, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email/SMS queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL, -- Email or phone number
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  subject TEXT, -- For emails
  message TEXT NOT NULL,
  template_name TEXT,
  template_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  fee_reminders BOOLEAN DEFAULT TRUE,
  new_results BOOLEAN DEFAULT TRUE,
  new_announcements BOOLEAN DEFAULT TRUE,
  attendance_alerts BOOLEAN DEFAULT TRUE,
  new_messages BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status) WHERE status = 'pending';

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id); -- Only recipients can mark as read

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
  VALUES (p_user_id, p_title, p_message, p_type, p_reference_id, p_reference_type)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send notification via queue
CREATE OR REPLACE FUNCTION queue_notification(
  p_recipient TEXT,
  p_type TEXT,
  p_subject TEXT,
  p_message TEXT,
  p_template_name TEXT DEFAULT NULL,
  p_template_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO notification_queue (recipient, type, subject, message, template_name, template_data)
  VALUES (p_recipient, p_type, p_subject, p_message, p_template_name, p_template_data)
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify on new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_recipient_email TEXT;
  v_recipient_phone TEXT;
BEGIN
  -- Get sender info
  SELECT COALESCE(
    (SELECT first_name || ' ' || last_name FROM teachers WHERE user_id = NEW.sender_id),
    (SELECT first_name || ' ' || last_name FROM guardians WHERE user_id = NEW.sender_id)
  ) INTO v_sender_name;
  
  -- Create in-app notification
  PERFORM create_notification(
    NEW.recipient_id,
    'New Message from ' || v_sender_name,
    LEFT(NEW.message, 100) || '...',
    'message',
    NEW.id,
    'message'
  );
  
  -- Queue email notification
  SELECT email INTO v_recipient_email FROM auth.users WHERE id = NEW.recipient_id;
  IF v_recipient_email IS NOT NULL THEN
    PERFORM queue_notification(
      v_recipient_email,
      'email',
      'New Message: ' || NEW.subject,
      'You have received a new message from ' || v_sender_name || '. Please log in to view.',
      'new_message',
      jsonb_build_object('sender', v_sender_name, 'subject', NEW.subject)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
