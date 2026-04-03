CREATE TABLE IF NOT EXISTS offices (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  short_name     VARCHAR(80),
  type           VARCHAR(20) NOT NULL CHECK (type IN ('Delivery', 'Non-Delivery')),
  shift          VARCHAR(10) NOT NULL CHECK (shift IN ('Day', 'Night')),
  has_edbos      BOOLEAN NOT NULL DEFAULT false,
  tehsil         VARCHAR(80),
  district       VARCHAR(80) NOT NULL DEFAULT 'Larkana',
  account_office VARCHAR(100),
  bps_category   VARCHAR(20),
  address        TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  extra_fields   JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
