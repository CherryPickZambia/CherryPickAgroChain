-- Fix Marketplace Orders Schema
-- This script ensures the marketplace_orders table exists and has all required columns

-- 1. Create the table if it doesn't exist (Base definition)
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns safely (idempotent)
DO $$ 
BEGIN 
    -- listing_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'listing_id') THEN
        ALTER TABLE marketplace_orders ADD COLUMN listing_id UUID;
    END IF;

    -- buyer_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'buyer_address') THEN
        ALTER TABLE marketplace_orders ADD COLUMN buyer_address TEXT;
    END IF;

    -- buyer_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'buyer_name') THEN
        ALTER TABLE marketplace_orders ADD COLUMN buyer_name TEXT;
    END IF;

    -- farmer_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'farmer_address') THEN
        ALTER TABLE marketplace_orders ADD COLUMN farmer_address TEXT;
    END IF;

    -- quantity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'quantity') THEN
        ALTER TABLE marketplace_orders ADD COLUMN quantity NUMERIC;
    END IF;

    -- unit_price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'unit_price') THEN
        ALTER TABLE marketplace_orders ADD COLUMN unit_price NUMERIC;
    END IF;

    -- total_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'total_amount') THEN
        ALTER TABLE marketplace_orders ADD COLUMN total_amount NUMERIC;
    END IF;

    -- payment_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'payment_status') THEN
        ALTER TABLE marketplace_orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;

    -- delivery_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'delivery_status') THEN
        ALTER TABLE marketplace_orders ADD COLUMN delivery_status TEXT DEFAULT 'pending';
    END IF;

    -- delivery_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_orders' AND column_name = 'delivery_address') THEN
        ALTER TABLE marketplace_orders ADD COLUMN delivery_address TEXT;
    END IF;
END $$;

-- 3. Enable RLS and Policies
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now to prevent permission errors during testing
DROP POLICY IF EXISTS "Enable all access for all users" ON marketplace_orders;
CREATE POLICY "Enable all access for all users" ON marketplace_orders FOR ALL USING (true) WITH CHECK (true);

-- 4. Notify success
SELECT 'Marketplace Orders Schema Fixed Successfully' as result;
