-- SQL Fix for Cherry Pick AgroChain360 Traceability Relationships
-- Run this in your Supabase SQL Editor to ensure standard PostgREST joins work correctly.

-- 1. Ensure batches table has foreign key to farmers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'batches_farmer_id_fkey'
    ) THEN
        ALTER TABLE batches 
        ADD CONSTRAINT batches_farmer_id_fkey 
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Ensure traceability_events has foreign key to batches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'traceability_events_batch_id_fkey'
    ) THEN
        -- If there are orphaned events, we might need to handle them, but typically cleaning is better
        -- ALTER TABLE traceability_events ADD CONSTRAINT traceability_events_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE;
        
        -- Safe approach: link if exists
        ALTER TABLE traceability_events 
        ADD CONSTRAINT traceability_events_batch_id_fkey 
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Ensure traceability_events has foreign key to farmers (contextual)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'traceability_events_farmer_id_fkey'
    ) THEN
        ALTER TABLE traceability_events 
        ADD CONSTRAINT traceability_events_farmer_id_fkey 
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Reload PostgREST schema cache (Supabase does this automatically, but running a schema change triggers it)
NOTIFY pgrst, 'reload schema';

-- 5. Verification check
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name, 
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('batches', 'traceability_events');
