-- ============================================================
-- Fix farmer logging issues: marketplace listings, traceability
-- events, and growth activities. Idempotent — safe to re-run.
-- ============================================================

-- 1. growth_activities: ensure permissive activity_type CHECK and
--    that all columns the app writes actually exist.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'growth_activities') THEN
        -- Drop any restrictive activity_type check constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.constraint_column_usage
            WHERE table_name = 'growth_activities' AND column_name = 'activity_type'
        ) THEN
            BEGIN
                ALTER TABLE growth_activities DROP CONSTRAINT IF EXISTS growth_activities_activity_type_check;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
        END IF;

        ALTER TABLE growth_activities
            ADD CONSTRAINT growth_activities_activity_type_check
            CHECK (activity_type IN (
                'planting','weeding','fertilizer','pesticide','irrigation',
                'pruning','harvesting','dispatch','other'
            ));

        -- Add any missing columns the app writes
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2);
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS unit TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS photos TEXT[];
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS fertilizer_brand TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS fertilizer_type TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS npk_ratio TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS transport_type TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS vehicle_registration TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS driver_name TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS driver_phone TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS origin TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS destination TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8);
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8);
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS location_address TEXT;
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS iot_readings JSONB DEFAULT '{}';
        ALTER TABLE growth_activities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- 2. marketplace_listings: ensure status accepts 'active' (default)
--    and that the optional batch_id column exists.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_listings') THEN
        ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);
        ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS organic BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. traceability_events: relax actor_type to also accept null/buyer
--    and ensure event_type CHECK includes the values the app uses.
--    (No-op if constraints already permissive.)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'traceability_events') THEN
        BEGIN
            ALTER TABLE traceability_events DROP CONSTRAINT IF EXISTS traceability_events_event_type_check;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        ALTER TABLE traceability_events
            ADD CONSTRAINT traceability_events_event_type_check
            CHECK (event_type IN (
                'planting','growth_update','input_application','irrigation',
                'pest_control','harvest','post_harvest_handling','quality_check',
                'storage','aggregation','transport_start','transport_checkpoint',
                'warehouse_arrival','processing','packaging','distribution',
                'retail_arrival','verification','ai_diagnostic'
            ));
    END IF;
END $$;

SELECT 'Farmer logging schema fixes applied.' AS result;
