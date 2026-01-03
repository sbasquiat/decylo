import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyReviewEmail, sendEmail } from '@/lib/emails'
import { logEmailSent, getPreferenceForEmailType } from '@/lib/emails-utils'

/**
 * Cron job: Weekly review nudge
 * Runs weekly (Sunday evening per user timezone if possible; otherwise Sunday 18:00 UTC)
 * Sends weekly review emails to users who have made decisions this week
 * 
 * Configure in Vercel: https://vercel.com/docs/cron-jobs
 * Schedule: 0 18 * * 0 (Sunday 6 PM UTC)
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
    // Get start of current week (Sunday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysFromSunday = dayOfWeek === 0 ? 0 : dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysFromSunday)
    weekStart.setHours(0, 0, 0, 0)

    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Find users who made decisions this week
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('user_id, date')
      .gte('date', weekStartStr)
      .order('date', { ascending: false })

    if (decisionsError) {
      console.error('Error fetching decisions for weekly review:', decisionsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!decisions || decisions.length === 0) {
      return NextResponse.json({ 
        message: 'No decisions made this week',
        sent: 0 
      })
    }

    // Group by user and count decisions
    const userDecisionCounts = new Map<string, number>()
    for (const decision of decisions) {
      const count = userDecisionCounts.get(decision.user_id) || 0
      userDecisionCounts.set(decision.user_id, count + 1)
    }

    const userIds = Array.from(userDecisionCounts.keys())

    // Get user emails from auth.users (requires service role)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    const userMap = new Map(users?.map(u => [u.id, u.email]) || [])

    // Get profiles for preferences and timezone
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email_preferences, timezone, display_name')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Send emails
    let sentCount = 0
    let skippedCount = 0

    for (const userId of userIds) {
      const userEmail = userMap.get(userId)
      if (!userEmail) {
        console.warn(`No email found for user ${userId}`)
        skippedCount++
        continue
      }

      const decisionCount = userDecisionCounts.get(userId) || 0
      
      // Determine trajectory (simplified - could be enhanced with actual health data)
      const trajectory: 'up' | 'down' | 'stable' = 'stable'

      // Check preferences with service role
      const profile = profileMap.get(userId)
      const preferences = {
        welcome: profile?.email_preferences?.welcome !== false,
        reminders: profile?.email_preferences?.reminders !== false,
        weekly_review: profile?.email_preferences?.weekly_review !== false,
      }

      if (!getPreferenceForEmailType(preferences, 'weekly_review')) {
        skippedCount++
        continue
      }

      // Check idempotency
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 7)
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('email_type', 'weekly_review')
        .is('target_id', null)
        .gte('sent_at', cutoffDate.toISOString())
        .limit(1)

      if (existingLog && existingLog.length > 0) {
        skippedCount++
        continue
      }

      // Get user's Decision Health data for email
      // TODO: Fetch actual DHI, calibration gap, and loop closure rate from database
      // For now, using placeholder values
      const emailData = generateWeeklyReviewEmail(profile?.display_name || undefined, {
        decisionsMade: decisionCount,
        trajectory,
        dhi: undefined, // TODO: Get from decision_health_snapshots
        cal_gap: undefined, // TODO: Calculate from outcomes
        lcr: undefined, // TODO: Calculate completion rate
        challenge_text: undefined, // TODO: Generate personalized challenge
      })
      const emailToSend = {
        ...emailData,
        to: userEmail,
      }
      const sent = await sendEmail(emailToSend)

      if (sent) {
        // Log with service role
        await logEmailSent(userId, 'weekly_review', null, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        sentCount++
      } else {
        skippedCount++
      }
    }

    return NextResponse.json({
      message: 'Weekly review cron completed',
      total: userIds.length,
      sent: sentCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('Error in weekly-review cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

