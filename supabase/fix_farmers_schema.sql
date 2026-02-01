-- Allow NULLs for optional fields in farmers table to prevent Unique Constraint violations on placeholders
ALTER TABLE farmers ALTER COLUMN email DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN location_lat DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN location_lng DROP NOT NULL;
ALTER TABLE farmers ALTER COLUMN farm_size DROP NOT NULL;

-- If there are empty strings that violate uniqueness, we might need to handle them. 
-- But typically changing to NULL allows us to insert NULL instead of empty string.

-- Update existing empty strings to NULL to clean up (optional but recommended)
UPDATE farmers SET email = NULL WHERE email = '';
UPDATE farmers SET phone = NULL WHERE phone = '';
