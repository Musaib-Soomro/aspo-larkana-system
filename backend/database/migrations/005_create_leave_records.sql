CREATE TABLE IF NOT EXISTS leave_records (
  id                  SERIAL PRIMARY KEY,
  staff_id            INTEGER NOT NULL REFERENCES staff(id),
  leave_type          VARCHAR(80) NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  total_days          INTEGER NOT NULL,
  reason              TEXT,
  approved_by         VARCHAR(100) NOT NULL DEFAULT 'ASPO Larkana',
  status              VARCHAR(20) NOT NULL DEFAULT 'Active'
                      CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  substitute_staff_id INTEGER REFERENCES staff(id),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
