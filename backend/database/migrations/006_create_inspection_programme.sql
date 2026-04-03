CREATE TABLE IF NOT EXISTS inspection_programme (
  id                        SERIAL PRIMARY KEY,
  year                      INTEGER NOT NULL,
  half                      VARCHAR(20) NOT NULL CHECK (half IN ('First', 'Second')),
  office_id                 INTEGER NOT NULL REFERENCES offices(id),
  allotted_month            INTEGER NOT NULL CHECK (allotted_month BETWEEN 1 AND 12),
  inspecting_officer        VARCHAR(20) NOT NULL
                            CHECK (inspecting_officer IN ('ASPO', 'DSPS', 'Overseer')),
  status                    VARCHAR(20) NOT NULL DEFAULT 'Pending'
                            CHECK (status IN ('Pending', 'Completed', 'Carried Forward')),
  completed_date            DATE,
  order_book_remarks        TEXT,
  remarks_submitted_to_dsps BOOLEAN NOT NULL DEFAULT false,
  remarks_submission_date   DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (year, half, office_id)
);
