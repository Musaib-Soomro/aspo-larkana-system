-- Drop acting columns from transfer_records (replaced by standalone lookafter_assignments table)
ALTER TABLE transfer_records DROP COLUMN IF EXISTS acting_staff_id;
ALTER TABLE transfer_records DROP COLUMN IF EXISTS acting_order_ref;
ALTER TABLE transfer_records DROP COLUMN IF EXISTS acting_order_date;
ALTER TABLE transfer_records DROP COLUMN IF EXISTS acting_office_id;

-- Standalone look-after assignments table
CREATE TABLE IF NOT EXISTS lookafter_assignments (
  id                    SERIAL PRIMARY KEY,
  staff_id              INTEGER NOT NULL REFERENCES staff(id),
  office_id             INTEGER NOT NULL REFERENCES offices(id),
  lookafter_designation VARCHAR(30) NOT NULL
                        CHECK (lookafter_designation IN ('Postmaster','Postman','Mail Peon','Mail Runner')),
  dsps_order_no         VARCHAR(80)  NOT NULL,
  dsps_order_date       DATE         NOT NULL,
  start_date            DATE         NOT NULL,
  start_reason          TEXT         NOT NULL,
  end_date              DATE,
  end_reason            TEXT,
  is_active             BOOLEAN      NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_la_staff  ON lookafter_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_la_office ON lookafter_assignments(office_id);
CREATE INDEX IF NOT EXISTS idx_la_active ON lookafter_assignments(is_active);
