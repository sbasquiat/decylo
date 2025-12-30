-- Migration: Add commit page enhancements to decisions table
-- Adds: decision_rationale, predicted_outcome_positive, predicted_outcome_negative, commitment_confirmed

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS decision_rationale TEXT;

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS predicted_outcome_positive TEXT;

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS predicted_outcome_negative TEXT;

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS commitment_confirmed BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN decisions.decision_rationale IS 'User''s core reason for choosing this option (required, 1-2 sentences)';
COMMENT ON COLUMN decisions.predicted_outcome_positive IS 'What will change in user''s life if this goes well';
COMMENT ON COLUMN decisions.predicted_outcome_negative IS 'Worst realistic outcome if this goes badly';
COMMENT ON COLUMN decisions.commitment_confirmed IS 'User confirmed they understand they''re committing to review the outcome';

-- Add index for decision_rationale (for future search/analysis)
CREATE INDEX IF NOT EXISTS idx_decisions_rationale ON decisions(decision_rationale) WHERE decision_rationale IS NOT NULL;

