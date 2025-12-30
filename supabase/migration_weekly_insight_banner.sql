-- Migration: Add weekly insight banner tracking
-- Run this in your Supabase SQL editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_weekly_insight_banner_week TEXT;

-- Add comment for clarity
COMMENT ON COLUMN profiles.last_weekly_insight_banner_week IS 'ISO week string (yyyy-ww) when weekly insight banner was last shown';


