-- Fix RLS Policies for Contracts and Milestones
-- Error encountered: new row violates row-level security policy for table "contracts"

-- Contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on contracts" ON contracts;
DROP POLICY IF EXISTS "Enable all access for contracts" ON contracts;

CREATE POLICY "Enable all access for contracts" ON contracts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on milestones" ON milestones;
DROP POLICY IF EXISTS "Enable all access for milestones" ON milestones;

CREATE POLICY "Enable all access for milestones" ON milestones
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Ensure Farmers also has RLS fixed just in case
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on farmers" ON farmers;
DROP POLICY IF EXISTS "Enable all access for farmers" ON farmers;

CREATE POLICY "Enable all access for farmers" ON farmers
    FOR ALL
    USING (true)
    WITH CHECK (true);
