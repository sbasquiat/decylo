-- Migration: Create decision_health_snapshots table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS decision_health_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  win_rate DECIMAL(5, 2) NOT NULL CHECK (win_rate >= 0 AND win_rate <= 100),
  avg_calibration_gap DECIMAL(5, 2) NOT NULL CHECK (avg_calibration_gap >= 0),
  completion_rate DECIMAL(5, 2) NOT NULL CHECK (completion_rate >= 0 AND completion_rate <= 100),
  streak_length INTEGER NOT NULL CHECK (streak_length >= 0),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_decision_health_snapshots_user_id ON decision_health_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_health_snapshots_snapshot_date ON decision_health_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_decision_health_snapshots_user_date ON decision_health_snapshots(user_id, snapshot_date DESC);

-- Enable RLS
ALTER TABLE decision_health_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health snapshots" ON decision_health_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health snapshots" ON decision_health_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health snapshots" ON decision_health_snapshots
  FOR UPDATE USING (auth.uid() = user_id);


