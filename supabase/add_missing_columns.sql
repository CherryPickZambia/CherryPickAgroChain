-- ============================================
-- Fix missing columns that cause schema cache errors
-- Run this in Supabase SQL Editor
-- ============================================

-- Add gender and nrc_id to farmers table
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS nrc_id TEXT;

-- Add missing columns to milestones table
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS is_key BOOLEAN DEFAULT false;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS requires_professional_verifier BOOLEAN DEFAULT false;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 0;
