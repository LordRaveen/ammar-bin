-- Add CHECK constraints for payments table to allow lowercase values
-- Drop existing constraints first
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add new constraints with lowercase values
ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN ('cash', 'pos', 'transfer', 'online'));

ALTER TABLE payments
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'reversed'));
