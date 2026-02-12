-- ============================================
-- AgroChain360 Production-Ready Migration
-- Run in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PHASE 0: Evidence Table (CRITICAL - fixes verifier approval)
-- ============================================

CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'iot', 'officer_verification', 'document')),
    ipfs_hash TEXT,
    metadata JSONB DEFAULT '{}',
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public read evidence" ON evidence FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert evidence" ON evidence FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Update evidence" ON evidence FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_evidence_milestone ON evidence(milestone_id);

-- ============================================
-- PHASE 1: Farmers - add status column
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmers' AND column_name = 'status') THEN
        ALTER TABLE farmers ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmers' AND column_name = 'rejection_reason') THEN
        ALTER TABLE farmers ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- ============================================
-- PHASE 4: Milestones - key milestones, ordering
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'is_key') THEN
        ALTER TABLE milestones ADD COLUMN is_key BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'requires_professional_verifier') THEN
        ALTER TABLE milestones ADD COLUMN requires_professional_verifier BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'sequence_order') THEN
        ALTER TABLE milestones ADD COLUMN sequence_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- PHASE 6: Contracts - delivery tracking, partial cycle
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'delivered_quantity') THEN
        ALTER TABLE contracts ADD COLUMN delivered_quantity DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'admin_payment_approved') THEN
        ALTER TABLE contracts ADD COLUMN admin_payment_approved BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'partial_cycle') THEN
        ALTER TABLE contracts ADD COLUMN partial_cycle BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'starting_stage') THEN
        ALTER TABLE contracts ADD COLUMN starting_stage TEXT;
    END IF;
END $$;

-- ============================================
-- PHASE 5: Supply Demands & Farmer Bids
-- ============================================

CREATE TABLE IF NOT EXISTS supply_demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_type TEXT NOT NULL,
    variety TEXT,
    required_quantity DECIMAL(10,2) NOT NULL,
    target_price_per_kg DECIMAL(10,2),
    delivery_deadline TIMESTAMP WITH TIME ZONE,
    location TEXT,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'fulfilled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farmer_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id UUID REFERENCES supply_demands(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    offered_quantity DECIMAL(10,2) NOT NULL,
    offered_price_per_kg DECIMAL(10,2) NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE supply_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public read supply_demands" ON supply_demands FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert supply_demands" ON supply_demands FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Update supply_demands" ON supply_demands FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Public read farmer_bids" ON farmer_bids FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert farmer_bids" ON farmer_bids FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Update farmer_bids" ON farmer_bids FOR UPDATE USING (true);

-- ============================================
-- PHASE 7: Growth & Development Activities
-- ============================================

CREATE TABLE IF NOT EXISTS growth_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id),
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'growth_observation', 'activity_log', 'dispatch', 'sensor_reading', 'manual_reading'
    )),
    title TEXT NOT NULL,
    description TEXT,
    evidence_images TEXT[],
    readings JSONB DEFAULT '{}',
    dispatch_data JSONB,
    logged_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE growth_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public read growth_activities" ON growth_activities FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert growth_activities" ON growth_activities FOR INSERT WITH CHECK (true);

-- ============================================
-- PHASE 8: Verification & Verifier Enhancements
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_requests' AND column_name = 'task_type') THEN
        ALTER TABLE verification_requests ADD COLUMN task_type TEXT DEFAULT 'milestone'
            CHECK (task_type IN ('milestone', 'farm_existence', 'community', 'growth_check'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_requests' AND column_name = 'is_freelance') THEN
        ALTER TABLE verification_requests ADD COLUMN is_freelance BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extension_officers' AND column_name = 'verifier_type') THEN
        ALTER TABLE extension_officers ADD COLUMN verifier_type TEXT DEFAULT 'professional'
            CHECK (verifier_type IN ('professional', 'freelance'));
    END IF;
END $$;

-- ============================================
-- PHASE 12: Verifier Fee Configuration
-- ============================================

CREATE TABLE IF NOT EXISTS verifier_fee_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_type TEXT NOT NULL,
    base_fee DECIMAL(10,2) NOT NULL,
    distance_rate_per_km DECIMAL(10,2) DEFAULT 0,
    farmer_deduction_percent DECIMAL(5,2) DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE verifier_fee_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public read verifier_fee_config" ON verifier_fee_config FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Insert verifier_fee_config" ON verifier_fee_config FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Update verifier_fee_config" ON verifier_fee_config FOR UPDATE USING (true);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_supply_demands_status ON supply_demands(status);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_demand ON farmer_bids(demand_id);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_farmer ON farmer_bids(farmer_id);
CREATE INDEX IF NOT EXISTS idx_growth_activities_contract ON growth_activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_sequence ON milestones(contract_id, sequence_order);
