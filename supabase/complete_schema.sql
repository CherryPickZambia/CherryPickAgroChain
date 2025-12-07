-- Cherry Pick Complete Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & ROLES
-- ============================================

-- Users table (all platform users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer', 'officer', 'admin')),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FARMERS
-- ============================================

-- Farmers table (extended farmer info)
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    farm_size DECIMAL(10, 2) DEFAULT 0,
    crops TEXT[] DEFAULT '{}',
    total_earnings DECIMAL(15, 2) DEFAULT 0,
    completed_contracts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTRACTS & MILESTONES
-- ============================================

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_code TEXT UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id),
    crop_type TEXT NOT NULL,
    variety TEXT,
    required_quantity DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    escrow_balance DECIMAL(15, 2) DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'disputed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    harvest_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    blockchain_tx TEXT,
    ipfs_metadata TEXT
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    milestone_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    payment_percentage INTEGER NOT NULL,
    payment_amount DECIMAL(15, 2) NOT NULL,
    expected_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'verified', 'rejected', 'paid')),
    farmer_evidence_ipfs TEXT,
    verifier_evidence_ipfs TEXT,
    verifier_id UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    payment_tx TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE
-- ============================================

-- Marketplace listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    variety TEXT,
    available_quantity DECIMAL(10, 2) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    unit TEXT DEFAULT 'kg',
    quality_grade TEXT CHECK (quality_grade IN ('Premium', 'A', 'B', 'C')),
    organic BOOLEAN DEFAULT false,
    harvest_date DATE,
    location TEXT,
    description TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_listings(id),
    buyer_id UUID REFERENCES users(id),
    farmer_id UUID REFERENCES farmers(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_tx TEXT,
    delivery_address TEXT,
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk orders
CREATE TABLE IF NOT EXISTS bulk_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id),
    buyer_name TEXT,
    crop_type TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    target_price DECIMAL(10, 2) NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk order bids
CREATE TABLE IF NOT EXISTS bulk_order_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_order_id UUID REFERENCES bulk_orders(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id),
    price_per_kg DECIMAL(10, 2) NOT NULL,
    quantity_offered DECIMAL(10, 2) NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- JOBS / TASKS
-- ============================================

-- Jobs table (farming tasks/activities)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    job_type TEXT NOT NULL CHECK (job_type IN ('planting', 'harrowing', 'weeding', 'fertilizing', 'harvesting', 'inspection', 'other')),
    assigned_to UUID REFERENCES farmers(id),
    contract_id UUID REFERENCES contracts(id),
    farm_location TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount DECIMAL(15, 6) NOT NULL,
    currency TEXT DEFAULT 'USDC',
    payment_type TEXT CHECK (payment_type IN ('milestone', 'order', 'refund', 'platform_fee')),
    reference_id UUID,
    reference_type TEXT CHECK (reference_type IN ('milestone', 'order', 'contract')),
    transaction_hash TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- EXTENSION OFFICERS
-- ============================================

-- Extension officers
CREATE TABLE IF NOT EXISTS extension_officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    total_verifications INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    total_earnings DECIMAL(15, 2) DEFAULT 0,
    reputation_score INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VERIFICATION REQUESTS (for GPS-based officer dispatch)
-- ============================================

-- Verification requests table (Yango-style for officers)
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

-- Add metadata column to milestones if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'metadata') THEN
        ALTER TABLE milestones ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_order_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_officers ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed)
CREATE POLICY "Public read access" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON bulk_orders FOR SELECT USING (true);
CREATE POLICY "Public read access" ON farmers FOR SELECT USING (true);
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON marketplace_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON marketplace_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON bulk_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON bulk_order_bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON verification_requests FOR INSERT WITH CHECK (true);

-- Allow updates on farmers (for profile updates)
CREATE POLICY "Farmers can update own profile" ON farmers FOR UPDATE USING (true);
CREATE POLICY "Update milestones" ON milestones FOR UPDATE USING (true);
CREATE POLICY "Update contracts" ON contracts FOR UPDATE USING (true);
CREATE POLICY "Update verification requests" ON verification_requests FOR UPDATE USING (true);
CREATE POLICY "Update users" ON users FOR UPDATE USING (true);

-- Read access for verification requests
CREATE POLICY "Public read verification_requests" ON verification_requests FOR SELECT USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_farmers_wallet ON farmers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_contracts_farmer ON contracts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_crop ON marketplace_listings(crop_type);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_due_date ON jobs(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_tx ON payments(transaction_hash);

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Insert sample farmers
INSERT INTO farmers (wallet_address, name, email, phone, location_address, farm_size, crops, verified) VALUES
('0x742d35Cc6634C0532925a3b844Bc9e7595f8E2B1', 'John Mwale', 'john@farm.zm', '+260971234567', 'Lusaka', 12.5, ARRAY['Mangoes', 'Tomatoes'], true),
('0x8ba1F109551bD432803012645Ac136ddd64DBA72', 'Mary Banda', 'mary@farm.zm', '+260962345678', 'Kabwe', 8.2, ARRAY['Pineapples', 'Cashews'], true),
('0x9f2dF0fed2C77648de5860a4dc508cd0572B6C1a', 'Peter Phiri', 'peter@farm.zm', '+260953456789', 'Kitwe', 15.0, ARRAY['Bananas', 'Beetroot'], false)
ON CONFLICT (wallet_address) DO NOTHING;

-- Insert sample marketplace listings
INSERT INTO marketplace_listings (farmer_id, crop_type, variety, available_quantity, price_per_unit, quality_grade, organic, location, description, status) 
SELECT id, 'Mangoes', 'Kent', 500, 15, 'Premium', true, 'Lusaka', 'Fresh organic Kent mangoes, hand-picked', 'active'
FROM farmers WHERE name = 'John Mwale' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_listings (farmer_id, crop_type, variety, available_quantity, price_per_unit, quality_grade, organic, location, description, status)
SELECT id, 'Tomatoes', 'Roma', 1000, 8, 'A', false, 'Lusaka', 'Fresh Roma tomatoes, perfect for sauces', 'active'
FROM farmers WHERE name = 'John Mwale' LIMIT 1
ON CONFLICT DO NOTHING;

COMMIT;
