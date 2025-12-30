-- Migration: Add cognitive gap fields to outcomes table
-- Run this in your Supabase SQL editor

-- Add temporal_anchor field (when looking back after how much time)
ALTER TABLE outcomes
  ADD COLUMN IF NOT EXISTS temporal_anchor TEXT CHECK (temporal_anchor IN ('1_day', '1_week', '1_month', '3_months'));

-- Add counterfactual reflection (what would have happened with other option)
ALTER TABLE outcomes
  ADD COLUMN IF NOT EXISTS counterfactual_reflection_text TEXT;

-- Add index for temporal anchor queries
CREATE INDEX IF NOT EXISTS idx_outcomes_temporal_anchor ON outcomes(temporal_anchor);

-- Add comments for clarity
COMMENT ON COLUMN outcomes.temporal_anchor IS 'Time elapsed when outcome was logged: 1_day, 1_week, 1_month, 3_months';
COMMENT ON COLUMN outcomes.counterfactual_reflection_text IS 'What user thinks would have happened if they chose the other option';


