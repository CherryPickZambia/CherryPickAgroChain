-- Adds a configurable quantity unit to contracts so the UI stops hard-coding "kg".
-- Safe to run multiple times.
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT 'kg';
