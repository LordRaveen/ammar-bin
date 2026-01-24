-- Add foreign key constraint for payment_allocations.invoice_item_id
-- This enables PostgREST to automatically discover and allow querying the relationship

ALTER TABLE payment_allocations
ADD CONSTRAINT fk_payment_allocations_invoice_item_id
FOREIGN KEY (invoice_item_id) REFERENCES invoice_items(id) ON DELETE CASCADE;
