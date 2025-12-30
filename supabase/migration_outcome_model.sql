-- Migration: Update outcomes table to Decylo Outcome Model
-- Run this in your Supabase SQL editor

-- Add new columns
ALTER TABLE outcomes
  ADD COLUMN IF NOT EXISTS outcome_score_int INTEGER CHECK (outcome_score_int IN (1, 0, -1)),
  ADD COLUMN IF NOT EXISTS outcome_reflection_text TEXT,
  ADD COLUMN IF NOT EXISTS learning_reflection_text TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Migrate existing data (if any)
-- Map outcome_status to outcome_score_int
UPDATE outcomes
SET 
  outcome_score_int = CASE 
    WHEN outcome_status = 'won' THEN 1
    WHEN outcome_status = 'neutral' THEN 0
    WHEN outcome_status = 'lost' THEN -1
    ELSE 0
  END,
  outcome_reflection_text = what_happened,
  learning_reflection_text = lesson,
  completed_at = created_at
WHERE outcome_score_int IS NULL;

-- Make outcome_score_int required (after migration)
ALTER TABLE outcomes
  ALTER COLUMN outcome_score_int SET NOT NULL,
  ALTER COLUMN outcome_reflection_text SET NOT NULL,
  ALTER COLUMN learning_reflection_text SET NOT NULL;

-- Drop old columns (optional - can keep for backward compatibility during transition)
-- ALTER TABLE outcomes DROP COLUMN outcome_status;
-- ALTER TABLE outcomes DROP COLUMN what_happened;
-- ALTER TABLE outcomes DROP COLUMN lesson;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_outcomes_score ON outcomes(outcome_score_int);
CREATE INDEX IF NOT EXISTS idx_outcomes_completed_at ON outcomes(completed_at);


