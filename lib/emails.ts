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
  emailType: 'welcome' | 'outcome_reminder' | 'weekly_review' | 'inactivity_nudge' | 'first_insight' | 'upgrade_receipt',
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
 * Sent on signup
 */
export function generateWelcomeEmail(userName?: string): EmailData {
  const name = userName || 'there'
  const appUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app`

  const styles = getEmailStyles()

  return {
    to: '', // Will be set by caller
    subject: 'Welcome to Decylo',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <p style="${styles.text}">Hi ${name},</p>
            
            <p style="${styles.text}">You're in.</p>
            
            <p style="${styles.text}">Decylo exists to train your judgment — not your productivity.</p>
            
            <p style="${styles.text}">Start with one real decision.<br>
            Write your thinking clearly.<br>
            Commit.<br>
            Then observe what happens.</p>
            
            <p style="${styles.text}">That's the loop.</p>
            
            <p style="${styles.text}">Your future self will thank you.</p>
            
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

/**
 * 2. Outcome Reminder Email
 * Triggered when decision has due_date or temporal_anchor window reached
 */
export function generateOutcomeReminderEmail(
  userName?: string,
  decisionId?: string
): EmailData {
  const name = userName || 'there'
  const reviewUrl = decisionId 
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app/decision/${decisionId}?logOutcome=true`
    : `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app`

  const styles = getEmailStyles()

  return {
    to: '', // Will be set by caller
    subject: 'Time to close the loop',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <p style="${styles.text}">${name},</p>
            
            <p style="${styles.text}">You made a decision.<br>
            Something happened.</p>
            
            <p style="${styles.text}">Decylo only works when you log the outcome.</p>
            
            <p style="${styles.text}">Take 60 seconds and close the loop.</p>
            
            <div style="margin: 48px 0;">
              <a href="${reviewUrl}" style="${styles.cta}">Log Outcome</a>
            </div>
            
            <p style="${styles.signature}">— Decylo</p>
          </div>
        </body>
      </html>
    `,
  }
}

/**
 * 3. Inactivity Nudge Email
 * Triggered after 48h of no activity
 */
export function generateInactivityNudgeEmail(userName?: string): EmailData {
  const name = userName || 'there'
  const appUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app`

  const styles = getEmailStyles()

  return {
    to: '', // Will be set by caller
    subject: 'Still thinking about it?',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <p style="${styles.text}">${name},</p>
            
            <p style="${styles.text}">The decisions you avoid reviewing are the ones that shape you most.</p>
            
            <p style="${styles.text}">Open Decylo.<br>
            Log one outcome.<br>
            Strengthen your judgment.</p>
            
            <div style="margin: 48px 0;">
              <a href="${appUrl}" style="${styles.cta}">Return to Decylo</a>
            </div>
            
            <p style="${styles.signature}">— Decylo</p>
          </div>
        </body>
      </html>
    `,
  }
}

/**
 * 4. First Insight Unlocked Email
 * Triggered when first Judgment Profile is generated
 */
export function generateFirstInsightEmail(userName?: string): EmailData {
  const name = userName || 'there'
  const insightsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app/insights`

  const styles = getEmailStyles()

  return {
    to: '', // Will be set by caller
    subject: 'Your judgment is taking shape',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <p style="${styles.text}">${name},</p>
            
            <p style="${styles.text}">You just unlocked your first Judgment Profile.</p>
            
            <p style="${styles.text}">This isn't a score.<br>
            It's a mirror.</p>
            
            <p style="${styles.text}">Review it carefully.</p>
            
            <div style="margin: 48px 0;">
              <a href="${insightsUrl}" style="${styles.cta}">View Insights</a>
            </div>
            
            <p style="${styles.signature}">— Decylo</p>
          </div>
        </body>
      </html>
    `,
  }
}

/**
 * 5. Weekly Review Email
 * Weekly summary email
 */
export function generateWeeklyReviewEmail(
  userName?: string,
  weekStats?: {
    decisionsMade: number
    trajectory?: 'up' | 'down' | 'stable'
  }
): EmailData {
  const name = userName || 'there'
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app/review`

  const styles = getEmailStyles()
  
  const trajectoryText = weekStats?.trajectory === 'up' 
    ? 'up' 
    : weekStats?.trajectory === 'down' 
    ? 'down' 
    : 'stable'
  
  const countText = weekStats?.decisionsMade 
    ? `This week you made ${weekStats.decisionsMade} decision${weekStats.decisionsMade !== 1 ? 's' : ''}.`
    : 'This week you made decisions.'

  return {
    to: '', // Will be set by caller
    subject: 'Your week in decisions',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <p style="${styles.text}">${name},</p>
            
            <p style="${styles.text}">${countText}</p>
            
            <p style="${styles.text}">Your judgment is trending ${trajectoryText}.</p>
            
            <p style="${styles.text}">One small correction this week will compound over years.</p>
            
            <div style="margin: 48px 0;">
              <a href="${reviewUrl}" style="${styles.cta}">Start Weekly Review</a>
            </div>
            
            <p style="${styles.signature}">— Decylo</p>
          </div>
        </body>
      </html>
    `,
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

