ALTER TABLE transfer_records
  ADD COLUMN IF NOT EXISTS acting_staff_id INTEGER REFERENCES staff(id);
