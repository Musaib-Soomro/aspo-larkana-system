CREATE TABLE IF NOT EXISTS inspection_visits (
  id             SERIAL PRIMARY KEY,
  programme_id   INTEGER NOT NULL REFERENCES inspection_programme(id) ON DELETE CASCADE,
  visit_date     DATE NOT NULL,
  departure_time TIME,
  arrival_time   TIME,
  return_time    TIME,
  distance_km    DECIMAL(6,2),
  day_type       VARCHAR(20) CHECK (day_type IN ('Full Day', 'Half Day', 'Ordinary')),
  notes          TEXT
);
