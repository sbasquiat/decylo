-- Migration: Add Success Outcome and Risky Assumption fields to Step 2
-- Run this in your Supabase SQL editor

-- Add success_outcome field (required, 1 sentence)
ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS success_outcome TEXT;

-- Add risky_assumption field (optional, anti-bias check)
ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS risky_assumption TEXT;

-- Add comment for clarity
COMMENT ON COLUMN decisions.success_outcome IS 'What success looks like for this decision (1 sentence)';
COMMENT ON COLUMN decisions.risky_assumption IS 'Assumption that might be wrong (anti-bias check)';

-- Note: We don't add NOT NULL constraint to success_outcome yet to allow existing rows
-- New decisions will be required to fill this via application validation


