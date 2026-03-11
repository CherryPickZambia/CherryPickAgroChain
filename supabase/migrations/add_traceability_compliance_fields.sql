-- ============================================================
-- AgroChain 360 — Traceability Compliance Fields
-- Standards: ISO 22005, ISO 22000/HACCP, GLOBALG.A.P., GMP
-- ============================================================

-- ─────────────────────────────────────────────────
-- 1. FARMER REGISTRATION (ISO 22005 + GLOBALG.A.P.)
-- ─────────────────────────────────────────────────
ALTER TABLE farmers
  ADD COLUMN IF NOT EXISTS gps_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS gps_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS farm_size_hectares NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS crops_grown TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_farming INTEGER,
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS certification_docs TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS soil_type TEXT,
  ADD COLUMN IF NOT EXISTS water_source TEXT,
  ADD COLUMN IF NOT EXISTS farming_method TEXT CHECK (farming_method IN ('conventional', 'organic', 'integrated', 'conservation', 'other')),
  ADD COLUMN IF NOT EXISTS compliance_standards TEXT[] DEFAULT '{}';

-- ─────────────────────────────────────────────────
-- 2. CROP PRODUCTION LOG (GLOBALG.A.P.)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crop_production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id),
  batch_id UUID REFERENCES batches(id),

  -- Crop details
  crop_type TEXT NOT NULL,
  variety TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  field_identifier TEXT,

  -- Input tracking (GLOBALG.A.P.)
  fertilizer_type TEXT,
  fertilizer_quantity NUMERIC(10,2),
  fertilizer_unit TEXT DEFAULT 'kg',
  fertilizer_application_date DATE,
  fertilizer_method TEXT,

  pesticide_name TEXT,
  pesticide_quantity NUMERIC(10,2),
  pesticide_unit TEXT DEFAULT 'ml',
  pesticide_application_date DATE,
  pesticide_pre_harvest_interval_days INTEGER,
  pesticide_safety_data_sheet TEXT,

  irrigation_method TEXT CHECK (irrigation_method IN ('drip', 'sprinkler', 'flood', 'furrow', 'rain_fed', 'manual', 'other')),
  irrigation_frequency TEXT,
  water_source TEXT,

  -- Weather (auto-captured or manual)
  weather_conditions JSONB DEFAULT '{}',
  temperature_avg NUMERIC(5,2),
  rainfall_mm NUMERIC(8,2),

  -- Soil data
  soil_ph NUMERIC(4,2),
  soil_moisture_pct NUMERIC(5,2),

  -- Seed data
  seed_source TEXT,
  seed_variety TEXT,
  seed_treatment TEXT,
  seed_lot_number TEXT,

  -- Evidence
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  recorded_by TEXT,

  -- Compliance standard reference
  compliance_standard TEXT DEFAULT 'GLOBALG.A.P',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 3. VERIFICATION / FIELD INSPECTION (ISO 22005 + GLOBALG.A.P.)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS field_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id),
  batch_id UUID REFERENCES batches(id),
  milestone_id UUID REFERENCES milestones(id),
  verifier_id UUID REFERENCES extension_officers(id),

  -- Inspection details
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspection_type TEXT CHECK (inspection_type IN ('routine', 'milestone', 'random', 'complaint', 'follow_up')),
  crop_health_status TEXT CHECK (crop_health_status IN ('excellent', 'good', 'fair', 'poor', 'critical')),

  -- Field observations
  field_photos TEXT[] DEFAULT '{}',
  inspection_notes TEXT,
  pest_observations TEXT,
  disease_observations TEXT,
  weed_status TEXT,

  -- AI analysis (linked)
  ai_health_score INTEGER,
  ai_diagnosis TEXT,
  ai_confidence NUMERIC(5,2),
  ai_recommendations TEXT[] DEFAULT '{}',

  -- Compliance checklist (GLOBALG.A.P.)
  gmp_compliance BOOLEAN DEFAULT FALSE,
  chemical_storage_ok BOOLEAN DEFAULT FALSE,
  ppe_usage_ok BOOLEAN DEFAULT FALSE,
  record_keeping_ok BOOLEAN DEFAULT FALSE,
  water_management_ok BOOLEAN DEFAULT FALSE,
  waste_management_ok BOOLEAN DEFAULT FALSE,

  -- Result
  overall_result TEXT CHECK (overall_result IN ('pass', 'conditional_pass', 'fail', 'pending')),
  corrective_actions TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,

  -- Compliance standard reference
  compliance_standard TEXT DEFAULT 'GLOBALG.A.P',

  -- Digital signature / evidence
  verifier_signature_ipfs TEXT,
  inspection_report_ipfs TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 4. HARVEST & POST-HARVEST (ISO 22000/HACCP + GMP)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS harvest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id),
  batch_id UUID REFERENCES batches(id),

  -- Harvest details
  harvest_date DATE NOT NULL,
  crop_type TEXT NOT NULL,
  quantity_harvested NUMERIC(10,2),
  unit TEXT DEFAULT 'kg',
  quality_grade TEXT,
  harvest_method TEXT,
  field_identifier TEXT,

  -- Post-harvest handling (HACCP / GMP)
  sorting_done BOOLEAN DEFAULT FALSE,
  washing_done BOOLEAN DEFAULT FALSE,
  washing_method TEXT,
  drying_method TEXT,
  packaging_type TEXT,
  packaging_material TEXT,
  storage_temperature NUMERIC(5,2),
  storage_humidity NUMERIC(5,2),
  storage_facility TEXT,
  cold_chain_maintained BOOLEAN,

  -- Food safety (HACCP)
  contamination_check BOOLEAN DEFAULT FALSE,
  foreign_matter_check BOOLEAN DEFAULT FALSE,
  chemical_residue_test BOOLEAN,
  microbiological_test BOOLEAN,
  test_results_ipfs TEXT,

  -- Traceability linking
  photos TEXT[] DEFAULT '{}',
  notes TEXT,

  -- Compliance
  compliance_standard TEXT DEFAULT 'ISO 22000',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 5. TRANSPORT & LOGISTICS (ISO 22005)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transport_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id),
  contract_id UUID REFERENCES contracts(id),

  -- Transport details
  transport_date DATE NOT NULL,
  transport_mode TEXT CHECK (transport_mode IN ('truck', 'van', 'motorcycle', 'bicycle', 'rail', 'other')),
  vehicle_registration TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  driver_license TEXT,

  -- Route
  origin_location TEXT,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_location TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,

  -- Conditions during transport
  temperature_controlled BOOLEAN DEFAULT FALSE,
  avg_temperature NUMERIC(5,2),
  humidity_controlled BOOLEAN DEFAULT FALSE,
  avg_humidity NUMERIC(5,2),

  -- Quantity tracking
  quantity_loaded NUMERIC(10,2),
  quantity_received NUMERIC(10,2),
  quantity_loss NUMERIC(10,2),
  loss_reason TEXT,

  -- Evidence
  loading_photos TEXT[] DEFAULT '{}',
  delivery_photos TEXT[] DEFAULT '{}',
  waybill_ipfs TEXT,
  notes TEXT,

  -- Compliance
  compliance_standard TEXT DEFAULT 'ISO 22005',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 6. PROCESSING & PACKAGING (GMP + HACCP)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS processing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id),

  -- Processing details
  processing_date DATE NOT NULL,
  processor_name TEXT,
  processor_facility TEXT,
  processing_type TEXT,
  processing_method TEXT,

  -- Input / Output
  input_quantity NUMERIC(10,2),
  output_quantity NUMERIC(10,2),
  unit TEXT DEFAULT 'kg',
  yield_percentage NUMERIC(5,2),

  -- GMP compliance
  facility_clean BOOLEAN DEFAULT FALSE,
  equipment_sanitized BOOLEAN DEFAULT FALSE,
  staff_hygiene_ok BOOLEAN DEFAULT FALSE,
  temperature_monitored BOOLEAN DEFAULT FALSE,
  haccp_plan_followed BOOLEAN DEFAULT FALSE,

  -- Quality
  quality_check_passed BOOLEAN DEFAULT FALSE,
  quality_grade TEXT,
  lab_results_ipfs TEXT,

  -- Packaging
  packaging_date DATE,
  packaging_type TEXT,
  packaging_material TEXT,
  label_info TEXT,
  barcode TEXT,
  best_before_date DATE,

  -- Evidence
  photos TEXT[] DEFAULT '{}',
  notes TEXT,

  -- Compliance
  compliance_standard TEXT DEFAULT 'GMP',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- 7. INDEXES for performance
-- ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_crop_production_logs_farmer ON crop_production_logs(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_production_logs_contract ON crop_production_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_crop_production_logs_batch ON crop_production_logs(batch_id);

CREATE INDEX IF NOT EXISTS idx_field_inspections_farmer ON field_inspections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_field_inspections_verifier ON field_inspections(verifier_id);
CREATE INDEX IF NOT EXISTS idx_field_inspections_batch ON field_inspections(batch_id);
CREATE INDEX IF NOT EXISTS idx_field_inspections_date ON field_inspections(inspection_date);

CREATE INDEX IF NOT EXISTS idx_harvest_records_farmer ON harvest_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_harvest_records_batch ON harvest_records(batch_id);

CREATE INDEX IF NOT EXISTS idx_transport_records_batch ON transport_records(batch_id);

CREATE INDEX IF NOT EXISTS idx_processing_records_batch ON processing_records(batch_id);

-- ─────────────────────────────────────────────────
-- 8. Add updated_at trigger
-- ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_crop_production_logs_updated') THEN
    CREATE TRIGGER trg_crop_production_logs_updated BEFORE UPDATE ON crop_production_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_field_inspections_updated') THEN
    CREATE TRIGGER trg_field_inspections_updated BEFORE UPDATE ON field_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_harvest_records_updated') THEN
    CREATE TRIGGER trg_harvest_records_updated BEFORE UPDATE ON harvest_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_transport_records_updated') THEN
    CREATE TRIGGER trg_transport_records_updated BEFORE UPDATE ON transport_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_processing_records_updated') THEN
    CREATE TRIGGER trg_processing_records_updated BEFORE UPDATE ON processing_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
