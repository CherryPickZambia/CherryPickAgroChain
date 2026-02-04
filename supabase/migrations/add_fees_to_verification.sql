-- Add fee and type columns to verification_requests table
ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS verification_type TEXT DEFAULT 'milestone',
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2);

-- Add comment explaining the fee structure
COMMENT ON COLUMN verification_requests.fee IS 'Fee offered to the verifier (K50 for basic, K100 for milestone, K150 for quality)';
COMMENT ON COLUMN verification_requests.verification_type IS 'Type of verification: basic, milestone, or quality';
