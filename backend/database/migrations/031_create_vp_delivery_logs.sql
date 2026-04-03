CREATE TABLE IF NOT EXISTS vp_delivery_logs (
  id                   SERIAL PRIMARY KEY,
  staff_id             INTEGER NOT NULL REFERENCES staff(id),
  route_id             INTEGER REFERENCES vp_routes(id),
  date                 DATE    NOT NULL,
  articles_received    INTEGER NOT NULL DEFAULT 0,
  articles_delivered   INTEGER NOT NULL DEFAULT 0,
  articles_undelivered INTEGER NOT NULL DEFAULT 0,
  undelivered_reason   TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, date)
);
CREATE INDEX IF NOT EXISTS idx_delivery_staff ON vp_delivery_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_delivery_date  ON vp_delivery_logs(date);
