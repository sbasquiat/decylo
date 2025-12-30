-- Migration: Add onboarding tracking fields to profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_welcome_shown BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_first_decision_shown BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_first_outcome_shown BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups (optional, but helpful)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_welcome_shown, onboarding_first_decision_shown, onboarding_first_outcome_shown);


