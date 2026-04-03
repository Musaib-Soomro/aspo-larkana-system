CREATE TABLE IF NOT EXISTS staff (
  id                  SERIAL PRIMARY KEY,
  office_id           INTEGER NOT NULL REFERENCES offices(id),
  full_name           VARCHAR(150) NOT NULL,
  designation         VARCHAR(30) NOT NULL
                      CHECK (designation IN ('Postmaster', 'Postman', 'Mail Peon', 'Mail Runner')),
  bps                 INTEGER,
  employee_id         VARCHAR(50),
  date_of_joining     DATE,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  is_on_leave         BOOLEAN NOT NULL DEFAULT false,
  is_on_lookafter     BOOLEAN NOT NULL DEFAULT false,
  lookafter_office_id INTEGER REFERENCES offices(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
