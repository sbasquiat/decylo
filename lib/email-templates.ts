/**
 * Decylo Email Templates
 * Dark, clean aesthetic with calm, direct tone
 */

import { getEmailAppUrl } from './email-urls'

export interface EmailTemplateData {
  display_name?: string
  cta_url?: string
  preferences_url?: string
  unsubscribe_url?: string
  year?: number
  [key: string]: any
}

/**
 * Base HTML wrapper for all Decylo emails
 */
function getBaseEmailHTML(content: string, data: EmailTemplateData): string {
  const appUrl = getEmailAppUrl()
  const year = data.year || new Date().getFullYear()
  const preferencesUrl = data.preferences_url || `${appUrl}/app/settings/email-preferences`
  const unsubscribeUrl = data.unsubscribe_url || `${appUrl}/app/settings/email-preferences`

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0;padding:0;background:#070B12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E7ECF6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070B12;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#0B1220;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.35);">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:18px;font-weight:700;letter-spacing:0.2px;">Decylo</div>
                <div style="font-size:13px;opacity:0.8;margin-top:4px;">Make better decisions. Every day.</div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px;">
                ${content}
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;opacity:0.75;line-height:1.6;">
                <div>If you didn't request this, you can ignore this email.</div>
                <div style="margin-top:8px;">
                  <a href="${preferencesUrl}" style="color:#8DB2FF;text-decoration:none;">Notification preferences</a>
                  <span style="opacity:0.6;"> · </span>
                  <a href="${unsubscribeUrl}" style="color:#8DB2FF;text-decoration:none;">Unsubscribe</a>
                </div>
                <div style="margin-top:10px;opacity:0.6;">© ${year} Decylo</div>
              </td>
            </tr>

          </table>

          ${data.cta_url ? `
          <div style="max-width:640px;margin-top:14px;font-size:12px;opacity:0.6;line-height:1.5;">
            Trouble with the button? Paste this link into your browser:<br/>
            <span style="word-break:break-all;color:#8DB2FF;">${data.cta_url}</span>
          </div>
          ` : ''}

        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * 1. Welcome Email (after first verified login)
 */
export function generateWelcomeEmailHTML(data: EmailTemplateData): string {
  const displayName = data.display_name || 'there'
  const appUrl = getEmailAppUrl()
  const ctaUrl = data.cta_url || `${appUrl}/app/new`

  const content = `
<h1 style="margin:0 0 10px;font-size:24px;line-height:1.25;">Welcome, ${displayName}.</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;opacity:0.9;">
  Decylo isn't a productivity app. It's a judgment training system.
  You don't "use it" — you run the loop.
</p>

<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 14px;margin:14px 0 18px;">
  <div style="font-weight:700;margin-bottom:6px;">The loop</div>
  <div style="font-size:14px;line-height:1.7;opacity:0.9;">
    Capture → Evaluate → Commit → Reflect<br/>
    <span style="opacity:0.75;">The only rule: always log the outcome.</span>
  </div>
</div>

<p style="margin:0 0 12px;font-size:15px;line-height:1.7;opacity:0.9;">
  Start with something real you're deciding today. Two options is enough.
</p>

<a href="${ctaUrl}" style="display:inline-block;background:#4C7DFF;color:#071024;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">
  Create your first decision
</a>

<p style="margin:18px 0 0;font-size:13px;line-height:1.7;opacity:0.75;">
  Quick tip: Be honest on the sliders. If you lie, you only fool the one person you can't escape — you.
</p>
`

  return getBaseEmailHTML(content, { ...data, cta_url: ctaUrl })
}

/**
 * 2. Outcome Due Today (daily digest)
 */
export function generateOutcomeDueTodayEmailHTML(data: EmailTemplateData): string {
  const countDue = data.count_due || 0
  const pluralDue = countDue === 1 ? '' : 's'
  const appUrl = getEmailAppUrl()
  const ctaUrl = data.cta_url || `${appUrl}/app`

  // Generate decision list
  const decisions = data.decisions || []
  let decisionListHTML = ''
  if (decisions.length > 0) {
    decisionListHTML = '<div style="margin:0 0 16px;">'
    decisions.forEach((decision: any) => {
      decisionListHTML += `
  <div style="padding:12px 12px;margin:10px 0;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
    <div style="font-weight:700;">${decision.title || 'Untitled Decision'}</div>
    <div style="font-size:13px;opacity:0.75;margin-top:4px;">Chosen: ${decision.chosen_option || 'N/A'} · Confidence: ${decision.confidence || 'N/A'}%</div>
  </div>`
    })
    decisionListHTML += '</div>'
  }

  const content = `
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;">Outcome due today</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;opacity:0.9;">
  You have ${countDue} decision${pluralDue} waiting for an outcome. This is where Decylo actually works.
</p>

${decisionListHTML}

<a href="${ctaUrl}" style="display:inline-block;background:#4C7DFF;color:#071024;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">
  Log outcomes now
</a>

<p style="margin:18px 0 0;font-size:13px;line-height:1.7;opacity:0.75;">
  Takes ~30 seconds per decision. You're training accuracy, not writing an essay.
</p>
`

  return getBaseEmailHTML(content, { ...data, cta_url: ctaUrl })
}

/**
 * 3. Outcome Overdue (stronger nudge)
 */
export function generateOutcomeOverdueEmailHTML(data: EmailTemplateData): string {
  const title = data.title || 'This decision'
  const appUrl = getEmailAppUrl()
  const decisionId = data.decision_id
  const ctaUrl = data.cta_url || (decisionId ? `${appUrl}/app/decision/${decisionId}?logOutcome=true` : `${appUrl}/app`)

  const content = `
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;">You're leaving learning on the table.</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;opacity:0.9;">
  ${title} is overdue for an outcome. If you skip this, Decylo becomes a diary — not a training system.
</p>

<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 14px;margin:14px 0 18px;">
  <div style="font-weight:700;margin-bottom:6px;">What to log (simple)</div>
  <div style="font-size:14px;line-height:1.7;opacity:0.9;">
    1) What happened<br/>
    2) What you learned<br/>
    3) Win / Neutral / Loss
  </div>
</div>

<a href="${ctaUrl}" style="display:inline-block;background:#4C7DFF;color:#071024;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">
  Close the loop
</a>

<p style="margin:18px 0 0;font-size:13px;line-height:1.7;opacity:0.75;">
  Honest outcomes build your Decision Health. Avoided outcomes destroy it.
</p>
`

  return getBaseEmailHTML(content, { ...data, cta_url: ctaUrl })
}

/**
 * 4. Weekly Review
 */
export function generateWeeklyReviewEmailHTML(data: EmailTemplateData): string {
  const trendWord = data.trend_word || 'stable'
  const dhi = data.dhi ?? '—'
  const calGap = data.cal_gap ?? '—'
  const lcr = data.lcr ?? '—'
  const challengeText = data.challenge_text || 'Keep closing loops. That\'s the only metric that matters.'
  const appUrl = getEmailAppUrl()
  const ctaUrl = data.cta_url || `${appUrl}/app/review`

  const content = `
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;">Your Weekly Review</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;opacity:0.9;">
  Here's the real question: did your confidence match reality this week?
</p>

<div style="display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 18px;">
  <div style="flex:1;min-width:180px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
    <div style="font-size:12px;opacity:0.7;">Decision Health</div>
    <div style="font-size:22px;font-weight:800;margin-top:4px;">${dhi}/100</div>
  </div>
  <div style="flex:1;min-width:180px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
    <div style="font-size:12px;opacity:0.7;">Calibration Gap</div>
    <div style="font-size:22px;font-weight:800;margin-top:4px;">${calGap}</div>
  </div>
  <div style="flex:1;min-width:180px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
    <div style="font-size:12px;opacity:0.7;">Loop Closure</div>
    <div style="font-size:22px;font-weight:800;margin-top:4px;">${lcr}%</div>
  </div>
</div>

<div style="background:rgba(76,125,255,0.10);border:1px solid rgba(76,125,255,0.25);border-radius:14px;padding:14px 14px;margin:14px 0 18px;">
  <div style="font-weight:800;margin-bottom:6px;">One focused challenge</div>
  <div style="font-size:14px;line-height:1.7;opacity:0.95;">
    ${challengeText}
  </div>
</div>

<a href="${ctaUrl}" style="display:inline-block;background:#4C7DFF;color:#071024;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">
  Open Weekly Review
</a>

<p style="margin:18px 0 0;font-size:13px;line-height:1.7;opacity:0.75;">
  Small note: "wins" don't matter if your confidence is delusional. Calibration is the skill.
</p>
`

  return getBaseEmailHTML(content, { ...data, cta_url: ctaUrl })
}

/**
 * 5. Streak Save
 */
export function generateStreakSaveEmailHTML(data: EmailTemplateData): string {
  const appUrl = getEmailAppUrl()
  const ctaUrl = data.cta_url || `${appUrl}/app`

  const content = `
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;">Save the streak.</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;opacity:0.9;">
  You're one logged outcome away from keeping momentum. One decision. One reflection. Done.
</p>

<a href="${ctaUrl}" style="display:inline-block;background:#4C7DFF;color:#071024;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">
  Log one outcome
</a>

<p style="margin:18px 0 0;font-size:13px;line-height:1.7;opacity:0.75;">
  Momentum beats motivation. This is the easiest win you'll get today.
</p>
`

  return getBaseEmailHTML(content, { ...data, cta_url: ctaUrl })
}

/**
 * 6. First Outcome Celebration
 */
export function generateFirstOutcomeEmailHTML(data: EmailTemplateData): string {
  const appUrl = getEmailAppUrl()
  const ctaUrl = data.cta_url || `${appUrl}/app/insights`

  const content = `
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;">First loop closed ✅</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;opacity:0.9;">
  Most people never reflect. You did. That's the whole point.
</p>

<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 14px;margin:14px 0 18px;">
  <div style="font-weight:700;margin-bottom:6px;">What Decylo is measuring now</div>
  <div style="font-size:14px;line-height:1.7;opacity:0.9;">
    Your confidence vs reality.<br/>
    Over time, that becomes your Judgment Profile.
  </div>
</div>

<a href="${ctaUrl}" style="display:inline-block;background:#4C7DFF;color:#071024;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">
  See your insights
</a>
`

  return getBaseEmailHTML(content, { ...data, cta_url: ctaUrl })
}

/**
 * 7. Pro Moment (after 3rd outcome)
 */
export function generateProMomentEmailHTML(data: EmailTemplateData): string {
  const appUrl = getEmailAppUrl()
  const ctaUrl = data.cta_url || `${appUrl}/pricing`

  const content = `
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;">Now it gets interesting.</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;opacity:0.9;">
  You've logged enough outcomes for Decylo to start seeing patterns.
  Pro unlocks the full Judgment Profile + Decision Trajectory.
</p>

<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 14px;margin:14px 0 18px;">
  <div style="font-weight:800;margin-bottom:6px;">What you unlock</div>
  <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;opacity:0.9;">
    <li>Full decision history (not just 7 days)</li>
    <li>Judgment Profile (how you think under pressure)</li>
    <li>Decision Trajectory (your trend, not your mood)</li>
    <li>Weekly Review + exports</li>
  </ul>
</div>

<a href="${ctaUrl}" style="display:inline-block;background:#4C7DFF;color:#071024;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:12px;">
  Upgrade to Pro
</a>

<p style="margin:18px 0 0;font-size:13px;line-height:1.7;opacity:0.75;">
  You're not paying for features. You're paying for feedback loops.
</p>
`

  return getBaseEmailHTML(content, { ...data, cta_url: ctaUrl })
}

