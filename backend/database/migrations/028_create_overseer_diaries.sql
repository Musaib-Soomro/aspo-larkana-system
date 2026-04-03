CREATE TABLE IF NOT EXISTS overseer_diaries (
  id              SERIAL PRIMARY KEY,
  staff_id        INTEGER NOT NULL REFERENCES staff(id),
  week_start_date DATE    NOT NULL,
  week_end_date   DATE    NOT NULL,
  places_visited  TEXT,
  work_summary    TEXT,
  observations    TEXT,
  submitted_date  DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, week_start_date)
);
CREATE INDEX IF NOT EXISTS idx_diary_staff ON overseer_diaries(staff_id);
