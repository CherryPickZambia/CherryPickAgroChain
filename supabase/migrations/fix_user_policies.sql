-- Migration: Fix user table policies for saving users to database
-- Run this in Supabase SQL Editor

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read users" ON users;
DROP POLICY IF EXISTS "Authenticated insert" ON users;
DROP POLICY IF EXISTS "Update users" ON users;

-- Create new policies
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Authenticated insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Update users" ON users FOR UPDATE USING (true);

-- Also ensure farmers table has proper policies
DROP POLICY IF EXISTS "Public read access" ON farmers;
DROP POLICY IF EXISTS "Authenticated insert" ON farmers;
DROP POLICY IF EXISTS "Farmers can update own profile" ON farmers;

CREATE POLICY "Public read farmers" ON farmers FOR SELECT USING (true);
CREATE POLICY "Insert farmers" ON farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Update farmers" ON farmers FOR UPDATE USING (true);

-- Add index for faster wallet lookups on users table
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- Success message
DO $$ BEGIN RAISE NOTICE 'User policies fixed successfully!'; END $$;
