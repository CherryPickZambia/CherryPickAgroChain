-- Consumer QR experience: scan analytics + complaint (feedback) loop.
-- Safe to run multiple times.

-- ── QR scan analytics ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id TEXT NOT NULL,
  batch_code TEXT,
  batch_id UUID,
  device_type TEXT,
  country TEXT,
  approx_location TEXT,
  timezone TEXT,
  language TEXT,
  is_repeat BOOLEAN DEFAULT false,
  referrer TEXT,
  user_agent TEXT,
  retail_outlet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_scans_batch_code ON qr_scans(batch_code);
CREATE INDEX IF NOT EXISTS idx_qr_scans_created_at ON qr_scans(created_at);

-- ── Consumer complaints / feedback ───────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code TEXT,
  batch_id UUID,
  product_name TEXT,
  processing_date TEXT,
  scan_reference TEXT,
  farmer_batch TEXT,
  retail_outlet TEXT,
  issue_type TEXT NOT NULL,
  description TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_complaints_batch_code ON complaints(batch_code);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

-- Public (anon) can record their own scans and submit complaints; the app
-- reads aggregates on the admin side. Permissive policies keep the consumer
-- flow working with the anon key while RLS stays enabled.
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS qr_scans_all ON qr_scans;
CREATE POLICY qr_scans_all ON qr_scans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS complaints_all ON complaints;
CREATE POLICY complaints_all ON complaints FOR ALL USING (true) WITH CHECK (true);
