-- Add status column to invoice_items table
ALTER TABLE invoice_items ADD COLUMN status VARCHAR(50) DEFAULT 'Unpaid' NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_invoice_items_status ON invoice_items(status);
