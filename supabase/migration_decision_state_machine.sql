-- Migration: Add decision state machine fields
-- Run this in your Supabase SQL editor

-- Add decided_at timestamp
ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

-- Add outcome_id reference (computed from outcomes table)
-- Note: We'll compute this in application logic, but add a helper column for performance
ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS outcome_id UUID REFERENCES outcomes(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_decisions_decided_at ON decisions(decided_at);
CREATE INDEX IF NOT EXISTS idx_decisions_outcome_id ON decisions(outcome_id);

-- Update existing decisions to set decided_at if they have chosen_option_id
UPDATE decisions
SET decided_at = updated_at
WHERE chosen_option_id IS NOT NULL
  AND decided_at IS NULL
  AND status = 'decided';

-- Update existing decisions to set outcome_id if they have outcomes
UPDATE decisions
SET outcome_id = (
  SELECT id FROM outcomes
  WHERE outcomes.decision_id = decisions.id
  LIMIT 1
)
WHERE outcome_id IS NULL
  AND EXISTS (
    SELECT 1 FROM outcomes
    WHERE outcomes.decision_id = decisions.id
  );

-- Add check constraint to prevent invalid status transitions
-- Note: Status is now computed, but we keep the column for backward compatibility
-- The application logic will enforce the state machine

-- Add comment for clarity
COMMENT ON COLUMN decisions.decided_at IS 'Timestamp when decision was committed (chosen_option_id set)';
COMMENT ON COLUMN decisions.outcome_id IS 'Reference to the outcome record (computed from outcomes table)';


