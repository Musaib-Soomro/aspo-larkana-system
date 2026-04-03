CREATE TABLE IF NOT EXISTS attendance_records (
  id         SERIAL PRIMARY KEY,
  staff_id   INTEGER NOT NULL REFERENCES staff(id),
  date       DATE    NOT NULL,
  status     VARCHAR(20) NOT NULL
             CHECK (status IN ('Present','Absent','On Leave','On Duty','Holiday')),
  leave_id   INTEGER REFERENCES leave_records(id),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, date)
);
CREATE INDEX IF NOT EXISTS idx_att_staff ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_att_date  ON attendance_records(date);
