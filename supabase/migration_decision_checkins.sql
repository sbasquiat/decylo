-- Migration: Create decision_checkins table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS decision_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('better', 'same', 'worse')),
  confidence_now INTEGER NOT NULL CHECK (confidence_now >= 0 AND confidence_now <= 100),
  micro_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_decision_checkins_decision_id ON decision_checkins(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_checkins_user_id ON decision_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_checkins_date ON decision_checkins(date);

-- Enable RLS
ALTER TABLE decision_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own decision checkins" ON decision_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decision checkins" ON decision_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decision checkins" ON decision_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decision checkins" ON decision_checkins
  FOR DELETE USING (auth.uid() = user_id);


