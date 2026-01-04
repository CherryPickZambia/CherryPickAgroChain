-- ============================================
-- FEATURE UPDATES: Verifiers, Traceability, Ratings, AI Diagnostics
-- ============================================

-- ============================================
-- UPDATE USERS TABLE - Add verifier type
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS verifier_type TEXT CHECK (verifier_type IN ('professional', 'freelance'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS ministry_id TEXT; -- For professional verifiers
ALTER TABLE users ADD COLUMN IF NOT EXISTS certification_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id TEXT; -- For freelance verifiers
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============================================
-- FARMER PROGRESS UPDATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS farmer_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    update_type TEXT NOT NULL CHECK (update_type IN ('progress', 'issue', 'harvest', 'input_application', 'general')),
    title TEXT NOT NULL,
    description TEXT,
    photos TEXT[] DEFAULT '{}',
    -- Input tracking (fertilizers, pesticides, etc.)
    input_type TEXT CHECK (input_type IN ('fertilizer', 'pesticide', 'herbicide', 'seed', 'water', 'other')),
    input_name TEXT,
    input_quantity DECIMAL(10, 2),
    input_unit TEXT,
    application_method TEXT,
    -- Location data
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    -- Weather conditions at time of update
    weather_conditions JSONB DEFAULT '{}',
    -- Blockchain hash for traceability
    blockchain_tx TEXT,
    ipfs_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI CROP DIAGNOSTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crop_diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id),
    photo_url TEXT NOT NULL,
    crop_type TEXT,
    -- AI Analysis Results
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    diagnosis TEXT,
    identified_issues TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    confidence_score DECIMAL(5, 2),
    ai_provider TEXT DEFAULT 'openai', -- openai, agripredict, etc.
    raw_response JSONB DEFAULT '{}',
    -- Location
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    -- Blockchain logging
    blockchain_tx TEXT,
    ipfs_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRACEABILITY LEDGER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS traceability_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL, -- Unique batch identifier for QR code
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
    -- Actor information
    actor_id UUID REFERENCES users(id),
    actor_type TEXT CHECK (actor_type IN ('farmer', 'verifier', 'transporter', 'warehouse', 'processor', 'admin')),
    actor_name TEXT,
    -- Location tracking
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    -- Transport specific
    transport_mode TEXT CHECK (transport_mode IN ('truck', 'van', 'motorcycle', 'bicycle', 'other')),
    vehicle_registration TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    origin_location TEXT,
    destination_location TEXT,
    -- Storage specific
    storage_facility TEXT,
    storage_conditions JSONB DEFAULT '{}', -- temperature, humidity, etc.
    -- Quality data
    quality_grade TEXT,
    quantity DECIMAL(10, 2),
    unit TEXT DEFAULT 'kg',
    -- Evidence
    photos TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    -- IoT sensor readings
    iot_readings JSONB DEFAULT '{}',
    -- AI diagnostic reference
    diagnostic_id UUID REFERENCES crop_diagnostics(id),
    -- Blockchain immutability
    blockchain_tx TEXT,
    ipfs_hash TEXT,
    previous_event_id UUID REFERENCES traceability_events(id),
    event_hash TEXT, -- Hash of event data for verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BATCH TRACKING TABLE (for QR codes)
-- ============================================
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code TEXT UNIQUE NOT NULL, -- Human readable code for QR
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id),
    crop_type TEXT NOT NULL,
    variety TEXT,
    harvest_date DATE,
    total_quantity DECIMAL(10, 2),
    unit TEXT DEFAULT 'kg',
    quality_grade TEXT,
    organic_certified BOOLEAN DEFAULT false,
    -- Current status and location
    current_status TEXT DEFAULT 'harvested' CHECK (current_status IN (
        'growing', 'harvested', 'stored', 'in_transit', 'at_warehouse', 
        'processing', 'packaged', 'distributed', 'at_retail', 'sold'
    )),
    current_location TEXT,
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    -- QR code data
    qr_code_url TEXT,
    public_url TEXT, -- Public traceability page URL
    -- Blockchain
    blockchain_tx TEXT,
    ipfs_metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rated_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rated_farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    rating_type TEXT NOT NULL CHECK (rating_type IN ('farmer', 'verifier', 'buyer')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    -- Context
    contract_id UUID REFERENCES contracts(id),
    milestone_id UUID REFERENCES milestones(id),
    verification_id UUID REFERENCES verification_requests(id),
    -- Specific rating categories
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- IOT SENSOR DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS iot_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id),
    device_id TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('soil_sensor', 'weather_station', 'moisture_sensor', 'temperature_sensor', 'camera', 'drone', 'other')),
    -- Reading data
    reading_type TEXT NOT NULL, -- temperature, humidity, soil_moisture, ph, etc.
    reading_value DECIMAL(15, 4),
    reading_unit TEXT,
    -- Location
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    -- Raw data
    raw_data JSONB DEFAULT '{}',
    -- Blockchain logging
    blockchain_tx TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- UPDATE EXTENSION OFFICERS TABLE
-- ============================================
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS verifier_type TEXT DEFAULT 'professional' CHECK (verifier_type IN ('professional', 'freelance'));
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS ministry_id TEXT;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS certification_number TEXT;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 50;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2);
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS verified_by_ministry BOOLEAN DEFAULT false;
ALTER TABLE extension_officers ADD COLUMN IF NOT EXISTS can_verify_high_value BOOLEAN DEFAULT false; -- Only professional can verify high value milestones

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_farmer_updates_farmer ON farmer_updates(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_updates_contract ON farmer_updates(contract_id);
CREATE INDEX IF NOT EXISTS idx_farmer_updates_type ON farmer_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_crop_diagnostics_farmer ON crop_diagnostics(farmer_id);
CREATE INDEX IF NOT EXISTS idx_traceability_batch ON traceability_events(batch_id);
CREATE INDEX IF NOT EXISTS idx_traceability_contract ON traceability_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_traceability_type ON traceability_events(event_type);
CREATE INDEX IF NOT EXISTS idx_batches_code ON batches(batch_code);
CREATE INDEX IF NOT EXISTS idx_batches_contract ON batches(contract_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_farmer ON ratings(rated_farmer_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_farmer ON iot_readings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_device ON iot_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_officers_verifier_type ON extension_officers(verifier_type);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================
ALTER TABLE farmer_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read farmer_updates" ON farmer_updates FOR SELECT USING (true);
CREATE POLICY "Public read crop_diagnostics" ON crop_diagnostics FOR SELECT USING (true);
CREATE POLICY "Public read traceability_events" ON traceability_events FOR SELECT USING (true);
CREATE POLICY "Public read batches" ON batches FOR SELECT USING (true);
CREATE POLICY "Public read ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Public read iot_readings" ON iot_readings FOR SELECT USING (true);

CREATE POLICY "Insert farmer_updates" ON farmer_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert crop_diagnostics" ON crop_diagnostics FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert traceability_events" ON traceability_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert batches" ON batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert ratings" ON ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert iot_readings" ON iot_readings FOR INSERT WITH CHECK (true);

CREATE POLICY "Update farmer_updates" ON farmer_updates FOR UPDATE USING (true);
CREATE POLICY "Update crop_diagnostics" ON crop_diagnostics FOR UPDATE USING (true);
CREATE POLICY "Update traceability_events" ON traceability_events FOR UPDATE USING (true);
CREATE POLICY "Update batches" ON batches FOR UPDATE USING (true);
CREATE POLICY "Update ratings" ON ratings FOR UPDATE USING (true);
CREATE POLICY "Update iot_readings" ON iot_readings FOR UPDATE USING (true);

-- ============================================
-- SUCCESS
-- ============================================
DO $$ BEGIN RAISE NOTICE 'Feature updates migration complete!'; END $$;
