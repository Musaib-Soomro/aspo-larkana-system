CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('officer_name',        'Musaib Soomro'),
  ('officer_designation', 'Assistant Superintendent Post Offices'),
  ('office_name',         'ASPO Larkana Sub Division'),
  ('system_version',      '1.0.0')
ON CONFLICT (key) DO NOTHING;
