CREATE TABLE IF NOT EXISTS audit_log (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(20) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id  INTEGER,
  changes    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log (user_id);
