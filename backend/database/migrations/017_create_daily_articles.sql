CREATE TABLE IF NOT EXISTS daily_articles (
  id            SERIAL PRIMARY KEY,
  office_id     INTEGER NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  record_date   DATE NOT NULL,
  article_type  VARCHAR(10) NOT NULL CHECK (article_type IN ('RGL','PAR','VPP','VPL','COD','UMS','IRP')),
  in_deposit    INTEGER NOT NULL DEFAULT 0,
  received      INTEGER NOT NULL DEFAULT 0,
  delivered     INTEGER NOT NULL DEFAULT 0,
  returned      INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_articles_unique UNIQUE (office_id, record_date, article_type)
);
