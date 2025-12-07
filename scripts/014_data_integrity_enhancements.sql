-- Add soft delete columns to major tables
ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add unique constraints to prevent duplicates
ALTER TABLE students ADD CONSTRAINT unique_active_student_id UNIQUE NULLS NOT DISTINCT (student_id, deleted_at);
ALTER TABLE teachers ADD CONSTRAINT unique_active_staff_id UNIQUE NULLS NOT DISTINCT (staff_id, deleted_at);

-- Add validation check constraints
ALTER TABLE students ADD CONSTRAINT valid_phone_format CHECK (
  phone ~ '^[0-9+\-\s()]+$' OR phone IS NULL
);

ALTER TABLE students ADD CONSTRAINT valid_birthdate CHECK (
  date_of_birth <= CURRENT_DATE
);

ALTER TABLE guardians ADD CONSTRAINT valid_guardian_phone CHECK (
  phone_primary ~ '^[0-9+\-\s()]+$' OR phone_primary IS NULL
);

ALTER TABLE teachers ADD CONSTRAINT valid_teacher_phone CHECK (
  phone ~ '^[0-9+\-\s()]+$' OR phone IS NULL
);

ALTER TABLE payments ADD CONSTRAINT valid_payment_amount CHECK (
  amount > 0
);

ALTER TABLE invoices ADD CONSTRAINT valid_invoice_amounts CHECK (
  total_amount >= 0 AND amount_paid >= 0 AND balance >= 0
);

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_deleted_at ON teachers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_guardians_deleted_at ON guardians(deleted_at) WHERE deleted_at IS NULL;

-- Create audit function for tracking who deleted records
CREATE OR REPLACE FUNCTION track_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Record deletion in audit log
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      changed_by
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id::TEXT,
      'soft_delete',
      row_to_json(OLD),
      row_to_json(NEW),
      current_setting('app.current_user_id', true)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add soft delete triggers
CREATE TRIGGER students_soft_delete_trigger
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION track_soft_delete();

CREATE TRIGGER teachers_soft_delete_trigger
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION track_soft_delete();

CREATE TRIGGER guardians_soft_delete_trigger
  BEFORE UPDATE ON guardians
  FOR EACH ROW
  EXECUTE FUNCTION track_soft_delete();

-- Create function to permanently delete old soft-deleted records (90 days)
CREATE OR REPLACE FUNCTION cleanup_old_deleted_records()
RETURNS void AS $$
BEGIN
  DELETE FROM students WHERE deleted_at < NOW() - INTERVAL '90 days';
  DELETE FROM teachers WHERE deleted_at < NOW() - INTERVAL '90 days';
  DELETE FROM guardians WHERE deleted_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_deleted_records IS 'Permanently delete records that have been soft-deleted for more than 90 days';
