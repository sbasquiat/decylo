import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateStreakSaveEmail, sendEmail } from '@/lib/emails'
import { logEmailSent, getPreferenceForEmailType } from '@/lib/emails-utils'

/**
 * Cron job: Streak save reminders
 * Runs daily, finds users with active streaks at risk (streak > 0, last activity 24-48h ago)
 * Sends streak save emails
 * 
 * Configure in Vercel: https://vercel.com/docs/cron-jobs
 * Schedule: 0 18 * * * (6 PM UTC daily)
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
    // Get all active users (have made at least one decision)
    const { data: decisions } = await supabase
      .from('decisions')
      .select('user_id, created_at')
      .order('created_at', { ascending: false })

    if (!decisions || decisions.length === 0) {
      return NextResponse.json({ 
        message: 'No users with decisions',
        sent: 0 
      })
    }

    const userIds = Array.from(new Set(decisions.map(d => d.user_id)))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get user emails
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    const userMap = new Map(users?.map(u => [u.id, u.email]) || [])

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email_preferences, display_name')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Calculate streaks and find users at risk
    const usersAtRisk: Array<{ userId: string; streak: number }> = []

    for (const userId of userIds) {
      // Get all activity dates (decisions, outcomes, checkins)
      const [checkinsResult, decisionsResult, outcomesResult] = await Promise.all([
        supabase.from('checkins').select('date').eq('user_id', userId),
        supabase.from('decisions').select('created_at').eq('user_id', userId),
        supabase
          .from('outcomes')
          .select('completed_at, decision_id')
          .in(
            'decision_id',
            (await supabase.from('decisions').select('id').eq('user_id', userId)).data?.map(
              (d) => d.id
            ) || []
          ),
      ])

      // Collect all activity dates
      const activityDates = new Set<string>()

      checkinsResult.data?.forEach((c) => {
        activityDates.add(c.date)
      })

      decisionsResult.data?.forEach((d) => {
        const date = new Date(d.created_at).toISOString().split('T')[0]
        activityDates.add(date)
      })

      outcomesResult.data?.forEach((o) => {
        if (o.completed_at) {
          const date = new Date(o.completed_at).toISOString().split('T')[0]
          activityDates.add(date)
        }
      })

      // Calculate streak
      let streak = 0
      const sortedDates = Array.from(activityDates).sort((a, b) => b.localeCompare(a))
      let currentDate = new Date(today)

      for (const dateStr of sortedDates) {
        const activityDate = new Date(dateStr)
        activityDate.setHours(0, 0, 0, 0)

        if (activityDate.getTime() === currentDate.getTime()) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else if (activityDate < currentDate) {
          break
        }
      }

      // Check if streak is at risk (streak > 0, last activity 24-48h ago)
      if (streak > 0 && sortedDates.length > 0) {
        const lastActivityDate = new Date(sortedDates[0])
        const hoursSinceLastActivity = (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60)

        // Streak at risk if last activity was 24-48 hours ago
        if (hoursSinceLastActivity >= 24 && hoursSinceLastActivity <= 48) {
          usersAtRisk.push({ userId, streak })
        }
      }
    }

    if (usersAtRisk.length === 0) {
      return NextResponse.json({ 
        message: 'No users with streaks at risk',
        sent: 0 
      })
    }

    // Send emails
    let sentCount = 0
    let skippedCount = 0

    for (const { userId, streak } of usersAtRisk) {
      const userEmail = userMap.get(userId)
      if (!userEmail) {
        console.warn(`No email found for user ${userId}`)
        skippedCount++
        continue
      }

      // Check preferences
      const profile = profileMap.get(userId)
      const preferences = {
        welcome: profile?.email_preferences?.welcome !== false,
        reminders: profile?.email_preferences?.reminders !== false,
        weekly_review: profile?.email_preferences?.weekly_review !== false,
      }

      if (!getPreferenceForEmailType(preferences, 'streak_save')) {
        skippedCount++
        continue
      }

      // Check idempotency (don't send if already sent in last 24 hours)
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - 24)
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('email_type', 'streak_save')
        .is('target_id', null)
        .gte('sent_at', cutoffDate.toISOString())
        .limit(1)

      if (existingLog && existingLog.length > 0) {
        skippedCount++
        continue
      }

      // Send email
      const emailData = generateStreakSaveEmail(profile?.display_name || undefined)
      const emailToSend = {
        ...emailData,
        to: userEmail,
      }
      const sent = await sendEmail(emailToSend)

      if (sent) {
        await logEmailSent(userId, 'streak_save', null, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        sentCount++
      } else {
        skippedCount++
      }
    }

    return NextResponse.json({
      message: 'Streak save cron completed',
      total: usersAtRisk.length,
      sent: sentCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('Error in streak-save cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

