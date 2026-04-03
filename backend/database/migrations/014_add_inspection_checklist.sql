-- Add checklist JSONB column to inspection_visits
-- Each checklist entry: { item: string, result: 'OK' | 'Issue Found' | 'N/A', remarks: string }
ALTER TABLE inspection_visits
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
