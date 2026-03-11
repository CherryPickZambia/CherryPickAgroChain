-- Fix for 42703: column "supply_demand_id" does not exist
-- This happens if the farmer_bids table was created in an older version of the schema without these columns.
-- CREATE TABLE IF NOT EXISTS does not add missing columns to existing tables.

-- 1. Ensure supply_demands table exists first
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

-- 2. Add missing columns to farmer_bids if it exists
DO $$ 
BEGIN
    -- Add supply_demand_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmer_bids' AND column_name='supply_demand_id') THEN
        ALTER TABLE farmer_bids ADD COLUMN supply_demand_id UUID REFERENCES supply_demands(id) ON DELETE CASCADE;
    END IF;

    -- Add proposed_quantity if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmer_bids' AND column_name='proposed_quantity') THEN
        ALTER TABLE farmer_bids ADD COLUMN proposed_quantity DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;

    -- Add proposed_price_per_unit if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmer_bids' AND column_name='proposed_price_per_unit') THEN
        ALTER TABLE farmer_bids ADD COLUMN proposed_price_per_unit DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;

    -- Add delivery_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmer_bids' AND column_name='delivery_date') THEN
        ALTER TABLE farmer_bids ADD COLUMN delivery_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add notes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmer_bids' AND column_name='notes') THEN
        ALTER TABLE farmer_bids ADD COLUMN notes TEXT;
    END IF;

    -- Add admin_notes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmer_bids' AND column_name='admin_notes') THEN
        ALTER TABLE farmer_bids ADD COLUMN admin_notes TEXT;
    END IF;

    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='farmer_bids' AND column_name='status') THEN
        ALTER TABLE farmer_bids ADD COLUMN status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn'));
    END IF;
END $$;

-- 3. Now it is safe to create the indexes
CREATE INDEX IF NOT EXISTS idx_supply_demands_status ON supply_demands(status);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_demand ON farmer_bids(supply_demand_id);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_farmer ON farmer_bids(farmer_id);

-- 4. Ensure RLS policies are set up correctly
ALTER TABLE supply_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read supply_demands" ON supply_demands;
DROP POLICY IF EXISTS "Insert supply_demands" ON supply_demands;
DROP POLICY IF EXISTS "Update supply_demands" ON supply_demands;

DROP POLICY IF EXISTS "Public read farmer_bids" ON farmer_bids;
DROP POLICY IF EXISTS "Insert farmer_bids" ON farmer_bids;
DROP POLICY IF EXISTS "Update farmer_bids" ON farmer_bids;

CREATE POLICY "Public read supply_demands" ON supply_demands FOR SELECT USING (true);
CREATE POLICY "Insert supply_demands" ON supply_demands FOR INSERT WITH CHECK (true);
CREATE POLICY "Update supply_demands" ON supply_demands FOR UPDATE USING (true);

CREATE POLICY "Public read farmer_bids" ON farmer_bids FOR SELECT USING (true);
CREATE POLICY "Insert farmer_bids" ON farmer_bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Update farmer_bids" ON farmer_bids FOR UPDATE USING (true);

DO $$ BEGIN RAISE NOTICE '✅ farmer_bids schema successfully updated and fixed!'; END $$;
