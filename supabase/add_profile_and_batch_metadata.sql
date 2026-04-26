-- Add profile_photo to farmers table (used in TraceabilityView "Meet Your Farmer")
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS bio TEXT;

-- Ensure batches table has the metadata fields used by warehouse processing & traceability
ALTER TABLE batches ADD COLUMN IF NOT EXISTS ipfs_metadata TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS harvest_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS total_quantity NUMERIC;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg';

COMMENT ON COLUMN farmers.profile_photo IS 'IPFS/HTTP URL of the farmer profile photo, surfaced in traceability';
COMMENT ON COLUMN batches.ipfs_metadata IS 'JSON metadata: productionDate, expiryDate, packagingSizes, productImage, etc.';
