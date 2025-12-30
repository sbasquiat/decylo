-- Migration: Add retention nudge tracking fields to profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_morning_nudge_date DATE,
  ADD COLUMN IF NOT EXISTS last_outcome_nudge_date DATE,
  ADD COLUMN IF NOT EXISTS last_weekly_reflection_week TEXT; -- Format: YYYY-WW (e.g., "2024-01")

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nudge_dates ON profiles(last_morning_nudge_date, last_outcome_nudge_date);


