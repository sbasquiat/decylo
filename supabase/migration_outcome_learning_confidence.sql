-- Migration: Add learning_confidence_int to outcomes table
-- Run this in your Supabase SQL editor

ALTER TABLE outcomes
  ADD COLUMN IF NOT EXISTS learning_confidence_int INTEGER CHECK (learning_confidence_int >= 0 AND learning_confidence_int <= 100);

-- Add comment for clarity
COMMENT ON COLUMN outcomes.learning_confidence_int IS 'User confidence in the learning (0-100%)';


