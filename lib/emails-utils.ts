/**
 * Email utility functions for checking preferences and idempotency
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export interface EmailPreferences {
  welcome?: boolean
  reminders?: boolean
  weekly_review?: boolean
}

const DEFAULT_PREFERENCES: EmailPreferences = {
  welcome: true,
  reminders: true,
  weekly_review: true,
}

/**
 * Get user's email preferences, with defaults
 */
export async function getUserEmailPreferences(userId: string): Promise<EmailPreferences> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('email_preferences')
    .eq('id', userId)
    .single()

  if (!profile?.email_preferences) {
    return DEFAULT_PREFERENCES
  }

  return {
    ...DEFAULT_PREFERENCES,
    ...(profile.email_preferences as EmailPreferences),
  }
}

/**
 * Check if email was already sent recently (idempotency check)
 * Returns true if email should NOT be sent (already sent within X days)
 */
export async function shouldSkipEmail(
  userId: string,
  emailType: 'welcome' | 'outcome_reminder' | 'weekly_review' | 'inactivity_nudge' | 'first_insight' | 'upgrade_receipt',
  targetId: string | null = null,
  daysWindow: number = 7
): Promise<boolean> {
  const supabase = await createClient()
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysWindow)

  // Build query
  let query = supabase
    .from('email_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('email_type', emailType)
    .gte('sent_at', cutoffDate.toISOString())

  // For outcome_reminder, also check target_id to allow one per decision
  if (targetId) {
    query = query.eq('target_id', targetId)
  } else {
    // For other types, check if any was sent (no target_id)
    query = query.is('target_id', null)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    console.error('Error checking email logs:', error)
    // On error, allow sending (fail open)
    return false
  }

  return (data?.length || 0) > 0
}

/**
 * Log that an email was sent
 * Uses service role if serviceRoleKey is provided (for cron jobs)
 */
export async function logEmailSent(
  userId: string,
  emailType: 'welcome' | 'outcome_reminder' | 'weekly_review' | 'inactivity_nudge' | 'first_insight' | 'upgrade_receipt',
  targetId: string | null = null,
  serviceRoleKey?: string
): Promise<void> {
  const supabase = serviceRoleKey
    ? createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : await createClient()
  
  const { error } = await supabase
    .from('email_logs')
    .insert({
      user_id: userId,
      email_type: emailType,
      target_id: targetId,
    })

  if (error) {
    console.error('Error logging email:', error)
    // Don't throw - logging failure shouldn't break email sending
  }
}

/**
 * Check if user has preference enabled for email type
 */
export function getPreferenceForEmailType(
  preferences: EmailPreferences,
  emailType: 'welcome' | 'outcome_reminder' | 'weekly_review' | 'inactivity_nudge' | 'first_insight' | 'upgrade_receipt'
): boolean {
  switch (emailType) {
    case 'welcome':
      return preferences.welcome !== false
    case 'outcome_reminder':
    case 'inactivity_nudge':
      return preferences.reminders !== false
    case 'weekly_review':
      return preferences.weekly_review !== false
    case 'first_insight':
    case 'upgrade_receipt':
      // These are always enabled (system emails)
      return true
    default:
      return true
  }
}

