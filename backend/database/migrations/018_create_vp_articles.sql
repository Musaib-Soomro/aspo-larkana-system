CREATE TABLE IF NOT EXISTS vp_articles (
  id               SERIAL PRIMARY KEY,
  office_id        INTEGER NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  article_type     VARCHAR(10) NOT NULL CHECK (article_type IN ('VPP','VPL','COD')),
  tracking_id      VARCHAR(50) NOT NULL,
  date_received    DATE NOT NULL,
  date_delivered   DATE,
  value_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  booking_city     VARCHAR(100),
  addressee_name   VARCHAR(200),
  status           VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Delivered','Returned','Lost')),
  mo_type          VARCHAR(20),
  mo_number        VARCHAR(50),
  demurrage_days   INTEGER NOT NULL DEFAULT 0,
  demurrage_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vp_articles_office_tracking_unique UNIQUE (office_id, tracking_id)
);

CREATE TABLE IF NOT EXISTS late_deliveries (
  id               SERIAL PRIMARY KEY,
  office_id        INTEGER NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  article_type     VARCHAR(10) NOT NULL CHECK (article_type IN ('RGL','PAR','IRP','UMS')),
  tracking_id      VARCHAR(50) NOT NULL,
  date_received    DATE NOT NULL,
  date_delivered   DATE NOT NULL,
  days_held        INTEGER NOT NULL DEFAULT 0,
  demurrage_days   INTEGER NOT NULL DEFAULT 0,
  demurrage_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  addressee_name   VARCHAR(200),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
