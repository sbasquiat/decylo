-- Migration: Email System Support
-- Adds email preferences to profiles and email_logs table for idempotency
-- Run this in your Supabase SQL editor

-- Add email_preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"welcome": true, "reminders": true, "weekly_review": true}'::jsonb;

-- Ensure timezone exists (might already be there)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Create email_logs table for idempotency
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'welcome', 'outcome_reminder', 'outcome_due_today', 'outcome_overdue', 'weekly_review', 'inactivity_nudge', 'streak_save', 'first_outcome', 'first_insight', 'pro_moment', 'upgrade_receipt'
  target_id UUID, -- decision_id for outcome_reminder, null for others
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_target_id ON email_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_type_target ON email_logs(user_id, email_type, target_id);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert (for cron jobs)
CREATE POLICY "Service role can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE email_logs IS 'Tracks sent emails to prevent duplicates and spam';
COMMENT ON COLUMN profiles.email_preferences IS 'JSON object with welcome, reminders, weekly_review booleans';

