-- Migration: Add feedback system
-- Run this in your Supabase SQL editor

-- Add feedback_submitted flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS feedback_submitted BOOLEAN DEFAULT FALSE;

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('very_helpful', 'somewhat_helpful', 'not_helpful')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: Users cannot update or delete their feedback (immutable)


