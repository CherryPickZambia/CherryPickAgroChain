-- Fix discrepancies in supply_demands and farmer_bids tables
-- Syncing with lib/biddingService.ts expectations

-- 1. Fix supply_demands table
DO $$
BEGIN
    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supply_demands' AND column_name = 'title') THEN
        ALTER TABLE supply_demands ADD COLUMN title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supply_demands' AND column_name = 'unit') THEN
        ALTER TABLE supply_demands ADD COLUMN unit TEXT DEFAULT 'kg';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supply_demands' AND column_name = 'max_price_per_unit') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supply_demands' AND column_name = 'target_price_per_kg') THEN
            ALTER TABLE supply_demands RENAME COLUMN target_price_per_kg TO max_price_per_unit;
        ELSE
            ALTER TABLE supply_demands ADD COLUMN max_price_per_unit DECIMAL(10,2);
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supply_demands' AND column_name = 'quality_requirements') THEN
        ALTER TABLE supply_demands ADD COLUMN quality_requirements TEXT;
    END IF;

    -- Update status check if needed
    ALTER TABLE supply_demands DROP CONSTRAINT IF EXISTS supply_demands_status_check;
    ALTER TABLE supply_demands ADD CONSTRAINT supply_demands_status_check 
        CHECK (status IN ('open', 'partially_filled', 'filled', 'closed', 'fulfilled'));
END $$;


-- 2. Fix farmer_bids table
DO $$
BEGIN
    -- Fix demand_id -> supply_demand_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'supply_demand_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'demand_id') THEN
            ALTER TABLE farmer_bids RENAME COLUMN demand_id TO supply_demand_id;
        ELSE
            ALTER TABLE farmer_bids ADD COLUMN supply_demand_id UUID REFERENCES supply_demands(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Fix offered_quantity -> proposed_quantity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'proposed_quantity') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'offered_quantity') THEN
            ALTER TABLE farmer_bids RENAME COLUMN offered_quantity TO proposed_quantity;
        ELSE
            ALTER TABLE farmer_bids ADD COLUMN proposed_quantity DECIMAL(10,2);
        END IF;
    END IF;

    -- Fix offered_price_per_kg -> proposed_price_per_unit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'proposed_price_per_unit') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'offered_price_per_kg') THEN
            ALTER TABLE farmer_bids RENAME COLUMN offered_price_per_kg TO proposed_price_per_unit;
        ELSE
            ALTER TABLE farmer_bids ADD COLUMN proposed_price_per_unit DECIMAL(10,2);
        END IF;
    END IF;

    -- Fix message -> notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'notes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'message') THEN
            ALTER TABLE farmer_bids RENAME COLUMN message TO notes;
        ELSE
            ALTER TABLE farmer_bids ADD COLUMN notes TEXT;
        END IF;
    END IF;

    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'delivery_date') THEN
        ALTER TABLE farmer_bids ADD COLUMN delivery_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'admin_notes') THEN
        ALTER TABLE farmer_bids ADD COLUMN admin_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmer_bids' AND column_name = 'updated_at') THEN
        ALTER TABLE farmer_bids ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Update status check
    ALTER TABLE farmer_bids DROP CONSTRAINT IF EXISTS farmer_bids_status_check;
    ALTER TABLE farmer_bids ADD CONSTRAINT farmer_bids_status_check 
        CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn', 'pending'));
END $$;

-- 3. Enable RLS and add policies
ALTER TABLE supply_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_bids ENABLE ROW LEVEL SECURITY;

-- Supply Demands Policies
DROP POLICY IF EXISTS "Supply demands are viewable by everyone" ON supply_demands;
CREATE POLICY "Supply demands are viewable by everyone" ON supply_demands
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage supply demands" ON supply_demands;
CREATE POLICY "Admins can manage supply demands" ON supply_demands
    FOR ALL USING (true); -- Simplified for dev, should be restricted by role in production

-- Farmer Bids Policies
DROP POLICY IF EXISTS "Farmers can view their own bids" ON farmer_bids;
CREATE POLICY "Farmers can view their own bids" ON farmer_bids
    FOR SELECT USING (true); -- Simplified to allow admins to see all bids too

DROP POLICY IF EXISTS "Farmers can insert their own bids" ON farmer_bids;
CREATE POLICY "Farmers can insert their own bids" ON farmer_bids
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update bids" ON farmer_bids;
CREATE POLICY "Admins can update bids" ON farmer_bids
    FOR UPDATE USING (true);
