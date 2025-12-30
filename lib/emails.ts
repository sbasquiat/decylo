/**
 * Email system for Decylo
 * Uses Resend API for transactional emails
 * 
 * Required environment variables:
 * - RESEND_API_KEY
 * 
 * Email types:
 * 1. Decision Reminder - "You committed to this decision. What happened?"
 * 2. Weekly Review Ready - "Your thinking report is ready."
 * 3. Judgment Shift Milestone - Triggered when DHI crosses thresholds (50 → 65 → 80)
 * 4. Streak Protection - "One outcome away from breaking your streak."
 */

export interface EmailData {
  to: string
  subject: string
  html: string
}

/**
 * Send email using Resend API
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured. Email not sent.')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Decylo <noreply@decylo.com>', // Update with your domain
        to: data.to,
        subject: data.subject,
        html: data.html,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Resend API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Decision Reminder Email
 * Triggered when a decision's next_action_due_date arrives
 */
export function generateDecisionReminderEmail(
  decisionTitle: string,
  decisionId: string,
  userName?: string
): EmailData {
  const greeting = userName ? `Hi ${userName},` : 'Hi,'
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app/decision/${decisionId}?logOutcome=true`

  return {
    to: '', // Will be set by caller
    subject: `What happened with "${decisionTitle}"?`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
            <h1 style="color: #4F7CFF; margin: 0 0 16px 0; font-size: 24px;">Decylo</h1>
            <h2 style="margin: 0 0 16px 0; font-size: 20px;">You committed to this decision. What happened?</h2>
          </div>
          
          <p>${greeting}</p>
          
          <p>You committed to: <strong>${decisionTitle}</strong></p>
          
          <p>It's time to close the loop. Log what actually happened so you can learn from it.</p>
          
          <div style="margin: 32px 0;">
            <a href="${reviewUrl}" style="background: #4F7CFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Log Outcome
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This is how your judgment improves. Every outcome you log makes your next decision better.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
          
          <p style="color: #999; font-size: 12px;">
            You're receiving this because you set a due date for this decision. 
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app/settings" style="color: #4F7CFF;">Manage preferences</a>
          </p>
        </body>
      </html>
    `,
  }
}

/**
 * Weekly Review Ready Email
 * Triggered on Sunday/Monday when weekly review is ready
 */
export function generateWeeklyReviewEmail(
  userName?: string,
  weekStats?: {
    decisionsMade: number
    outcomesLogged: number
    winRate: number
    healthChange: number
  }
): EmailData {
  const greeting = userName ? `Hi ${userName},` : 'Hi,'
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app/review`

  const statsHtml = weekStats
    ? `
      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">This week:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>${weekStats.decisionsMade} decisions made</li>
          <li>${weekStats.outcomesLogged} outcomes logged</li>
          <li>${Math.round(weekStats.winRate)}% win rate</li>
          <li>Decision Health: ${weekStats.healthChange > 0 ? '+' : ''}${Math.round(weekStats.healthChange)}</li>
        </ul>
      </div>
    `
    : ''

  return {
    to: '',
    subject: 'Your Weekly Review is Ready',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
            <h1 style="color: #4F7CFF; margin: 0 0 16px 0; font-size: 24px;">Decylo</h1>
            <h2 style="margin: 0 0 16px 0; font-size: 20px;">Your thinking report is ready.</h2>
          </div>
          
          <p>${greeting}</p>
          
          <p>Your weekly review is ready. See your cognitive patterns, biggest miscalibrations, and one thinking upgrade for next week.</p>
          
          ${statsHtml}
          
          <div style="margin: 32px 0;">
            <a href="${reviewUrl}" style="background: #4F7CFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              View Weekly Review
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This is where experience becomes skill.
          </p>
        </body>
      </html>
    `,
  }
}

/**
 * Judgment Shift Milestone Email
 * Triggered when DHI crosses thresholds (50 → 65 → 80)
 */
export function generateJudgmentShiftEmail(
  newDHI: number,
  previousDHI: number,
  userName?: string
): EmailData {
  const greeting = userName ? `Hi ${userName},` : 'Hi,'
  const insightsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app/insights`

  let milestone = ''
  if (newDHI >= 80 && previousDHI < 80) {
    milestone = 'You\'ve reached elite judgment territory (80+ Decision Health).'
  } else if (newDHI >= 65 && previousDHI < 65) {
    milestone = 'You\'ve crossed into strong judgment territory (65+ Decision Health).'
  } else if (newDHI >= 50 && previousDHI < 50) {
    milestone = 'You\'ve crossed the threshold into solid judgment (50+ Decision Health).'
  }

  return {
    to: '',
    subject: `Your Decision Health reached ${Math.round(newDHI)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
            <h1 style="color: #4F7CFF; margin: 0 0 16px 0; font-size: 24px;">Decylo</h1>
            <h2 style="margin: 0 0 16px 0; font-size: 20px;">Judgment Milestone Reached</h2>
          </div>
          
          <p>${greeting}</p>
          
          <p><strong>${milestone}</strong></p>
          
          <p>Your Decision Health is now <strong>${Math.round(newDHI)}</strong> (up from ${Math.round(previousDHI)}).</p>
          
          <p>Decision Health measures how accurately you model the future and how consistently you execute on your own judgment.</p>
          
          <div style="margin: 32px 0;">
            <a href="${insightsUrl}" style="background: #4F7CFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              View Your Insights
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Keep closing the loop. Every outcome you log compounds your judgment.
          </p>
        </body>
      </html>
    `,
  }
}

/**
 * Streak Protection Email
 * Triggered when user is one outcome away from breaking their streak
 */
export function generateStreakProtectionEmail(
  currentStreak: number,
  userName?: string
): EmailData {
  const greeting = userName ? `Hi ${userName},` : 'Hi,'
  const todayUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://decylo.com'}/app`

  return {
    to: '',
    subject: `Don't break your ${currentStreak}-day streak`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
            <h1 style="color: #4F7CFF; margin: 0 0 16px 0; font-size: 24px;">Decylo</h1>
            <h2 style="margin: 0 0 16px 0; font-size: 20px;">One outcome away from breaking your streak</h2>
          </div>
          
          <p>${greeting}</p>
          
          <p>You have a <strong>${currentStreak}-day streak</strong> of closing the decision loop.</p>
          
          <p>You have decisions waiting for outcomes. Log one today to keep your streak alive.</p>
          
          <div style="margin: 32px 0;">
            <a href="${todayUrl}" style="background: #4F7CFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Log Outcome Now
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Streaks create momentum. Momentum creates better judgment.
          </p>
        </body>
      </html>
    `,
  }
}

