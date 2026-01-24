-- Remove student_id column from payments table
-- This column is no longer needed since student information can be derived
-- from payment_allocations table, allowing one payment to cover multiple students

ALTER TABLE payments DROP COLUMN IF EXISTS student_id;
