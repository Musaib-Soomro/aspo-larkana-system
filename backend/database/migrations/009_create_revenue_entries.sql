CREATE TABLE IF NOT EXISTS revenue_entries (
  id             SERIAL PRIMARY KEY,
  office_id      INTEGER NOT NULL REFERENCES offices(id),
  month          INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year           INTEGER NOT NULL,
  submitted_by   VARCHAR(100),
  submitted_date DATE,
  is_draft       BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (office_id, month, year)
);
