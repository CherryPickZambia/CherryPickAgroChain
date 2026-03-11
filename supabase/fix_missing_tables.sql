-- ============================================
-- SQL Fix for Missing Tables (v3 - Interface Aligned)
-- Run this in your Supabase SQL Editor to fix "Table not found" and Column mismatches.
-- ============================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create supply_demands table
CREATE TABLE IF NOT EXISTS supply_demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    variety TEXT,
    required_quantity DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'kg',
    max_price_per_unit DECIMAL(10,2),
    delivery_deadline TIMESTAMP WITH TIME ZONE,
    quality_requirements TEXT,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'partially_filled', 'filled', 'closed')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create farmer_bids table
CREATE TABLE IF NOT EXISTS farmer_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supply_demand_id UUID REFERENCES supply_demands(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    proposed_quantity DECIMAL(10,2) NOT NULL,
    proposed_price_per_unit DECIMAL(10,2) NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    admin_notes TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create growth_activities table
CREATE TABLE IF NOT EXISTS growth_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id),
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'planting', 'weeding', 'fertilizer', 'pesticide', 'irrigation', 'pruning', 'harvesting', 'dispatch', 'other'
    )),
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quantity DECIMAL(10,2),
    unit TEXT,
    photos TEXT[], -- Array of IPFS/Storage URLs
    
    -- Specific fields
    fertilizer_brand TEXT,
    fertilizer_type TEXT,
    npk_ratio TEXT,
    transport_type TEXT,
    vehicle_registration TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    origin TEXT,
    destination TEXT,
    
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    iot_readings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    milestone_id TEXT, 
    contract_id TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'rejected')),
    assigned_officer_id UUID REFERENCES extension_officers(id),
    fee DECIMAL(10,2),
    verification_type TEXT DEFAULT 'milestone' CHECK (verification_type IN ('basic', 'milestone', 'quality')),
    notes TEXT,
    activities JSONB DEFAULT '[]', -- List of activities to verify
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create verifier_fee_config table
CREATE TABLE IF NOT EXISTS verifier_fee_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_type TEXT NOT NULL,
    base_fee DECIMAL(10,2) NOT NULL,
    distance_rate_per_km DECIMAL(10,2) DEFAULT 0,
    farmer_deduction_percent DECIMAL(5,2) DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES (Development Friendly)
-- ============================================

ALTER TABLE supply_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifier_fee_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read supply_demands" ON supply_demands;
DROP POLICY IF EXISTS "Insert supply_demands" ON supply_demands;
DROP POLICY IF EXISTS "Update supply_demands" ON supply_demands;

DROP POLICY IF EXISTS "Public read farmer_bids" ON farmer_bids;
DROP POLICY IF EXISTS "Insert farmer_bids" ON farmer_bids;
DROP POLICY IF EXISTS "Update farmer_bids" ON farmer_bids;

DROP POLICY IF EXISTS "Public read growth_activities" ON growth_activities;
DROP POLICY IF EXISTS "Insert growth_activities" ON growth_activities;

DROP POLICY IF EXISTS "Public read verification_requests" ON verification_requests;
DROP POLICY IF EXISTS "Insert verification_requests" ON verification_requests;
DROP POLICY IF EXISTS "Update verification_requests" ON verification_requests;

DROP POLICY IF EXISTS "Public read verifier_fee_config" ON verifier_fee_config;

-- Create Policies
CREATE POLICY "Public read supply_demands" ON supply_demands FOR SELECT USING (true);
CREATE POLICY "Insert supply_demands" ON supply_demands FOR INSERT WITH CHECK (true);
CREATE POLICY "Update supply_demands" ON supply_demands FOR UPDATE USING (true);

CREATE POLICY "Public read farmer_bids" ON farmer_bids FOR SELECT USING (true);
CREATE POLICY "Insert farmer_bids" ON farmer_bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Update farmer_bids" ON farmer_bids FOR UPDATE USING (true);

CREATE POLICY "Public read growth_activities" ON growth_activities FOR SELECT USING (true);
CREATE POLICY "Insert growth_activities" ON growth_activities FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read verification_requests" ON verification_requests FOR SELECT USING (true);
CREATE POLICY "Insert verification_requests" ON verification_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Update verification_requests" ON verification_requests FOR UPDATE USING (true);

CREATE POLICY "Public read verifier_fee_config" ON verifier_fee_config FOR SELECT USING (true);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_supply_demands_status ON supply_demands(status);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_demand ON farmer_bids(supply_demand_id);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_farmer ON farmer_bids(farmer_id);
CREATE INDEX IF NOT EXISTS idx_growth_activities_contract ON growth_activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- Success message
DO $$ BEGIN RAISE NOTICE '✅ Missing tables version 3 (Code Aligned) established successfully!'; END $$;
