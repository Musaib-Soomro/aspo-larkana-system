ALTER TABLE transfer_records
  ADD COLUMN IF NOT EXISTS acting_order_ref  VARCHAR(80),
  ADD COLUMN IF NOT EXISTS acting_order_date DATE;
