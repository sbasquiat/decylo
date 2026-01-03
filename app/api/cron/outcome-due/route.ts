import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateOutcomeDueTodayEmail, generateOutcomeOverdueEmail, sendEmail } from '@/lib/emails'
import { logEmailSent, getPreferenceForEmailType } from '@/lib/emails-utils'

/**
 * Cron job: Daily outcome reminders (due + overdue)
 * Runs daily, finds decisions that are decided but have no outcome
 * Sends daily digest for decisions due today
 * Sends stronger nudge for decisions overdue >7 days
 * 
 * Configure in Vercel: https://vercel.com/docs/cron-jobs
 * Schedule: 0 9 * * * (9 AM UTC daily)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (set in Vercel environment variables)
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
    // 2. Have chosen_option_id (option was selected)
    // 3. Don't have an outcome yet
    // 4. Are not too old (within last 90 days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)

    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('id, user_id, title, decided_at')
      .not('decided_at', 'is', null)
      .not('chosen_option_id', 'is', null)
      .gte('decided_at', cutoffDate.toISOString())
      .order('decided_at', { ascending: false })

    if (decisionsError) {
      console.error('Error fetching decisions for outcome reminders:', decisionsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!decisions || decisions.length === 0) {
      return NextResponse.json({ 
        message: 'No decisions need outcome reminders',
        sent: 0 
      })
    }

    // Check which decisions already have outcomes
    const allDecisionIds = decisions.map(d => d.id)
    const { data: outcomes } = await supabase
      .from('outcomes')
      .select('decision_id')
      .in('decision_id', allDecisionIds)

    const decisionsWithOutcomes = new Set(outcomes?.map(o => o.decision_id) || [])
    const decisionsNeedingReminders = decisions.filter(
      d => !decisionsWithOutcomes.has(d.id)
    )

    if (decisionsNeedingReminders.length === 0) {
      return NextResponse.json({ 
        message: 'All decisions have outcomes',
        sent: 0 
      })
    }

    // Separate decisions into "due today" (decided within last 7 days) and "overdue" (>7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const decisionsDueToday = decisionsNeedingReminders.filter(
      d => new Date(d.decided_at) >= sevenDaysAgo
    )
    const overdueDecisions = decisionsNeedingReminders.filter(
      d => new Date(d.decided_at) < sevenDaysAgo
    )

    // Get user emails and preferences
    const userIds = Array.from(new Set(decisionsNeedingReminders.map(d => d.user_id)))
    
    // Get user emails from auth.users (requires service role)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    const userMap = new Map(users?.map(u => [u.id, u.email]) || [])

    // Get profiles for preferences
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email_preferences')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Group decisions by user for daily digest (due today only)
    const decisionsByUser = new Map<string, typeof decisionsDueToday>()
    for (const decision of decisionsDueToday) {
      if (!decisionsByUser.has(decision.user_id)) {
        decisionsByUser.set(decision.user_id, [])
      }
      decisionsByUser.get(decision.user_id)!.push(decision)
    }

    // Convert Map to Array for iteration
    const userEntries = Array.from(decisionsByUser.entries())

    // Get decision details (options, confidence) for email
    const reminderDecisionIds = decisionsDueToday.map(d => d.id)
    const { data: decisionsWithDetails } = await supabase
      .from('decisions')
      .select('id, title, chosen_option_id, confidence_int')
      .in('id', reminderDecisionIds)

    const { data: options } = await supabase
      .from('options')
      .select('id, label')
      .in('decision_id', reminderDecisionIds)

    const optionsMap = new Map(options?.map(o => [o.id, o.label]) || [])
    const decisionsMap = new Map(decisionsWithDetails?.map(d => [d.id, d]) || [])

    // Send emails (grouped by user - one email per user with all their due decisions)
    let sentCount = 0
    let skippedCount = 0

    for (const [userId, userDecisions] of userEntries) {
      const userEmail = userMap.get(userId)
      if (!userEmail) {
        console.warn(`No email found for user ${userId}`)
        skippedCount += userDecisions.length
        continue
      }

      // Check preferences with service role
      const profile = profileMap.get(userId)
      const preferences = {
        welcome: profile?.email_preferences?.welcome !== false,
        reminders: profile?.email_preferences?.reminders !== false,
        weekly_review: profile?.email_preferences?.weekly_review !== false,
      }

      if (!getPreferenceForEmailType(preferences, 'outcome_due_today')) {
        skippedCount += userDecisions.length
        continue
      }

      // Check idempotency (don't send if already sent today)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('email_type', 'outcome_due_today')
        .gte('sent_at', today.toISOString())
        .limit(1)

      if (existingLog && existingLog.length > 0) {
        skippedCount += userDecisions.length
        continue
      }

      // Prepare decision list for email
      const decisionsForEmail = userDecisions.map((d: any) => {
        const decisionDetail = decisionsMap.get(d.id)
        const chosenOptionLabel = decisionDetail?.chosen_option_id 
          ? optionsMap.get(decisionDetail.chosen_option_id) || 'N/A'
          : 'N/A'
        return {
          title: decisionDetail?.title || d.title || 'Untitled Decision',
          chosen_option: chosenOptionLabel,
          confidence: decisionDetail?.confidence_int || 'N/A',
          id: d.id,
        }
      })

      // Get profile for display name
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single()

      // Send daily digest email
      const emailData = generateOutcomeDueTodayEmail(decisionsForEmail, userProfile?.display_name || undefined)
      const emailToSend = {
        ...emailData,
        to: userEmail,
      }
      const sent = await sendEmail(emailToSend)

      if (sent) {
        // Log with service role
        await logEmailSent(userId, 'outcome_due_today', null, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        sentCount += userDecisions.length
      } else {
        skippedCount += userDecisions.length
      }
    }

    // Now handle overdue decisions (send individual emails)
    let overdueSentCount = 0
    let overdueSkippedCount = 0

    if (overdueDecisions.length > 0) {
      const overdueUserIds = Array.from(new Set(overdueDecisions.map(d => d.user_id)))
      const { data: overdueProfiles } = await supabase
        .from('profiles')
        .select('id, email_preferences, display_name')
        .in('id', overdueUserIds)

      const overdueProfileMap = new Map(overdueProfiles?.map(p => [p.id, p]) || [])

      for (const decision of overdueDecisions) {
        const userEmail = userMap.get(decision.user_id)
        if (!userEmail) {
          overdueSkippedCount++
          continue
        }

        const profile = overdueProfileMap.get(decision.user_id)
        const preferences = {
          welcome: profile?.email_preferences?.welcome !== false,
          reminders: profile?.email_preferences?.reminders !== false,
          weekly_review: profile?.email_preferences?.weekly_review !== false,
        }

        if (!getPreferenceForEmailType(preferences, 'outcome_overdue')) {
          overdueSkippedCount++
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
          overdueSkippedCount++
          continue
        }

        // Send overdue email
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
          overdueSentCount++
        } else {
          overdueSkippedCount++
        }
      }
    }

    return NextResponse.json({
      message: 'Outcome reminder cron completed (due + overdue)',
      due_today: {
        total: decisionsDueToday.length,
        sent: sentCount,
        skipped: skippedCount,
      },
      overdue: {
        total: overdueDecisions.length,
        sent: overdueSentCount,
        skipped: overdueSkippedCount,
      },
    })
  } catch (error) {
    console.error('Error in outcome-due cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

