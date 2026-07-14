-- =============================================================================
-- AgroChain360 / Cherry Pick - Full Supabase schema for a NEW project
-- =============================================================================
-- How to use:
--   1. Create a new Supabase project
--   2. Open SQL Editor → New query
--   3. Paste this entire file and click Run
--   4. Copy Project URL + anon key + service role key into .env.local / Vercel
--
-- Safe to re-run: uses IF NOT EXISTS, DROP POLICY IF EXISTS, and idempotent alters.
-- For a brand-new empty database, one run is enough.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer', 'officer', 'admin')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT false,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- FARMERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
  nrc_id TEXT,
  gender TEXT,
  profile_photo TEXT,
  bio TEXT,
  certifications JSONB DEFAULT '[]',
  -- GLOBALG.A.P. / ISO compliance fields
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  farm_size_hectares NUMERIC(10, 2),
  crops_grown TEXT[] DEFAULT '{}',
  years_farming INTEGER,
  certification_docs TEXT[] DEFAULT '{}',
  soil_type TEXT,
  water_source TEXT,
  farming_method TEXT CHECK (farming_method IN ('conventional', 'organic', 'integrated', 'conservation', 'other')),
  compliance_standards TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- BUYER PROFILES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  delivery_address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Zambia',
  profile_image TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- CONTRACTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_code TEXT UNIQUE NOT NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  crop_type TEXT NOT NULL,
  variety TEXT,
  required_quantity DECIMAL(10, 2) NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  total_value DECIMAL(15, 2) NOT NULL,
  escrow_balance DECIMAL(15, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'draft', 'active', 'in_progress', 'completed', 'cancelled', 'disputed')
  ),
  harvest_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  blockchain_tx TEXT,
  ipfs_metadata TEXT,
  delivered_quantity DECIMAL(10, 2),
  admin_payment_approved BOOLEAN DEFAULT false,
  partial_cycle BOOLEAN DEFAULT false,
  starting_stage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- MILESTONES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  milestone_number INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  payment_percentage INTEGER NOT NULL DEFAULT 0,
  payment_amount DECIMAL(15, 2) NOT NULL,
  expected_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'submitted', 'verified', 'rejected', 'paid')
  ),
  payment_status TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'processing', 'completed', 'failed')
  ),
  farmer_evidence_ipfs TEXT,
  verifier_evidence_ipfs TEXT,
  verifier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  payment_tx TEXT,
  metadata JSONB DEFAULT '{}',
  is_key BOOLEAN DEFAULT false,
  requires_professional_verifier BOOLEAN DEFAULT false,
  sequence_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- EXTENSION OFFICERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS extension_officers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
  completed_tasks INTEGER DEFAULT 0,
  total_earnings DECIMAL(15, 2) DEFAULT 0,
  earnings DECIMAL(15, 2) DEFAULT 0,
  reputation_score INTEGER DEFAULT 100,
  rating DECIMAL(3, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  specializations TEXT[] DEFAULT '{}',
  verifier_type TEXT DEFAULT 'professional' CHECK (verifier_type IN ('professional', 'freelance')),
  ministry_id TEXT,
  certification_number TEXT,
  national_id TEXT,
  service_radius_km INTEGER DEFAULT 50,
  hourly_rate DECIMAL(10, 2),
  total_ratings INTEGER DEFAULT 0,
  profile_photo TEXT,
  bio TEXT,
  verified_by_ministry BOOLEAN DEFAULT false,
  can_verify_high_value BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- BATCHES (QR / trace lookup)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_code TEXT UNIQUE NOT NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  crop_type TEXT NOT NULL,
  variety TEXT,
  harvest_date TIMESTAMPTZ,
  total_quantity DECIMAL(10, 2),
  unit TEXT DEFAULT 'kg',
  quality_grade TEXT,
  organic_certified BOOLEAN DEFAULT false,
  current_status TEXT DEFAULT 'growing',
  current_location TEXT,
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  qr_code_url TEXT,
  public_url TEXT,
  blockchain_tx TEXT,
  ipfs_metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- AI CROP DIAGNOSTICS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crop_diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- TRACEABILITY EVENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS traceability_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT,
  actor_id TEXT,
  actor_type TEXT,
  actor_name TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  transport_mode TEXT,
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
  ai_disease TEXT,
  ai_confidence NUMERIC(5, 2),
  ai_health_score INTEGER,
  ai_treatment_rec TEXT,
  photos TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  iot_readings JSONB DEFAULT '{}',
  diagnostic_id UUID REFERENCES crop_diagnostics(id) ON DELETE SET NULL,
  blockchain_tx TEXT,
  ipfs_hash TEXT,
  previous_event_id UUID REFERENCES traceability_events(id) ON DELETE SET NULL,
  event_hash TEXT,
  compliance_data JSONB,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- MARKETPLACE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_address TEXT,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  crop_type TEXT NOT NULL,
  variety TEXT,
  available_quantity DECIMAL(10, 2) NOT NULL,
  quantity DECIMAL(10, 2),
  price_per_unit DECIMAL(10, 2) NOT NULL,
  price_per_kg DECIMAL(10, 2),
  total_price DECIMAL(15, 2),
  unit TEXT DEFAULT 'kg',
  quality_grade TEXT,
  organic BOOLEAN DEFAULT false,
  harvest_date DATE,
  location TEXT,
  description TEXT,
  image_url TEXT,
  certifications TEXT[],
  images TEXT[],
  delivery_options TEXT[],
  ai_health_score NUMERIC,
  ai_diagnosis TEXT,
  ai_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (
    status IN ('active', 'sold', 'expired', 'cancelled', 'pending')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  buyer_address TEXT,
  buyer_name TEXT,
  farmer_address TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_tx_hash TEXT,
  payment_tx TEXT,
  delivery_status TEXT DEFAULT 'pending',
  delivery_address TEXT,
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- SUPPLY DEMANDS & BIDS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supply_demands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  variety TEXT,
  required_quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT DEFAULT 'kg',
  max_price_per_unit DECIMAL(10, 2),
  target_price_per_kg DECIMAL(10, 2),
  delivery_deadline TIMESTAMPTZ,
  quality_requirements TEXT,
  description TEXT,
  location TEXT,
  status TEXT DEFAULT 'open' CHECK (
    status IN ('open', 'partially_filled', 'filled', 'closed', 'active')
  ),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farmer_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_demand_id UUID REFERENCES supply_demands(id) ON DELETE CASCADE,
  demand_id UUID REFERENCES supply_demands(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  proposed_quantity DECIMAL(10, 2) NOT NULL,
  proposed_price_per_unit DECIMAL(10, 2) NOT NULL,
  offered_quantity DECIMAL(10, 2),
  offered_price_per_kg DECIMAL(10, 2),
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  message TEXT,
  admin_notes TEXT,
  source_type TEXT CHECK (
    source_type IS NULL OR source_type IN ('own_produce', 'third_party', 'open_market')
  ),
  traceability_mode TEXT CHECK (
    traceability_mode IS NULL OR traceability_mode IN ('existing_batch', 'intake_details', 'basic_declaration')
  ),
  linked_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  traceability_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_photo_urls TEXT[] NOT NULL DEFAULT '{}',
  ai_scan_result JSONB,
  traceability_strength TEXT CHECK (
    traceability_strength IS NULL OR traceability_strength IN ('high', 'medium', 'basic')
  ),
  status TEXT DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'pending', 'accepted', 'rejected', 'withdrawn')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES extension_officers(id) ON DELETE SET NULL,
  assigned_officer_id UUID REFERENCES extension_officers(id) ON DELETE SET NULL,
  location_lat DECIMAL(10, 8) NOT NULL DEFAULT 0,
  location_lng DECIMAL(11, 8) NOT NULL DEFAULT 0,
  location_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected')
  ),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  task_type TEXT DEFAULT 'milestone',
  verification_type TEXT DEFAULT 'milestone',
  is_freelance BOOLEAN DEFAULT false,
  fee DECIMAL(10, 2),
  distance_km DECIMAL(10, 2),
  activities JSONB DEFAULT '[]',
  officer_notes TEXT,
  notes TEXT,
  verification_photos TEXT[],
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES extension_officers(id) ON DELETE SET NULL,
  assigned_officer_id UUID REFERENCES extension_officers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'assigned', 'in_progress', 'completed', 'rejected')
  ),
  verification_fee DECIMAL(10, 2) DEFAULT 0,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  evidence_type TEXT,
  type TEXT,
  ipfs_hash TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  description TEXT,
  photos TEXT[],
  geo_lat DECIMAL(10, 8),
  geo_lng DECIMAL(11, 8),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verifier_fee_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_type TEXT NOT NULL,
  base_fee DECIMAL(10, 2) NOT NULL,
  distance_rate_per_km DECIMAL(10, 2) DEFAULT 0,
  farmer_deduction_percent DECIMAL(5, 2) DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- GROWTH ACTIVITIES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS growth_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  quantity DECIMAL(10, 2),
  unit TEXT,
  photos TEXT[],
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
  readings JSONB DEFAULT '{}',
  dispatch_data JSONB,
  logged_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- PAYMENTS (wallet ledger + milestone/escrow fields)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_address TEXT,
  to_address TEXT,
  amount DECIMAL(15, 6) NOT NULL,
  currency TEXT DEFAULT 'USDC',
  payment_type TEXT,
  reference_id UUID,
  reference_type TEXT,
  transaction_hash TEXT,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  recipient_id UUID,
  recipient_type TEXT CHECK (recipient_type IN ('farmer', 'officer')),
  status TEXT DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- ESCROW (CDP server wallet)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escrow_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cdp_wallet_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT DEFAULT 'base',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  amount DECIMAL(15, 6) NOT NULL,
  destination_wallet TEXT,
  status TEXT DEFAULT 'pending',
  server_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- IOT & RATINGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS iot_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  device_type TEXT,
  reading_type TEXT NOT NULL,
  reading_value DECIMAL(15, 4),
  reading_unit TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  raw_data JSONB DEFAULT '{}',
  blockchain_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rater_id TEXT NOT NULL,
  rated_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rated_farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  rating_type TEXT NOT NULL CHECK (rating_type IN ('farmer', 'verifier', 'buyer')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  verification_id UUID REFERENCES verification_requests(id) ON DELETE SET NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- FARMER UPDATES (legacy progress log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmer_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  input_type TEXT,
  input_name TEXT,
  input_quantity DECIMAL(10, 2),
  input_unit TEXT,
  application_method TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  weather_conditions JSONB DEFAULT '{}',
  blockchain_tx TEXT,
  ipfs_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- COMPLIANCE / TRACEABILITY RECORDS (GLOBALG.A.P., ISO 22005, HACCP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crop_production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  crop_type TEXT NOT NULL,
  variety TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  field_identifier TEXT,
  fertilizer_type TEXT,
  fertilizer_quantity NUMERIC(10, 2),
  fertilizer_unit TEXT DEFAULT 'kg',
  fertilizer_application_date DATE,
  fertilizer_method TEXT,
  pesticide_name TEXT,
  pesticide_quantity NUMERIC(10, 2),
  pesticide_unit TEXT DEFAULT 'ml',
  pesticide_application_date DATE,
  pesticide_pre_harvest_interval_days INTEGER,
  pesticide_safety_data_sheet TEXT,
  irrigation_method TEXT,
  irrigation_frequency TEXT,
  water_source TEXT,
  weather_conditions JSONB DEFAULT '{}',
  temperature_avg NUMERIC(5, 2),
  rainfall_mm NUMERIC(8, 2),
  soil_ph NUMERIC(4, 2),
  soil_moisture_pct NUMERIC(5, 2),
  seed_source TEXT,
  seed_variety TEXT,
  seed_treatment TEXT,
  seed_lot_number TEXT,
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  recorded_by TEXT,
  compliance_standard TEXT DEFAULT 'GLOBALG.A.P',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  verifier_id UUID REFERENCES extension_officers(id) ON DELETE SET NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspection_type TEXT,
  crop_health_status TEXT,
  field_photos TEXT[] DEFAULT '{}',
  inspection_notes TEXT,
  pest_observations TEXT,
  disease_observations TEXT,
  weed_status TEXT,
  ai_health_score INTEGER,
  ai_diagnosis TEXT,
  ai_confidence NUMERIC(5, 2),
  ai_recommendations TEXT[] DEFAULT '{}',
  gmp_compliance BOOLEAN DEFAULT false,
  chemical_storage_ok BOOLEAN DEFAULT false,
  ppe_usage_ok BOOLEAN DEFAULT false,
  record_keeping_ok BOOLEAN DEFAULT false,
  water_management_ok BOOLEAN DEFAULT false,
  waste_management_ok BOOLEAN DEFAULT false,
  overall_result TEXT,
  corrective_actions TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  compliance_standard TEXT DEFAULT 'GLOBALG.A.P',
  verifier_signature_ipfs TEXT,
  inspection_report_ipfs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS harvest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  harvest_date DATE NOT NULL,
  crop_type TEXT NOT NULL,
  quantity_harvested NUMERIC(10, 2),
  unit TEXT DEFAULT 'kg',
  quality_grade TEXT,
  harvest_method TEXT,
  field_identifier TEXT,
  sorting_done BOOLEAN DEFAULT false,
  washing_done BOOLEAN DEFAULT false,
  washing_method TEXT,
  drying_method TEXT,
  packaging_type TEXT,
  packaging_material TEXT,
  storage_temperature NUMERIC(5, 2),
  storage_humidity NUMERIC(5, 2),
  storage_facility TEXT,
  cold_chain_maintained BOOLEAN,
  contamination_check BOOLEAN DEFAULT false,
  foreign_matter_check BOOLEAN DEFAULT false,
  chemical_residue_test BOOLEAN,
  microbiological_test BOOLEAN,
  test_results_ipfs TEXT,
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  compliance_standard TEXT DEFAULT 'ISO 22000',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transport_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  transport_date DATE NOT NULL,
  transport_mode TEXT,
  vehicle_registration TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  driver_license TEXT,
  origin_location TEXT,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_location TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  temperature_controlled BOOLEAN DEFAULT false,
  avg_temperature NUMERIC(5, 2),
  humidity_controlled BOOLEAN DEFAULT false,
  avg_humidity NUMERIC(5, 2),
  quantity_loaded NUMERIC(10, 2),
  quantity_received NUMERIC(10, 2),
  quantity_loss NUMERIC(10, 2),
  loss_reason TEXT,
  loading_photos TEXT[] DEFAULT '{}',
  delivery_photos TEXT[] DEFAULT '{}',
  waybill_ipfs TEXT,
  notes TEXT,
  compliance_standard TEXT DEFAULT 'ISO 22005',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  processing_date DATE NOT NULL,
  processor_name TEXT,
  processor_facility TEXT,
  processing_type TEXT,
  processing_method TEXT,
  input_quantity NUMERIC(10, 2),
  output_quantity NUMERIC(10, 2),
  unit TEXT DEFAULT 'kg',
  yield_percentage NUMERIC(5, 2),
  facility_clean BOOLEAN DEFAULT false,
  equipment_sanitized BOOLEAN DEFAULT false,
  staff_hygiene_ok BOOLEAN DEFAULT false,
  temperature_monitored BOOLEAN DEFAULT false,
  haccp_plan_followed BOOLEAN DEFAULT false,
  quality_check_passed BOOLEAN DEFAULT false,
  quality_grade TEXT,
  lab_results_ipfs TEXT,
  packaging_date DATE,
  packaging_type TEXT,
  packaging_material TEXT,
  label_info TEXT,
  barcode TEXT,
  best_before_date DATE,
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  compliance_standard TEXT DEFAULT 'GMP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- LANDING PAGE CMS (single-row JSON document)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS landing_page_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO landing_page_content (id, content)
VALUES ('main', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RPC: decrement listing quantity after order
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_listing_quantity(listing_id UUID, quantity_sold NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE marketplace_listings
  SET
    available_quantity = GREATEST(0, COALESCE(available_quantity, 0) - quantity_sold),
    updated_at = NOW()
  WHERE id = listing_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_farmers_wallet ON farmers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_farmers_status ON farmers(status);
CREATE INDEX IF NOT EXISTS idx_contracts_farmer ON contracts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_code ON contracts(contract_code);
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_batches_code ON batches(batch_code);
CREATE INDEX IF NOT EXISTS idx_batches_contract ON batches(contract_id);
CREATE INDEX IF NOT EXISTS idx_batches_farmer ON batches(farmer_id);
CREATE INDEX IF NOT EXISTS idx_traceability_batch ON traceability_events(batch_id);
CREATE INDEX IF NOT EXISTS idx_traceability_contract ON traceability_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_traceability_compliance_data ON traceability_events USING GIN (compliance_data);
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON marketplace_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_crop ON marketplace_listings(crop_type);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_address ON marketplace_orders(buyer_address);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON marketplace_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_supply_demands_status ON supply_demands(status);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_demand ON farmer_bids(supply_demand_id);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_demand_legacy ON farmer_bids(demand_id);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_farmer ON farmer_bids(farmer_id);
CREATE INDEX IF NOT EXISTS idx_growth_activities_contract ON growth_activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_growth_activities_farmer ON growth_activities(farmer_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_location ON verification_requests(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_payments_tx ON payments(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_to_address ON payments(to_address);
CREATE INDEX IF NOT EXISTS idx_payments_from_address ON payments(from_address);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_crop_diagnostics_farmer ON crop_diagnostics(farmer_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_farmer ON iot_readings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_device ON iot_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_ratings_farmer ON ratings(rated_farmer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_wallet ON buyer_profiles(wallet_address);

-- ---------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_farmers_updated_at ON farmers;
CREATE TRIGGER trg_farmers_updated_at
  BEFORE UPDATE ON farmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_milestones_updated_at ON milestones;
CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_batches_updated_at ON batches;
CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_marketplace_listings_updated_at ON marketplace_listings;
CREATE TRIGGER trg_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_marketplace_orders_updated_at ON marketplace_orders;
CREATE TRIGGER trg_marketplace_orders_updated_at
  BEFORE UPDATE ON marketplace_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_buyer_profiles_updated_at ON buyer_profiles;
CREATE TRIGGER trg_buyer_profiles_updated_at
  BEFORE UPDATE ON buyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_verification_requests_updated_at ON verification_requests;
CREATE TRIGGER trg_verification_requests_updated_at
  BEFORE UPDATE ON verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_landing_page_content_updated_at ON landing_page_content;
CREATE TRIGGER trg_landing_page_content_updated_at
  BEFORE UPDATE ON landing_page_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (permissive - app uses wallet auth, not Supabase Auth)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'farmers', 'buyer_profiles', 'contracts', 'milestones',
    'extension_officers', 'batches', 'traceability_events', 'crop_diagnostics',
    'marketplace_listings', 'marketplace_orders', 'supply_demands', 'farmer_bids',
    'verification_requests', 'verification_tasks', 'evidence', 'verifier_fee_config',
    'growth_activities', 'payments', 'escrow_wallets', 'escrow_transactions',
    'iot_readings', 'ratings', 'farmer_updates',
    'crop_production_logs', 'field_inspections', 'harvest_records',
    'transport_records', 'processing_records', 'landing_page_content'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'allow_all_' || tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)',
      'allow_all_' || tbl, tbl
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

DO $$
BEGIN
  RAISE NOTICE 'AgroChain360 schema ready. Update NEXT_PUBLIC_SUPABASE_URL and keys in your app.';
END $$;
