CREATE TABLE IF NOT EXISTS inquiries (
  id                     SERIAL PRIMARY KEY,
  inquiry_number         VARCHAR(30) UNIQUE NOT NULL,
  assigned_by            VARCHAR(100) NOT NULL DEFAULT 'DSPS Larkana',
  dsps_letter_reference  VARCHAR(100),
  dsps_letter_date       DATE,
  subject                TEXT NOT NULL,
  office_id              INTEGER REFERENCES offices(id),
  date_received          DATE NOT NULL,
  visit_date             DATE,
  statements_recorded    BOOLEAN NOT NULL DEFAULT false,
  report_submitted       BOOLEAN NOT NULL DEFAULT false,
  report_submission_date DATE,
  report_reference       VARCHAR(100),
  status                 VARCHAR(30) NOT NULL DEFAULT 'Pending'
                         CHECK (status IN ('Pending', 'In Progress', 'Report Submitted', 'Closed')),
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
