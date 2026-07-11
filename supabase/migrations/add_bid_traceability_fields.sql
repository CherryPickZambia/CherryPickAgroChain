-- Capture source and traceability evidence when a farmer submits a bid.
-- Safe to run multiple times.

ALTER TABLE farmer_bids
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS traceability_mode TEXT,
  ADD COLUMN IF NOT EXISTS linked_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS traceability_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_photo_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_scan_result JSONB,
  ADD COLUMN IF NOT EXISTS traceability_strength TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farmer_bids_source_type_check'
      AND conrelid = 'farmer_bids'::regclass
  ) THEN
    ALTER TABLE farmer_bids
      ADD CONSTRAINT farmer_bids_source_type_check
      CHECK (source_type IS NULL OR source_type IN ('own_produce', 'third_party', 'open_market'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farmer_bids_traceability_mode_check'
      AND conrelid = 'farmer_bids'::regclass
  ) THEN
    ALTER TABLE farmer_bids
      ADD CONSTRAINT farmer_bids_traceability_mode_check
      CHECK (
        traceability_mode IS NULL
        OR traceability_mode IN ('existing_batch', 'intake_details', 'basic_declaration')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farmer_bids_traceability_strength_check'
      AND conrelid = 'farmer_bids'::regclass
  ) THEN
    ALTER TABLE farmer_bids
      ADD CONSTRAINT farmer_bids_traceability_strength_check
      CHECK (
        traceability_strength IS NULL
        OR traceability_strength IN ('high', 'medium', 'basic')
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION set_farmer_bid_traceability_strength()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  batch_farmer_id UUID;
  batch_contract_id UUID;
BEGIN
  -- Keep legacy bids valid, while requiring complete traceability on new bids
  -- submitted by the updated application.
  IF NEW.source_type IS NULL AND NEW.traceability_mode IS NULL THEN
    NEW.traceability_strength := COALESCE(NEW.traceability_strength, 'basic');
    RETURN NEW;
  END IF;

  IF NEW.source_type IS NULL OR NEW.traceability_mode IS NULL THEN
    RAISE EXCEPTION 'Both source type and traceability mode are required';
  END IF;

  IF NEW.traceability_mode = 'existing_batch' THEN
    IF NEW.source_type <> 'own_produce' OR NEW.linked_batch_id IS NULL THEN
      RAISE EXCEPTION 'An existing batch can only be linked for own produce';
    END IF;

    SELECT farmer_id, contract_id INTO batch_farmer_id, batch_contract_id
    FROM batches
    WHERE id = NEW.linked_batch_id;

    IF batch_farmer_id IS NULL OR batch_farmer_id <> NEW.farmer_id THEN
      RAISE EXCEPTION 'The linked batch does not belong to this farmer';
    END IF;

    IF batch_contract_id IS NOT NULL THEN
      RAISE EXCEPTION 'The linked batch is already attached to a contract';
    END IF;

    NEW.traceability_strength := 'high';
  ELSIF NEW.traceability_mode = 'intake_details' THEN
    IF NEW.linked_batch_id IS NOT NULL THEN
      RAISE EXCEPTION 'Intake traceability cannot also link an existing batch';
    END IF;
    NEW.traceability_strength := 'medium';
  ELSE
    IF NEW.linked_batch_id IS NOT NULL THEN
      RAISE EXCEPTION 'Basic source declarations cannot link an existing batch';
    END IF;
    NEW.traceability_strength := 'basic';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_farmer_bid_traceability_strength ON farmer_bids;
CREATE TRIGGER trg_farmer_bid_traceability_strength
BEFORE INSERT OR UPDATE OF
  source_type,
  traceability_mode,
  linked_batch_id,
  farmer_id,
  traceability_strength
ON farmer_bids
FOR EACH ROW
EXECUTE FUNCTION set_farmer_bid_traceability_strength();

UPDATE farmer_bids
SET traceability_strength = 'basic'
WHERE traceability_strength IS NULL;

CREATE INDEX IF NOT EXISTS idx_farmer_bids_traceability_strength
  ON farmer_bids(traceability_strength);
CREATE INDEX IF NOT EXISTS idx_farmer_bids_linked_batch
  ON farmer_bids(linked_batch_id)
  WHERE linked_batch_id IS NOT NULL;
