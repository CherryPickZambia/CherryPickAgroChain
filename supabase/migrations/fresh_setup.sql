-- ============================================
-- FRESH DATABASE SETUP FOR CHERRY PICK AGROCHAIN
-- Run this if you have a clean database or want to reset
-- ============================================

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS iot_readings CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS traceability_events CASCADE;
DROP TABLE IF EXISTS crop_diagnostics CASCADE;
DROP TABLE IF EXISTS farmer_updates CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS marketplace_orders CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS extension_officers CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer', 'officer', 'admin')),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    verified BOOLEAN DEFAULT false,
    -- Verifier specific fields
    verifier_type TEXT CHECK (verifier_type IN ('professional', 'freelance')),
    ministry_id TEXT,
    certification_number TEXT,
    specializations TEXT[] DEFAULT '{}',
    national_id TEXT,
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline')),
    rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    profile_photo TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FARMERS TABLE
-- ============================================
CREATE TABLE farmers (
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
    rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE contracts (
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
CREATE TABLE milestones (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EXTENSION OFFICERS TABLE
-- ============================================
CREATE TABLE extension_officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    total_verifications INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    total_earnings DECIMAL(15, 2) DEFAULT 0,
    reputation_score INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    -- Verifier type fields
    verifier_type TEXT DEFAULT 'professional' CHECK (verifier_type IN ('professional', 'freelance')),
    ministry_id TEXT,
    certification_number TEXT,
    national_id TEXT,
    specializations TEXT[] DEFAULT '{}',
    service_radius_km INTEGER DEFAULT 50,
    hourly_rate DECIMAL(10, 2),
    rating DECIMAL(3, 2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    profile_photo TEXT,
    bio TEXT,
    verified_by_ministry BOOLEAN DEFAULT false,
    can_verify_high_value BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE LISTINGS
-- ============================================
CREATE TABLE marketplace_listings (
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
CREATE TABLE marketplace_orders (
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
-- VERIFICATION REQUESTS
-- ============================================
CREATE TABLE verification_requests (
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
CREATE TABLE evidence (
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
CREATE TABLE payments (
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
-- FARMER PROGRESS UPDATES TABLE
-- ============================================
CREATE TABLE farmer_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    update_type TEXT NOT NULL CHECK (update_type IN ('progress', 'issue', 'harvest', 'input_application', 'general')),
    title TEXT NOT NULL,
    description TEXT,
    photos TEXT[] DEFAULT '{}',
    input_type TEXT CHECK (input_type IN ('fertilizer', 'pesticide', 'herbicide', 'seed', 'water', 'other')),
    input_name TEXT,
    input_quantity DECIMAL(10, 2),
    input_unit TEXT,
    application_method TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    weather_conditions JSONB DEFAULT '{}',
    blockchain_tx TEXT,
    ipfs_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI CROP DIAGNOSTICS TABLE
-- ============================================
CREATE TABLE crop_diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id),
    photo_url TEXT NOT NULL,
    crop_type TEXT,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    diagnosis TEXT,
    identified_issues TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    confidence_score DECIMAL(5, 2),
    ai_provider TEXT DEFAULT 'openai',
    raw_response JSONB DEFAULT '{}',
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    blockchain_tx TEXT,
    ipfs_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRACEABILITY EVENTS TABLE
-- ============================================
CREATE TABLE traceability_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'planting', 'growth_update', 'input_application', 'irrigation',
        'pest_control', 'harvest', 'post_harvest_handling', 'quality_check',
        'storage', 'aggregation', 'transport_start', 'transport_checkpoint',
        'warehouse_arrival', 'processing', 'packaging', 'distribution',
        'retail_arrival', 'verification', 'ai_diagnostic'
    )),
    event_title TEXT NOT NULL,
    event_description TEXT,
    actor_id UUID REFERENCES users(id),
    actor_type TEXT CHECK (actor_type IN ('farmer', 'verifier', 'transporter', 'warehouse', 'processor', 'admin')),
    actor_name TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    transport_mode TEXT CHECK (transport_mode IN ('truck', 'van', 'motorcycle', 'bicycle', 'other')),
    vehicle_registration TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    origin_location TEXT,
    destination_location TEXT,
    storage_facility TEXT,
    storage_conditions JSONB DEFAULT '{}',
    quality_grade TEXT,
    quantity DECIMAL(10, 2),
    unit TEXT DEFAULT 'kg',
    photos TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    iot_readings JSONB DEFAULT '{}',
    diagnostic_id UUID REFERENCES crop_diagnostics(id),
    blockchain_tx TEXT,
    ipfs_hash TEXT,
    previous_event_id UUID REFERENCES traceability_events(id),
    event_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BATCHES TABLE (for QR codes)
-- ============================================
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code TEXT UNIQUE NOT NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id),
    crop_type TEXT NOT NULL,
    variety TEXT,
    harvest_date DATE,
    total_quantity DECIMAL(10, 2),
    unit TEXT DEFAULT 'kg',
    quality_grade TEXT,
    organic_certified BOOLEAN DEFAULT false,
    current_status TEXT DEFAULT 'harvested' CHECK (current_status IN (
        'growing', 'harvested', 'stored', 'in_transit', 'at_warehouse', 
        'processing', 'packaged', 'distributed', 'at_retail', 'sold'
    )),
    current_location TEXT,
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    qr_code_url TEXT,
    public_url TEXT,
    blockchain_tx TEXT,
    ipfs_metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rated_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rated_farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    rating_type TEXT NOT NULL CHECK (rating_type IN ('farmer', 'verifier', 'buyer')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    contract_id UUID REFERENCES contracts(id),
    milestone_id UUID REFERENCES milestones(id),
    verification_id UUID REFERENCES verification_requests(id),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- IOT SENSOR DATA TABLE
-- ============================================
CREATE TABLE iot_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id),
    device_id TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('soil_sensor', 'weather_station', 'moisture_sensor', 'temperature_sensor', 'camera', 'drone', 'other')),
    reading_type TEXT NOT NULL,
    reading_value DECIMAL(15, 4),
    reading_unit TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    raw_data JSONB DEFAULT '{}',
    blockchain_tx TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
ALTER TABLE farmer_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_readings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Allow all operations (for development)
-- ============================================
CREATE POLICY "Allow all users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all farmers" ON farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all contracts" ON contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all milestones" ON milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all listings" ON marketplace_listings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all orders" ON marketplace_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all officers" ON extension_officers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all verification_requests" ON verification_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all evidence" ON evidence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all farmer_updates" ON farmer_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all crop_diagnostics" ON crop_diagnostics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all traceability_events" ON traceability_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all batches" ON batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all ratings" ON ratings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all iot_readings" ON iot_readings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_farmers_wallet ON farmers(wallet_address);
CREATE INDEX idx_farmers_status ON farmers(status);
CREATE INDEX idx_contracts_farmer ON contracts(farmer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_milestones_contract ON milestones(contract_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_farmer ON marketplace_listings(farmer_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_location ON verification_requests(location_lat, location_lng);
CREATE INDEX idx_payments_tx ON payments(transaction_hash);
CREATE INDEX idx_farmer_updates_farmer ON farmer_updates(farmer_id);
CREATE INDEX idx_farmer_updates_contract ON farmer_updates(contract_id);
CREATE INDEX idx_crop_diagnostics_farmer ON crop_diagnostics(farmer_id);
CREATE INDEX idx_traceability_batch ON traceability_events(batch_id);
CREATE INDEX idx_traceability_contract ON traceability_events(contract_id);
CREATE INDEX idx_batches_code ON batches(batch_code);
CREATE INDEX idx_batches_contract ON batches(contract_id);
CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX idx_ratings_rated_farmer ON ratings(rated_farmer_id);
CREATE INDEX idx_iot_readings_farmer ON iot_readings(farmer_id);
CREATE INDEX idx_iot_readings_device ON iot_readings(device_id);
CREATE INDEX idx_officers_verifier_type ON extension_officers(verifier_type);

-- ============================================
-- SUCCESS
-- ============================================
DO $$ BEGIN RAISE NOTICE 'Cherry Pick AgroChain database setup complete!'; END $$;
