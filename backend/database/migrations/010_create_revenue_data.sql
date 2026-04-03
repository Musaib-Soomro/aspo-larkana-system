CREATE TABLE IF NOT EXISTS revenue_data (
  id           SERIAL PRIMARY KEY,
  entry_id     INTEGER NOT NULL REFERENCES revenue_entries(id) ON DELETE CASCADE,
  category     VARCHAR(100) NOT NULL,
  sub_category VARCHAR(50),
  value        DECIMAL(15,2) NOT NULL DEFAULT 0,
  unit         VARCHAR(20) NOT NULL CHECK (unit IN ('amount', 'count'))
);
