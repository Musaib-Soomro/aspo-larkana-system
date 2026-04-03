-- Remove duplicate offices, keeping the one with the lowest id per name
DELETE FROM offices
WHERE id NOT IN (
  SELECT MIN(id) FROM offices GROUP BY name
);

-- Add unique constraint so future seed runs are idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offices_name_unique'
  ) THEN
    ALTER TABLE offices ADD CONSTRAINT offices_name_unique UNIQUE (name);
  END IF;
END $$;
