-- ============================================
-- MARKETPLACE SCHEMA - CLEAN VERSION
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS officer_verifications CASCADE;
DROP TABLE IF EXISTS marketplace_orders CASCADE;
DROP TABLE IF EXISTS marketplace_listings CASCADE;
DROP TABLE IF EXISTS buyer_profiles CASCADE;
DROP TABLE IF EXISTS officers CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;

-- Create officers table
CREATE TABLE officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  verification_count INTEGER DEFAULT 0,
  approval_rate DECIMAL(5, 2) DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create farmers table
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  farm_size DECIMAL(10, 2),
  crops TEXT[],
  certifications TEXT[],
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace Listings Table
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_address TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image_url TEXT,
  location TEXT,
  harvest_date DATE,
  available_quantity DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'pending')),
  quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'Premium')),
  organic BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace Orders Table
CREATE TABLE marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_address TEXT NOT NULL,
  buyer_name TEXT,
  farmer_address TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_tx_hash TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'preparing', 'in_transit', 'delivered', 'cancelled')),
  delivery_address TEXT,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buyer Profiles Table
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Officer Verifications Table
CREATE TABLE officer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('listing', 'quality', 'delivery', 'dispute')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  images TEXT[],
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_listings_farmer;
DROP INDEX IF EXISTS idx_listings_farmer_address;
DROP INDEX IF EXISTS idx_listings_status;
DROP INDEX IF EXISTS idx_listings_crop;
DROP INDEX IF EXISTS idx_orders_buyer;
DROP INDEX IF EXISTS idx_orders_listing;
DROP INDEX IF EXISTS idx_orders_payment_status;
DROP INDEX IF EXISTS idx_buyer_wallet;
DROP INDEX IF EXISTS idx_verifications_officer;
DROP INDEX IF EXISTS idx_verifications_status;
DROP INDEX IF EXISTS idx_officers_wallet;
DROP INDEX IF EXISTS idx_farmers_wallet;

-- Create indexes
CREATE INDEX idx_listings_farmer ON marketplace_listings(farmer_id);
CREATE INDEX idx_listings_farmer_address ON marketplace_listings(farmer_address);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_crop ON marketplace_listings(crop_type);
CREATE INDEX idx_orders_buyer ON marketplace_orders(buyer_address);
CREATE INDEX idx_orders_listing ON marketplace_orders(listing_id);
CREATE INDEX idx_orders_payment_status ON marketplace_orders(payment_status);
CREATE INDEX idx_buyer_wallet ON buyer_profiles(wallet_address);
CREATE INDEX idx_verifications_officer ON officer_verifications(officer_id);
CREATE INDEX idx_verifications_status ON officer_verifications(status);
CREATE INDEX idx_officers_wallet ON officers(wallet_address);
CREATE INDEX idx_farmers_wallet ON farmers(wallet_address);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for development
CREATE POLICY "Enable all for marketplace_listings" ON marketplace_listings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for marketplace_orders" ON marketplace_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for buyer_profiles" ON buyer_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for officer_verifications" ON officer_verifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for officers" ON officers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for farmers" ON farmers FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON marketplace_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON officer_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON officers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Marketplace schema created successfully!';
  RAISE NOTICE '📊 Tables: officers, farmers, marketplace_listings, marketplace_orders, buyer_profiles, officer_verifications';
  RAISE NOTICE '🔒 RLS enabled on all tables';
  RAISE NOTICE '⚡ All indexes and triggers configured';
END $$;
