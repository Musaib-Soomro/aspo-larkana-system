CREATE TABLE IF NOT EXISTS transfer_records (
  id                          SERIAL PRIMARY KEY,
  staff_id                    INTEGER NOT NULL REFERENCES staff(id),
  directed_by                 VARCHAR(150) NOT NULL,
  reference_letter_no         VARCHAR(80)  NOT NULL,
  reference_letter_date       DATE         NOT NULL,
  transfer_order_date         DATE         NOT NULL,
  from_office_id              INTEGER NOT NULL REFERENCES offices(id),
  to_office_id                INTEGER NOT NULL REFERENCES offices(id),
  relieving_date              DATE,
  joining_date                DATE,
  transit_extension_requested BOOLEAN NOT NULL DEFAULT false,
  transit_extension_granted   BOOLEAN NOT NULL DEFAULT false,
  transit_extension_days      INTEGER,
  transit_extension_authority VARCHAR(150),
  transit_extension_order_ref VARCHAR(80),
  status                      VARCHAR(20) NOT NULL DEFAULT 'Ordered'
                              CHECK (status IN ('Ordered','Relieved','Joined','Completed','Cancelled')),
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tr_staff    ON transfer_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_tr_status   ON transfer_records(status);
CREATE INDEX IF NOT EXISTS idx_tr_from_off ON transfer_records(from_office_id);
CREATE INDEX IF NOT EXISTS idx_tr_to_off   ON transfer_records(to_office_id);
