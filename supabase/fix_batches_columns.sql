-- Fix for missing blockchain_tx and processing state columns in batches table
-- This allows TraceabilityView and AdminDashboard to work seamlessly

DO $$ 
BEGIN
    -- 1. Add blockchain_tx to store NFT transaction hashes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batches' AND column_name='blockchain_tx') THEN
        ALTER TABLE batches ADD COLUMN blockchain_tx TEXT;
    END IF;

    -- 2. Add ipfs_metadata to store the Pinata link for the NFT
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batches' AND column_name='ipfs_metadata') THEN
        ALTER TABLE batches ADD COLUMN ipfs_metadata TEXT;
    END IF;

    -- 3. Add quality_grade if missing (Warehouse Processing uses this)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batches' AND column_name='quality_grade') THEN
        ALTER TABLE batches ADD COLUMN quality_grade TEXT;
    END IF;

    -- 4. Ensure current_status is updated for 'processing' and 'ready_for_distribution'
    -- Postgres enums or text fields might be restricted by CHECK constraints. 
    -- Removing check constraint on current_status if it exists to allow fluid states, or keeping it as text
    -- Find and drop the constraint if it limits to specific statuses
    DECLARE
        constraint_record record;
    BEGIN
        FOR constraint_record IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            WHERE tc.table_name = 'batches' AND tc.constraint_type = 'CHECK' AND tc.constraint_name LIKE '%status%'
        LOOP
            EXECUTE 'ALTER TABLE batches DROP CONSTRAINT ' || quote_ident(constraint_record.constraint_name);
        END LOOP;
    END;

END $$;

DO $$ BEGIN RAISE NOTICE '✅ batches schema successfully updated for NFT minting and processing states!'; END $$;
