-- Migration: Add self-reflection field to outcomes table
-- This captures "What did this decision teach you about yourself?"

ALTER TABLE outcomes
  ADD COLUMN IF NOT EXISTS self_reflection_text TEXT;

-- Add comment for clarity
COMMENT ON COLUMN outcomes.self_reflection_text IS 'What this decision taught the user about themselves - captured after outcome completion';


