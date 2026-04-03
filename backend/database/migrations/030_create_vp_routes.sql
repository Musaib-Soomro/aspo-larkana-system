CREATE TABLE IF NOT EXISTS vp_routes (
  id             SERIAL PRIMARY KEY,
  staff_id       INTEGER NOT NULL REFERENCES staff(id),
  route_name     VARCHAR(150) NOT NULL,
  villages       TEXT NOT NULL,
  frequency      VARCHAR(50),
  source         VARCHAR(100) NOT NULL DEFAULT 'Larkana GPO',
  effective_date DATE NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
