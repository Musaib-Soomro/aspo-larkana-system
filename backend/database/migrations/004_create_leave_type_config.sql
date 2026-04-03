CREATE TABLE IF NOT EXISTS leave_type_config (
  id           SERIAL PRIMARY KEY,
  type_name    VARCHAR(80) UNIQUE NOT NULL,
  annual_limit INTEGER,
  is_active    BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO leave_type_config (type_name, annual_limit) VALUES
  ('Casual Leave',  20),
  ('Earned Leave',  NULL),
  ('Medical Leave', NULL),
  ('Special Leave', NULL)
ON CONFLICT (type_name) DO NOTHING;
