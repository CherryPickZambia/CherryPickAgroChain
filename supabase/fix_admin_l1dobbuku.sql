-- =============================================================================
-- Admin fix for L1dobbuku@gmail.com — run on NEW Supabase SQL Editor
-- Run AFTER supabase/agrochain360_new_project.sql
-- =============================================================================

INSERT INTO users (wallet_address, role, name, email, verified)
VALUES (
  '0x0E6c07cd4e8aCAC01dAAbfEc0F9A9A0FDa1235f5',
  'admin',
  'Cherry Pick Admin',
  'L1dobbuku@gmail.com',
  true
)
ON CONFLICT (wallet_address) DO UPDATE SET
  role = 'admin',
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  verified = true,
  updated_at = NOW();

INSERT INTO users (wallet_address, role, name, email, verified)
VALUES (
  '0x7Ba87fcBb898943B1F6983bE5181A9aCeB2aF0c8',
  'admin',
  'Cherry Pick Admin',
  'L1dobbuku@gmail.com',
  true
)
ON CONFLICT (wallet_address) DO UPDATE SET
  role = 'admin',
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  verified = true,
  updated_at = NOW();

SELECT wallet_address, role, name, email FROM users WHERE role = 'admin' ORDER BY wallet_address;
