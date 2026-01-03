import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateOutcomeOverdueEmail, sendEmail } from '@/lib/emails'
import { logEmailSent, getPreferenceForEmailType } from '@/lib/emails-utils'

/**
 * Cron job: Outcome overdue reminders
 * Runs daily, finds decisions that are overdue (decided > 7 days ago, no outcome)
 * Sends stronger nudge emails to decision owners
 * 
 * Configure in Vercel: https://vercel.com/docs/cron-jobs
 * Schedule: 0 10 * * * (10 AM UTC daily, after outcome-due cron)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role for admin operations
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
  
  try {
    // Find decisions that:
    // 1. Have decided_at (decision was made)
    // 2. Don't have an outcome yet
    // 3. Are overdue (decided > 7 days ago)
    // 4. Are not too old (within last 90 days)
    const overdueCutoff = new Date()
    overdueCutoff.setDate(overdueCutoff.getDate() - 7) // 7 days ago

    const maxAge = new Date()
    maxAge.setDate(maxAge.getDate() - 90)

    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('id, user_id, title, decided_at')
      .not('decided_at', 'is', null)
      .not('chosen_option_id', 'is', null)
      .lt('decided_at', overdueCutoff.toISOString())
      .gte('decided_at', maxAge.toISOString())
      .order('decided_at', { ascending: false })

    if (decisionsError) {
      console.error('Error fetching overdue decisions:', decisionsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!decisions || decisions.length === 0) {
      return NextResponse.json({ 
        message: 'No overdue decisions',
        sent: 0 
      })
    }

    // Check which decisions already have outcomes
    const decisionIds = decisions.map(d => d.id)
    const { data: outcomes } = await supabase
      .from('outcomes')
      .select('decision_id')
      .in('decision_id', decisionIds)

    const decisionsWithOutcomes = new Set(outcomes?.map(o => o.decision_id) || [])
    const overdueDecisions = decisions.filter(
      d => !decisionsWithOutcomes.has(d.id)
    )

    if (overdueDecisions.length === 0) {
      return NextResponse.json({ 
        message: 'All overdue decisions have outcomes',
        sent: 0 
      })
    }

    // Get user emails and preferences
    const userIds = Array.from(new Set(overdueDecisions.map(d => d.user_id)))
    
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    const userMap = new Map(users?.map(u => [u.id, u.email]) || [])

    // Get profiles for preferences
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email_preferences, display_name')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Send emails
    let sentCount = 0
    let skippedCount = 0

    for (const decision of overdueDecisions) {
      const userEmail = userMap.get(decision.user_id)
      if (!userEmail) {
        console.warn(`No email found for user ${decision.user_id}`)
        skippedCount++
        continue
      }

      // Check preferences
      const profile = profileMap.get(decision.user_id)
      const preferences = {
        welcome: profile?.email_preferences?.welcome !== false,
        reminders: profile?.email_preferences?.reminders !== false,
        weekly_review: profile?.email_preferences?.weekly_review !== false,
      }

      if (!getPreferenceForEmailType(preferences, 'outcome_overdue')) {
        skippedCount++
        continue
      }

      // Check idempotency (don't send if already sent in last 7 days)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 7)
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', decision.user_id)
        .eq('email_type', 'outcome_overdue')
        .eq('target_id', decision.id)
        .gte('sent_at', cutoffDate.toISOString())
        .limit(1)

      if (existingLog && existingLog.length > 0) {
        skippedCount++
        continue
      }

      // Send email
      const emailData = generateOutcomeOverdueEmail(
        decision.title || 'This decision',
        decision.id,
        profile?.display_name || undefined
      )
      const emailToSend = {
        ...emailData,
        to: userEmail,
      }
      const sent = await sendEmail(emailToSend)

      if (sent) {
        await logEmailSent(decision.user_id, 'outcome_overdue', decision.id, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        sentCount++
      } else {
        skippedCount++
      }
    }

    return NextResponse.json({
      message: 'Outcome overdue cron completed',
      total: overdueDecisions.length,
      sent: sentCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('Error in outcome-overdue cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

