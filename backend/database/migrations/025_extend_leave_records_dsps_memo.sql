ALTER TABLE leave_records
  ADD COLUMN IF NOT EXISTS dsps_memo_no   VARCHAR(80),
  ADD COLUMN IF NOT EXISTS dsps_memo_date DATE;
