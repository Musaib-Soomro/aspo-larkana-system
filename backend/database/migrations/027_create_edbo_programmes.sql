CREATE TABLE IF NOT EXISTS edbo_programmes (
  id         SERIAL PRIMARY KEY,
  year       INTEGER NOT NULL,
  staff_id   INTEGER NOT NULL REFERENCES staff(id),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, year)
);

CREATE TABLE IF NOT EXISTS edbo_assignments (
  id             SERIAL PRIMARY KEY,
  programme_id   INTEGER NOT NULL REFERENCES edbo_programmes(id) ON DELETE CASCADE,
  edbo_name      VARCHAR(150) NOT NULL,
  assigned_month INTEGER NOT NULL CHECK (assigned_month BETWEEN 1 AND 12),
  status         VARCHAR(20) NOT NULL DEFAULT 'Pending'
                 CHECK (status IN ('Pending','Completed','Carried Forward')),
  completed_date DATE,
  remarks        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_edbo_prog  ON edbo_assignments(programme_id);
CREATE INDEX IF NOT EXISTS idx_edbo_month ON edbo_assignments(assigned_month);
