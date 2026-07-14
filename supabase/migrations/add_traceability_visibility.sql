-- Admin-controlled publish vs internal visibility for traceability events,
-- plus ensure AI diagnostic columns exist so bid/evidence AI results are stored.
-- Safe to run multiple times.

-- 1. AI diagnostic columns (older databases may be missing these)
ALTER TABLE traceability_events ADD COLUMN IF NOT EXISTS ai_disease TEXT;
ALTER TABLE traceability_events ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(5, 2);
ALTER TABLE traceability_events ADD COLUMN IF NOT EXISTS ai_health_score INTEGER;
ALTER TABLE traceability_events ADD COLUMN IF NOT EXISTS ai_treatment_rec TEXT;

-- 2. Publish flag. Default true keeps the current public journey intact.
ALTER TABLE traceability_events ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- 3. Hide internal / commercially sensitive events from the public trace by default.
--    (Admins can re-publish any event from the Traceability History screen.)
UPDATE traceability_events
SET is_public = false
WHERE is_public = true
  AND (
    event_title ILIKE '%bid accepted%'
    OR event_description ILIKE '%total k%'
    OR event_description ILIKE '%/kg%'
    OR event_description ILIKE '%price%'
    OR event_title ILIKE '%ai yield warning%'
  );

CREATE INDEX IF NOT EXISTS idx_traceability_events_public
  ON traceability_events(batch_id, is_public);
