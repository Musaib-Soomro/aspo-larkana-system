-- Link postmaster accounts to their specific office
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS office_id INTEGER REFERENCES offices(id) ON DELETE SET NULL;

-- office_id is required for postmaster role; NULL for admin/viewer is fine
CREATE INDEX IF NOT EXISTS idx_users_office ON users(office_id) WHERE office_id IS NOT NULL;
