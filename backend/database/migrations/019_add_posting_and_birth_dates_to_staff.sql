ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS current_posting_date DATE,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;
