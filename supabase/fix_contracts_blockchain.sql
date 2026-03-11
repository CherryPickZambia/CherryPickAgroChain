-- Add blockchain_tx column to contracts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'blockchain_tx') THEN
        ALTER TABLE contracts ADD COLUMN blockchain_tx TEXT;
    END IF;
END $$;
