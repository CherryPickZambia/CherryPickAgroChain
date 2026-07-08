-- Allow suspending approved farmers (and reinstate later).
-- Safe to run multiple times.

ALTER TABLE farmers ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Recreate status check to include 'suspended'
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'farmers'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE farmers DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE farmers
  ADD CONSTRAINT farmers_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
