CREATE TABLE IF NOT EXISTS work_assignments (
  id               SERIAL PRIMARY KEY,
  staff_id         INTEGER NOT NULL REFERENCES staff(id),
  assigned_date    DATE    NOT NULL,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  order_type       VARCHAR(10) NOT NULL CHECK (order_type IN ('Written','Verbal')),
  order_reference  VARCHAR(80),
  due_date         DATE,
  status           VARCHAR(20) NOT NULL DEFAULT 'Open'
                   CHECK (status IN ('Open','In Progress','Completed')),
  completion_date  DATE,
  completion_notes TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assign_staff  ON work_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_assign_status ON work_assignments(status);
