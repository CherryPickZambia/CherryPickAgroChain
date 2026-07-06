-- ============================================
-- FIX: Withdrawal ledger fee double-count (the "-K8" bug)
-- ============================================
-- The old withdrawal code recorded the GROSS withdrawal amount on the
-- withdrawal line AND a separate fee line, so the fee was deducted twice.
-- That left affected wallets short by exactly the fee (e.g. balance -K8 after
-- withdrawing everything). The application code now records the NET amount
-- actually sent on the withdrawal line, so NEW withdrawals net to zero.
--
-- This one-time script credits back the double-counted fee for every historical
-- withdrawal-fee line, so affected balances return to their correct value.
--
-- It is idempotent: each correction is keyed by a deterministic transaction_hash
-- ("ADJ-<original fee hash>") and skipped if it already exists.
--
-- Run this ONCE, together with the code deploy that fixes the ledger.

-- 1) Allow the correction payment_type (and future 'withdrawal_fee').
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('milestone','order','refund','platform_fee','withdrawal_fee','adjustment'));

-- 2) Insert one balancing credit per historical withdrawal-fee line.
--    The credit is booked TO the wallet that was over-charged, so the app's
--    balance calculation (incoming when to_address = wallet) nets it back to 0.
INSERT INTO payments (from_address, to_address, amount, currency, payment_type, transaction_hash, status, confirmed_at)
SELECT
  'platform-correction'         AS from_address,
  f.from_address                AS to_address,
  f.amount                      AS amount,
  f.currency                    AS currency,
  'adjustment'                  AS payment_type,
  'ADJ-' || f.transaction_hash  AS transaction_hash,
  'confirmed'                   AS status,
  NOW()                         AS confirmed_at
FROM payments f
WHERE f.payment_type = 'platform_fee'
  AND f.transaction_hash ~* '^FEE-(WD|BANK)-'
  AND NOT EXISTS (
    SELECT 1 FROM payments a WHERE a.transaction_hash = 'ADJ-' || f.transaction_hash
  );

DO $$ BEGIN RAISE NOTICE 'Withdrawal fee double-count correction applied.'; END $$;
