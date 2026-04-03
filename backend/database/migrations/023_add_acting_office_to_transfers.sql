ALTER TABLE transfer_records
  ADD COLUMN IF NOT EXISTS acting_office_id INTEGER REFERENCES offices(id);
