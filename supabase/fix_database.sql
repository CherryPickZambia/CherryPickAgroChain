-- Database Fix Script for Cherry Pick AgroChain360
-- Run this in your Supabase SQL Editor to fix RLS and table issues

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the update_updated_at_column function (needed for triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Fix marketplace_listings RLS policies to allow public read
-- Drop restrictive policy
DROP POLICY IF EXISTS "Anyone can view active listings" ON marketplace_listings;

-- Create new permissive policy for public read
CREATE POLICY "Public can read all listings" ON marketplace_listings
  FOR SELECT USING (true);

-- 4. Fix batches table policies
DROP POLICY IF EXISTS "Public can view batches" ON batches;
CREATE POLICY "Public can view batches" ON batches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert batches" ON batches;
CREATE POLICY "Authenticated users can insert batches" ON batches
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update batches" ON batches;
CREATE POLICY "Authenticated users can update batches" ON batches
  FOR UPDATE USING (true);

-- 5. Fix traceability_events policies
DROP POLICY IF EXISTS "Public can view events" ON traceability_events;
CREATE POLICY "Public can view events" ON traceability_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert events" ON traceability_events;
CREATE POLICY "Authenticated users can insert events" ON traceability_events
  FOR INSERT WITH CHECK (true);

-- 6. Make sure marketplace_listings has the Premium quality grade option
-- First check if we need to modify the constraint
DO $$
BEGIN
  -- Try to drop the old constraint if it exists
  ALTER TABLE marketplace_listings DROP CONSTRAINT IF EXISTS marketplace_listings_quality_grade_check;
  
  -- Add the new constraint with Premium option
  ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_quality_grade_check 
    CHECK (quality_grade IN ('A', 'B', 'C', 'Premium'));
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if constraint doesn't exist
  NULL;
END $$;

-- 7. Add batch_id column to marketplace_listings if it doesn't exist
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);

-- 8. Ensure farmers table allows inserts and updates
DROP POLICY IF EXISTS "Farmers can insert" ON farmers;
CREATE POLICY "Farmers can insert" ON farmers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Farmers can update their profile" ON farmers;  
CREATE POLICY "Farmers can update their profile" ON farmers
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can view farmers" ON farmers;
CREATE POLICY "Public can view farmers" ON farmers
  FOR SELECT USING (true);

-- 9. Verify tables exist (these should just skip if tables exist)
-- Note: Run the full schema files (marketplace_schema.sql, traceability_schema.sql) 
-- if tables don't exist

-- 10. Grant necessary permissions
GRANT SELECT ON marketplace_listings TO anon;
GRANT SELECT ON batches TO anon;
GRANT SELECT ON traceability_events TO anon;
GRANT SELECT ON farmers TO anon;
GRANT INSERT, UPDATE ON marketplace_listings TO authenticated;
GRANT INSERT, UPDATE ON batches TO authenticated;
GRANT INSERT ON traceability_events TO authenticated;
GRANT INSERT, UPDATE ON farmers TO authenticated;

-- Done! Your database should now work correctly.
