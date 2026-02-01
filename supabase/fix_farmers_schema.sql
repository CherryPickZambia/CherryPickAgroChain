-- Add missing columns to farmers table if they don't exist
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Allow NULLs for optional fields to prevent Unique Constraint violations (from previous step)
ALTER TABLE farmers ALTER COLUMN email DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN location_lat DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN location_lng DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN farm_size DROP NOT NULL;

-- Fix potentially invalid default empty strings
UPDATE farmers SET email = NULL WHERE email = '';
UPDATE farmers SET phone = NULL WHERE phone = '';
