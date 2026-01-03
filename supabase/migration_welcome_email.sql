-- Migration: Add welcome_email_sent_at to profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_email_sent_at ON profiles(welcome_email_sent_at);

-- Add comment for documentation
COMMENT ON COLUMN profiles.welcome_email_sent_at IS 'Timestamp when welcome email was sent after email verification';

