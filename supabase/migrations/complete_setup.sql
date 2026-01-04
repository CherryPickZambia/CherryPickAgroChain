CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
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
-- FARMERS TABLE
-- ============================================
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
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTRACTS TABLE
-- ============================================
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

-- ============================================
-- MILESTONES TABLE
-- ============================================
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
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
    farmer_evidence_ipfs TEXT,
    verifier_evidence_ipfs TEXT,
    verifier_id UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    payment_tx TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE LISTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    variety TEXT,
    available_quantity DECIMAL(10, 2) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(15, 2),
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

-- ============================================
-- MARKETPLACE ORDERS
-- ============================================
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

-- ============================================
-- EXTENSION OFFICERS
-- ============================================
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
-- VERIFICATION REQUESTS (GPS-based officer dispatch)
-- ============================================
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
-- EVIDENCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    evidence_type TEXT CHECK (evidence_type IN ('photo', 'document', 'iot_reading', 'gps', 'video')),
    ipfs_hash TEXT,
    file_url TEXT,
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
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
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - SELECT (Read)
-- ============================================
DROP POLICY IF EXISTS "Public read users" ON users;
DROP POLICY IF EXISTS "Public read farmers" ON farmers;
DROP POLICY IF EXISTS "Public read contracts" ON contracts;
DROP POLICY IF EXISTS "Public read milestones" ON milestones;
DROP POLICY IF EXISTS "Public read listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Public read orders" ON marketplace_orders;
DROP POLICY IF EXISTS "Public read officers" ON extension_officers;
DROP POLICY IF EXISTS "Public read verification_requests" ON verification_requests;
DROP POLICY IF EXISTS "Public read evidence" ON evidence;
DROP POLICY IF EXISTS "Public read payments" ON payments;

CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read farmers" ON farmers FOR SELECT USING (true);
CREATE POLICY "Public read contracts" ON contracts FOR SELECT USING (true);
CREATE POLICY "Public read milestones" ON milestones FOR SELECT USING (true);
CREATE POLICY "Public read listings" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Public read orders" ON marketplace_orders FOR SELECT USING (true);
CREATE POLICY "Public read officers" ON extension_officers FOR SELECT USING (true);
CREATE POLICY "Public read verification_requests" ON verification_requests FOR SELECT USING (true);
CREATE POLICY "Public read evidence" ON evidence FOR SELECT USING (true);
CREATE POLICY "Public read payments" ON payments FOR SELECT USING (true);

-- ============================================
-- RLS POLICIES - INSERT
-- ============================================
DROP POLICY IF EXISTS "Insert users" ON users;
DROP POLICY IF EXISTS "Insert farmers" ON farmers;
DROP POLICY IF EXISTS "Insert contracts" ON contracts;
DROP POLICY IF EXISTS "Insert milestones" ON milestones;
DROP POLICY IF EXISTS "Insert listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Insert orders" ON marketplace_orders;
DROP POLICY IF EXISTS "Insert officers" ON extension_officers;
DROP POLICY IF EXISTS "Insert verification_requests" ON verification_requests;
DROP POLICY IF EXISTS "Insert evidence" ON evidence;
DROP POLICY IF EXISTS "Insert payments" ON payments;

CREATE POLICY "Insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert farmers" ON farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert contracts" ON contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert milestones" ON milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert listings" ON marketplace_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert orders" ON marketplace_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert officers" ON extension_officers FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert verification_requests" ON verification_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert evidence" ON evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert payments" ON payments FOR INSERT WITH CHECK (true);

-- ============================================
-- RLS POLICIES - UPDATE
-- ============================================
DROP POLICY IF EXISTS "Update users" ON users;
DROP POLICY IF EXISTS "Update farmers" ON farmers;
DROP POLICY IF EXISTS "Update contracts" ON contracts;
DROP POLICY IF EXISTS "Update milestones" ON milestones;
DROP POLICY IF EXISTS "Update listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Update orders" ON marketplace_orders;
DROP POLICY IF EXISTS "Update officers" ON extension_officers;
DROP POLICY IF EXISTS "Update verification_requests" ON verification_requests;
DROP POLICY IF EXISTS "Update evidence" ON evidence;
DROP POLICY IF EXISTS "Update payments" ON payments;

CREATE POLICY "Update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Update farmers" ON farmers FOR UPDATE USING (true);
CREATE POLICY "Update contracts" ON contracts FOR UPDATE USING (true);
CREATE POLICY "Update milestones" ON milestones FOR UPDATE USING (true);
CREATE POLICY "Update listings" ON marketplace_listings FOR UPDATE USING (true);
CREATE POLICY "Update orders" ON marketplace_orders FOR UPDATE USING (true);
CREATE POLICY "Update officers" ON extension_officers FOR UPDATE USING (true);
CREATE POLICY "Update verification_requests" ON verification_requests FOR UPDATE USING (true);
CREATE POLICY "Update evidence" ON evidence FOR UPDATE USING (true);
CREATE POLICY "Update payments" ON payments FOR UPDATE USING (true);

-- ============================================
-- RLS POLICIES - DELETE
-- ============================================
DROP POLICY IF EXISTS "Delete users" ON users;
DROP POLICY IF EXISTS "Delete farmers" ON farmers;

CREATE POLICY "Delete users" ON users FOR DELETE USING (true);
CREATE POLICY "Delete farmers" ON farmers FOR DELETE USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_farmers_wallet ON farmers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_farmers_status ON farmers(status);
CREATE INDEX IF NOT EXISTS idx_contracts_farmer ON contracts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON marketplace_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_location ON verification_requests(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_payments_tx ON payments(transaction_hash);

-- ============================================
-- SUCCESS
-- ============================================
DO $$ BEGIN RAISE NOTICE 'Cherry Pick AgroChain database setup complete!'; END $$;
