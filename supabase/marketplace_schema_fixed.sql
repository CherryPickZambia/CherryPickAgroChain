-- ============================================
-- MARKETPLACE SCHEMA - FIXED VERSION
-- Run this in Supabase SQL Editor
-- ============================================

-- First, create officers table if it doesn't exist
CREATE TABLE IF NOT EXISTS officers (
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

-- Create farmers table if it doesn't exist
CREATE TABLE IF NOT EXISTS farmers (
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
CREATE TABLE IF NOT EXISTS marketplace_listings (
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
CREATE TABLE IF NOT EXISTS marketplace_orders (
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
CREATE TABLE IF NOT EXISTS buyer_profiles (
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
CREATE TABLE IF NOT EXISTS officer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('listing', 'quality', 'delivery', 'dispute')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  images TEXT[], -- Array of image URLs
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_listings_farmer ON marketplace_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_farmer_address ON marketplace_listings(farmer_address);
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_crop ON marketplace_listings(crop_type);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON marketplace_orders(buyer_address);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON marketplace_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON marketplace_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_buyer_wallet ON buyer_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_verifications_officer ON officer_verifications(officer_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON officer_verifications(status);
CREATE INDEX IF NOT EXISTS idx_officers_wallet ON officers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_farmers_wallet ON farmers(wallet_address);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

-- Listings policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON marketplace_listings;
CREATE POLICY "Anyone can view active listings" ON marketplace_listings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Farmers can manage their listings" ON marketplace_listings;
CREATE POLICY "Farmers can manage their listings" ON marketplace_listings
  FOR ALL USING (true);

-- Orders policies
DROP POLICY IF EXISTS "Buyers can view their orders" ON marketplace_orders;
CREATE POLICY "Buyers can view their orders" ON marketplace_orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Farmers can view orders for their listings" ON marketplace_orders;
CREATE POLICY "Farmers can view orders for their listings" ON marketplace_orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create orders" ON marketplace_orders;
CREATE POLICY "Anyone can create orders" ON marketplace_orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update orders" ON marketplace_orders;
CREATE POLICY "Anyone can update orders" ON marketplace_orders
  FOR UPDATE USING (true);

-- Buyer profiles policies
DROP POLICY IF EXISTS "Buyers can manage their profile" ON buyer_profiles;
CREATE POLICY "Buyers can manage their profile" ON buyer_profiles
  FOR ALL USING (true);

-- Officer verifications policies
DROP POLICY IF EXISTS "Officers can manage verifications" ON officer_verifications;
CREATE POLICY "Officers can manage verifications" ON officer_verifications
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can view approved verifications" ON officer_verifications;
CREATE POLICY "Anyone can view approved verifications" ON officer_verifications
  FOR SELECT USING (true);

-- Officers policies
DROP POLICY IF EXISTS "Officers can view their profile" ON officers;
CREATE POLICY "Officers can view their profile" ON officers
  FOR ALL USING (true);

-- Farmers policies
DROP POLICY IF EXISTS "Farmers can view their profile" ON farmers;
CREATE POLICY "Farmers can view their profile" ON farmers
  FOR ALL USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Listings trigger
DROP TRIGGER IF EXISTS update_listings_updated_at ON marketplace_listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Orders trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON marketplace_orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Buyer profiles trigger
DROP TRIGGER IF EXISTS update_buyer_profiles_updated_at ON buyer_profiles;
CREATE TRIGGER update_buyer_profiles_updated_at
  BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verifications trigger
DROP TRIGGER IF EXISTS update_verifications_updated_at ON officer_verifications;
CREATE TRIGGER update_verifications_updated_at
  BEFORE UPDATE ON officer_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Officers trigger
DROP TRIGGER IF EXISTS update_officers_updated_at ON officers;
CREATE TRIGGER update_officers_updated_at
  BEFORE UPDATE ON officers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Farmers trigger
DROP TRIGGER IF EXISTS update_farmers_updated_at ON farmers;
CREATE TRIGGER update_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Marketplace schema created successfully!';
  RAISE NOTICE 'Tables created: officers, farmers, marketplace_listings, marketplace_orders, buyer_profiles, officer_verifications';
  RAISE NOTICE 'All indexes, RLS policies, and triggers configured.';
END $$;
