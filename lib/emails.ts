/**
 * Email system for Decylo
 * Uses Resend API for transactional emails
 * 
 * Required environment variables:
 * - RESEND_API_KEY: Your Resend API key
 * - RESEND_FROM_EMAIL: Email address to send from (e.g., "Decylo <noreply@yourdomain.com>")
 * 
 * Optional environment variables:
 * - NEXT_PUBLIC_APP_URL: Base URL for your app (defaults to https://decylo.com)
 * 
 * Email types:
 * 1. Welcome Email - Sent on signup
 * 2. Outcome Reminder - When decision due_date or temporal_anchor window reached
 * 3. Inactivity Nudge - 48h no activity
 * 4. First Insight Unlocked - When first Judgment Profile generated
 * 5. Weekly Review - Weekly summary email
 * 6. Upgrade Receipt - When user upgrades to Pro
 * 
 * Design principles:
 * - Dark background
 * - Large spacing
 * - Soft borders
 * - Space Grotesk font (same as app)
 * - One CTA max
 * - No marketing graphics
 * - No emojis
 * - No bright colors
 * - Personal letter aesthetic
 */

import { Resend } from 'resend'

export interface EmailData {
  to: string
  subject: string
  html: string
}

// Initialize Resend client
let resend: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }

  return resend
}

/**
 * Get the from email address from environment variable
 * Falls back to a default if not configured
 */
function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'Decylo <noreply@decylo.com>'
}

/**
 * Send email using Resend API
 * This is the low-level function - use sendProductEmail for product emails
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  const client = getResendClient()
  
  if (!client) {
    console.warn('RESEND_API_KEY not configured. Email not sent.')
    return false
  }

  if (!data.to || !data.to.trim()) {
    console.error('Email recipient not provided')
    return false
  }

  try {
    const result = await client.emails.send({
      from: getFromEmail(),
      to: data.to,
      subject: data.subject,
      html: data.html,
    })

    if (result.error) {
      console.error('Resend API error:', result.error)
      return false
    }

    console.log('Email sent successfully:', result.data?.id)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Send product email with preference and idempotency checks
 * Use this for all product emails (not auth emails)
 */
export async function sendProductEmail(
  userId: string,
  userEmail: string,
  emailType: 'welcome' | 'outcome_reminder' | 'outcome_due_today' | 'outcome_overdue' | 'weekly_review' | 'inactivity_nudge' | 'streak_save' | 'first_outcome' | 'first_insight' | 'pro_moment' | 'upgrade_receipt',
  emailData: EmailData,
  targetId: string | null = null,
  daysWindow: number = 7,
  supabaseClient?: any // Optional Supabase client for contexts without user session
): Promise<boolean> {
  // Import here to avoid circular dependencies
  const { getUserEmailPreferences, shouldSkipEmail, logEmailSent, getPreferenceForEmailType } = await import('@/lib/emails-utils')

  try {
    // Check preferences
    const preferences = await getUserEmailPreferences(userId, supabaseClient)
    if (!getPreferenceForEmailType(preferences, emailType)) {
      console.log(`Email ${emailType} skipped - user preference disabled for user ${userId}`)
      return false
    }

    // Check idempotency
    if (await shouldSkipEmail(userId, emailType, targetId, daysWindow, supabaseClient)) {
      console.log(`Email ${emailType} skipped - already sent recently for user ${userId}, target ${targetId || 'none'}`)
      return false
    }

    // Send email
    const emailToSend = {
      ...emailData,
      to: userEmail,
    }

    const sent = await sendEmail(emailToSend)

    if (sent) {
      // Log that email was sent
      await logEmailSent(userId, emailType, targetId, supabaseClient ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined)
      console.log(`Email ${emailType} sent successfully to ${userEmail}`)
    } else {
      console.log(`Email ${emailType} not sent to ${userEmail}`)
    }

    return sent
  } catch (error) {
    console.error(`Error in sendProductEmail for ${emailType}:`, error)
    // Don't throw - allow caller to handle
    return false
  }
}

/**
 * Base email styles - dark, minimal, personal letter aesthetic
 */
const getEmailStyles = () => ({
  container: 'max-width: 600px; margin: 0 auto; padding: 48px 24px;',
  body: 'font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.8; color: #E8ECF3; background-color: #0B0F14;',
  text: 'color: #E8ECF3; font-size: 16px; margin: 0 0 24px 0;',
  textMuted: 'color: #9AA3B2; font-size: 14px; margin: 0 0 24px 0;',
  signature: 'color: #9AA3B2; font-size: 14px; margin-top: 48px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;',
  cta: 'display: inline-block; padding: 16px 32px; background-color: rgba(255,255,255,0.08); color: #E8ECF3; text-decoration: none; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); font-weight: 500; margin: 32px 0;',
})

/**
 * 1. Welcome Email
 * Sent after first verified login
 */
export function generateWelcomeEmail(userName?: string): EmailData {
  const { generateWelcomeEmailHTML } = require('./email-templates')
  
  return {
    to: '', // Will be set by caller
    subject: 'Welcome to Decylo — your first loop starts now',
    html: generateWelcomeEmailHTML({
      display_name: userName,
    }),
  }
}

/**
 * 2a. Outcome Due Today Email (daily digest)
 * Triggered when decisions have outcomes due today
 */
export function generateOutcomeDueTodayEmail(
  decisions: Array<{ title: string; chosen_option?: string; confidence?: number; id: string }>,
  userName?: string
): EmailData {
  const { generateOutcomeDueTodayEmailHTML } = require('./email-templates')
  const { getEmailAppUrl } = require('./email-urls')
  const appUrl = getEmailAppUrl()
  
  return {
    to: '', // Will be set by caller
    subject: 'Outcome due today: close the loop',
    html: generateOutcomeDueTodayEmailHTML({
      display_name: userName,
      count_due: decisions.length,
      decisions: decisions.map(d => ({
        title: d.title,
        chosen_option: d.chosen_option || 'N/A',
        confidence: d.confidence || 'N/A',
        id: d.id,
      })),
      cta_url: `${appUrl}/app`,
    }),
  }
}

/**
 * 2b. Outcome Overdue Email (stronger nudge)
 * Triggered when decision outcome is overdue
 */
export function generateOutcomeOverdueEmail(
  decisionTitle: string,
  decisionId: string,
  userName?: string
): EmailData {
  const { generateOutcomeOverdueEmailHTML } = require('./email-templates')
  const { getEmailAppUrl } = require('./email-urls')
  const appUrl = getEmailAppUrl()
  
  return {
    to: '', // Will be set by caller
    subject: "You're leaving learning on the table",
    html: generateOutcomeOverdueEmailHTML({
      display_name: userName,
      title: decisionTitle,
      decision_id: decisionId,
      cta_url: `${appUrl}/app/decision/${decisionId}?logOutcome=true`,
    }),
  }
}

/**
 * 2. Outcome Reminder Email (legacy - for backward compatibility)
 * Use generateOutcomeDueTodayEmail or generateOutcomeOverdueEmail instead
 */
export function generateOutcomeReminderEmail(
  userName?: string,
  decisionId?: string
): EmailData {
  // Use overdue email for single decision reminders
  if (decisionId) {
    return generateOutcomeOverdueEmail('This decision', decisionId, userName)
  }
  // Use daily digest for general reminders
  return generateOutcomeDueTodayEmail([], userName)
}

/**
 * 5. Streak Save Email
 * Triggered when streak is at risk and user is active recently
 */
export function generateStreakSaveEmail(userName?: string): EmailData {
  const { generateStreakSaveEmailHTML } = require('./email-templates')
  const { getEmailAppUrl } = require('./email-urls')
  const appUrl = getEmailAppUrl()
  
  return {
    to: '', // Will be set by caller
    subject: "Don't break the streak — log one outcome",
    html: generateStreakSaveEmailHTML({
      display_name: userName,
      cta_url: `${appUrl}/app`,
    }),
  }
}

/**
 * Legacy: Inactivity Nudge Email (for backward compatibility)
 * Use generateStreakSaveEmail instead
 */
export function generateInactivityNudgeEmail(userName?: string): EmailData {
  return generateStreakSaveEmail(userName)
}

/**
 * 6a. First Outcome Celebration Email
 * Triggered when user logs their first outcome
 */
export function generateFirstOutcomeEmail(userName?: string): EmailData {
  const { generateFirstOutcomeEmailHTML } = require('./email-templates')
  const { getEmailAppUrl } = require('./email-urls')
  const appUrl = getEmailAppUrl()
  
  return {
    to: '', // Will be set by caller
    subject: "That's your first loop closed",
    html: generateFirstOutcomeEmailHTML({
      display_name: userName,
      cta_url: `${appUrl}/app`,
    }),
  }
}

/**
 * 7. Pro Moment Email
 * Triggered after 3rd outcome logged (paywall trigger)
 */
export function generateProMomentEmail(userName?: string): EmailData {
  const { generateProMomentEmailHTML } = require('./email-templates')
  const { getEmailAppUrl } = require('./email-urls')
  const appUrl = getEmailAppUrl()
  
  return {
    to: '', // Will be set by caller
    subject: 'Your Decision Health is forming — unlock the full model',
    html: generateProMomentEmailHTML({
      display_name: userName,
      cta_url: `${appUrl}/app/settings`,
    }),
  }
}

/**
 * 4. First Insight Unlocked Email (legacy - for backward compatibility)
 * Use generateFirstOutcomeEmail or generateProMomentEmail instead
 */
export function generateFirstInsightEmail(userName?: string): EmailData {
  return generateFirstOutcomeEmail(userName)
}

/**
 * 4. Weekly Review Email
 * Triggered weekly (Sunday evening / Monday morning)
 */
export function generateWeeklyReviewEmail(
  userName?: string,
  weekStats?: {
    decisionsMade: number
    trajectory?: 'up' | 'down' | 'stable'
    dhi?: number
    cal_gap?: number
    lcr?: number
    challenge_text?: string
  }
): EmailData {
  const { generateWeeklyReviewEmailHTML } = require('./email-templates')
  const { getEmailAppUrl } = require('./email-urls')
  const appUrl = getEmailAppUrl()
  
  const trendWord = weekStats?.trajectory === 'up' 
    ? 'up' 
    : weekStats?.trajectory === 'down' 
    ? 'down' 
    : 'stable'
  
  const challengeText = weekStats?.challenge_text || 
    (weekStats?.trajectory === 'up' 
      ? 'Keep closing loops. Your calibration is improving.'
      : weekStats?.trajectory === 'down'
      ? 'Focus on accuracy over speed. Close the loops you start.'
      : 'Keep closing loops. That\'s the only metric that matters.')
  
  return {
    to: '', // Will be set by caller
    subject: `Weekly Review: your judgment is trending ${trendWord}`,
    html: generateWeeklyReviewEmailHTML({
      display_name: userName,
      trend_word: trendWord,
      dhi: weekStats?.dhi,
      cal_gap: weekStats?.cal_gap,
      lcr: weekStats?.lcr,
      challenge_text: challengeText,
      cta_url: `${appUrl}/app`,
    }),
  }
}

/**
 * 6. Upgrade Receipt Email
 * Sent when user upgrades to Pro
 */
export function generateUpgradeReceiptEmail(userName?: string): EmailData {
  const name = userName || 'there'
  const appUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app`

  const styles = getEmailStyles()

  return {
    to: '', // Will be set by caller
    subject: "You're now Pro",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <p style="${styles.text}">${name},</p>
            
            <p style="${styles.text}">You now have full access to Decylo's judgment engine.</p>
            
            <p style="${styles.text}">Use it carefully.</p>
            
            <p style="${styles.text}">It will change how you think.</p>
            
            <div style="margin: 48px 0;">
              <a href="${appUrl}" style="${styles.cta}">Open Decylo</a>
            </div>
            
            <p style="${styles.signature}">— Decylo</p>
          </div>
        </body>
      </html>
    `,
  }
}

// Legacy email functions - kept for backward compatibility
// These will be deprecated in favor of the new templates above

/**
 * @deprecated Use generateOutcomeReminderEmail instead
 */
export function generateDecisionReminderEmail(
  decisionTitle: string,
  decisionId: string,
  userName?: string
): EmailData {
  return generateOutcomeReminderEmail(userName, decisionId)
}

/**
 * @deprecated Use generateFirstInsightEmail instead
 */
export function generateJudgmentShiftEmail(
  newDHI: number,
  previousDHI: number,
  userName?: string
): EmailData {
  return generateFirstInsightEmail(userName)
}

/**
 * @deprecated Use generateInactivityNudgeEmail instead
 */
export function generateStreakProtectionEmail(
  currentStreak: number,
  userName?: string
): EmailData {
  return generateInactivityNudgeEmail(userName)
}

