-- Migration: Add verification_requests table and milestone metadata
-- Run this in Supabase SQL Editor to add GPS-based verification system

-- ============================================
-- VERIFICATION REQUESTS TABLE
-- ============================================

-- Create verification_requests table for GPS-based officer dispatch (Yango-style)
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    officer_id UUID REFERENCES extension_officers(id),
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    activities JSONB DEFAULT '[]',
    officer_notes TEXT,
    verification_photos TEXT[],
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADD METADATA COLUMN TO MILESTONES
-- ============================================

-- Add metadata column to milestones for storing farmer activities
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'metadata') THEN
        ALTER TABLE milestones ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add completed_date column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'completed_date') THEN
        ALTER TABLE milestones ADD COLUMN completed_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on verification_requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read verification_requests" ON verification_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated insert verification_requests" ON verification_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Update verification_requests" ON verification_requests FOR UPDATE USING (true);

-- Update policies for farmers, milestones, contracts
DO $$ 
BEGIN
    -- Farmers update policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Farmers can update own profile' AND tablename = 'farmers') THEN
        CREATE POLICY "Farmers can update own profile" ON farmers FOR UPDATE USING (true);
    END IF;
    
    -- Milestones update policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Update milestones' AND tablename = 'milestones') THEN
        CREATE POLICY "Update milestones" ON milestones FOR UPDATE USING (true);
    END IF;
    
    -- Contracts update policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Update contracts' AND tablename = 'contracts') THEN
        CREATE POLICY "Update contracts" ON contracts FOR UPDATE USING (true);
    END IF;
END $$;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_location ON verification_requests(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_verification_requests_farmer ON verification_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);

-- Success message
DO $$ BEGIN RAISE NOTICE 'Migration completed: verification_requests table and milestone metadata added successfully'; END $$;
