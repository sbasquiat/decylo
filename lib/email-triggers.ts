/**
 * Email trigger utilities
 * Handles sending stickiness emails after specific events
 */

import { createClient } from '@supabase/supabase-js'
import { sendProductEmail, generateFirstOutcomeEmail, generateProMomentEmail } from './emails'
import { getUserEmailPreferences } from './emails-utils'

/**
 * Send first outcome celebration email
 * Triggered when user logs their first outcome
 */
export async function triggerFirstOutcomeEmail(userId: string, userEmail: string): Promise<void> {
  try {
    // Check if already sent
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', 'first_outcome')
      .limit(1)

    if (existingLog && existingLog.length > 0) {
      return // Already sent
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()

    const emailData = generateFirstOutcomeEmail(profile?.display_name || undefined)
    await sendProductEmail(
      userId,
      userEmail,
      'first_outcome',
      emailData,
      null,
      30, // 30 day window
      supabase
    )
  } catch (error) {
    console.error('Error sending first outcome email:', error)
    // Don't throw - email failure shouldn't break outcome logging
  }
}

/**
 * Send pro moment email
 * Triggered when user logs their 3rd outcome (paywall trigger)
 */
export async function triggerProMomentEmail(userId: string, userEmail: string): Promise<void> {
  try {
    // Check if user is already pro
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', userId)
      .single()

    if (profile?.is_pro) {
      return // Already pro, don't send
    }

    // Check if already sent
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', 'pro_moment')
      .limit(1)

    if (existingLog && existingLog.length > 0) {
      return // Already sent
    }

    // Get user profile for display name
    const { data: profileWithName } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()

    const emailData = generateProMomentEmail(profileWithName?.display_name || undefined)
    await sendProductEmail(
      userId,
      userEmail,
      'pro_moment',
      emailData,
      null,
      30, // 30 day window
      supabase
    )
  } catch (error) {
    console.error('Error sending pro moment email:', error)
    // Don't throw - email failure shouldn't break outcome logging
  }
}

/**
 * Check if outcome count matches trigger thresholds
 * Returns email type to send, or null if none
 */
export async function checkOutcomeEmailTriggers(userId: string): Promise<'first_outcome' | 'pro_moment' | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get user's decisions
    const { data: decisions } = await supabase
      .from('decisions')
      .select('id')
      .eq('user_id', userId)

    if (!decisions || decisions.length === 0) {
      return null
    }

    const decisionIds = decisions.map(d => d.id)

    // Count outcomes
    const { count: outcomeCount } = await supabase
      .from('outcomes')
      .select('*', { count: 'exact', head: true })
      .in('decision_id', decisionIds)

    if (outcomeCount === 1) {
      // Check if first outcome email already sent
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('email_type', 'first_outcome')
        .limit(1)

      if (!existingLog || existingLog.length === 0) {
        return 'first_outcome'
      }
    } else if (outcomeCount === 3) {
      // Check if user is already pro
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', userId)
        .single()

      if (!profile?.is_pro) {
        // Check if pro moment email already sent
        const { data: existingLog } = await supabase
          .from('email_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('email_type', 'pro_moment')
          .limit(1)

        if (!existingLog || existingLog.length === 0) {
          return 'pro_moment'
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error checking outcome email triggers:', error)
    return null
  }
}

