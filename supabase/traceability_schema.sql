-- Traceability Schema for cherry Pick

-- Batches Table
-- Tracks a specific production run of a crop
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_code TEXT UNIQUE NOT NULL, -- The unique identifier for QR codes (e.g., CP-TOM-241106-ABCD)
  contract_id UUID REFERENCES contracts(id), -- Optional link to a contract
  farmer_id UUID REFERENCES farmers(id),
  crop_type TEXT NOT NULL,
  variety TEXT,
  harvest_date TIMESTAMP WITH TIME ZONE,
  total_quantity NUMERIC, -- Initial estimated amount
  unit TEXT DEFAULT 'kg',
  quality_grade TEXT,
  organic_certified BOOLEAN DEFAULT false,
  current_status TEXT DEFAULT 'growing', -- growing, harvested, stored, in_transit, etc.
  current_location TEXT, -- Human readable location
  current_location_lat NUMERIC,
  current_location_lng NUMERIC,
  qr_code_url TEXT, -- Generated URL for the QR code image
  public_url TEXT, -- The public link users scan
  blockchain_tx TEXT, -- TX hash if minted as NFT
  ipfs_metadata TEXT, -- Link to metadata on IPFS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traceability Events Table
-- Logs every step in the supply chain
CREATE TABLE traceability_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batches(id) NOT NULL,
  contract_id UUID REFERENCES contracts(id), -- Optional context
  farmer_id UUID REFERENCES farmers(id), -- Optional context
  
  -- Event Details
  event_type TEXT NOT NULL, -- planting, harvest, transport_start, etc.
  event_title TEXT NOT NULL, -- readable title
  event_description TEXT,
  
  -- Actor (Who did it?)
  actor_id TEXT, -- ID of the user/officer/farmer
  actor_type TEXT, -- farmer, verifier, transporter, etc.
  actor_name TEXT,
  
  -- Location
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_address TEXT,
  
  -- Transport Specifics
  transport_mode TEXT, -- truck, van, etc.
  vehicle_registration TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  origin_location TEXT,
  destination_location TEXT,
  
  -- Storage Specifics
  storage_facility TEXT,
  storage_conditions JSONB, -- { temperature: 20, humidity: 60 }
  
  -- Evidence
  quality_grade TEXT,
  quantity NUMERIC,
  unit TEXT,
  photos TEXT[], -- Array of image URLs
  documents TEXT[], -- Array of document URLs
  iot_readings JSONB, -- IoT sensor data snapshot
  
  -- Verification
  diagnostic_id UUID, -- If linked to an AI diagnostic
  blockchain_tx TEXT, -- TX hash of this event log
  ipfs_hash TEXT, -- IPFS hash of the data
  event_hash TEXT, -- Cryptographic hash of the event data for integrity
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_events ENABLE ROW LEVEL SECURITY;

-- Batches Policies
CREATE POLICY "Public can view batches"
  ON batches FOR SELECT
  USING (true); -- Public needs to view for traceability

CREATE POLICY "Farmers can insert their own batches"
  ON batches FOR INSERT
  WITH CHECK (auth.uid() = farmer_id OR auth.uid()::text = farmer_id::text); -- Adjust based on how auth is handled

CREATE POLICY "Farmers can update their own batches"
  ON batches FOR UPDATE
  USING (auth.uid() = farmer_id OR auth.uid()::text = farmer_id::text);

-- Events Policies
CREATE POLICY "Public can view events"
  ON traceability_events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON traceability_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Marketplace Integration
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);
