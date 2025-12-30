import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { computeDecisionStatus } from '@/lib/decision-status'
import TodayScreen from '@/components/TodayScreen'

export default async function AppPage() {
  const supabase = await createClient()
  
  // Get user - middleware already refreshed the session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('AppPage: Authentication error', {
      error: authError?.message,
      hasUser: !!user,
    })
    redirect('/signin')
  }

  // CRITICAL: Log user ID to help debug data leakage issues
  console.log('AppPage: Loading data for user', {
    userId: user.id,
    userEmail: user.email,
  })

  const today = format(new Date(), 'yyyy-MM-dd')

  // Get today's check-in
  const { data: checkin } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  // Get decisions for today
  const { data: decisions, error: decisionsError } = await supabase
    .from('decisions')
    .select('*, options(*)')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(3)

  if (decisionsError) {
    console.error('Error fetching decisions for Today page:', {
      error: decisionsError,
      errorString: JSON.stringify(decisionsError, Object.getOwnPropertyNames(decisionsError), 2),
      userId: user.id,
      date: today,
    })
  }

  // Get outcomes for today's decisions to compute status
  // CRITICAL: Only fetch outcomes for decisions that belong to this user
  // We already filtered decisions by user_id, so decisionIds are safe
  const decisionIds = decisions?.map((d) => d.id) || []
  
  // Double-check: Verify all decisionIds belong to this user (defensive check)
  if (decisions && decisions.length > 0) {
    const invalidDecisions = decisions.filter((d) => d.user_id !== user.id)
    if (invalidDecisions.length > 0) {
      console.error('SECURITY: Found decisions not belonging to user!', {
        userId: user.id,
        invalidDecisionIds: invalidDecisions.map((d) => d.id),
      })
      // Don't fetch outcomes if we have invalid decisions
      decisionIds.length = 0
    }
  }
  
  const { data: todayOutcomes } = decisionIds.length > 0
    ? await supabase
        .from('outcomes')
        .select('*')
        .in('decision_id', decisionIds)
    : { data: null }
  
  // Additional safety: Filter out any outcomes that don't belong to this user's decisions
  // This is a defensive check in case RLS fails
  const safeTodayOutcomes = todayOutcomes?.filter((outcome: any) => {
    const decision = decisions?.find((d) => d.id === outcome.decision_id)
    if (!decision) return false
    if (decision.user_id !== user.id) {
      console.error('SECURITY: Outcome belongs to different user!', {
        userId: user.id,
        outcomeDecisionId: outcome.decision_id,
        decisionUserId: decision.user_id,
      })
      return false
    }
    return true
  }) || []

  // Create outcome map for quick lookup (using safe filtered outcomes)
  const outcomeMap = new Map()
  safeTodayOutcomes?.forEach((outcome: any) => {
    outcomeMap.set(outcome.decision_id, outcome)
  })

  // Attach outcomes to decisions
  const decisionsWithOutcomes = decisions?.map((decision) => ({
    ...decision,
    outcome: outcomeMap.get(decision.id) || null,
  })) || []

  // Get decisions that need outcomes (state machine: decided = has decided_at + chosen_option_id but no outcome)
  const { data: allDecisionsWithChoice } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .not('chosen_option_id', 'is', null)
    .not('decided_at', 'is', null)
    .order('date', { ascending: false })
  
  // Find the first decided decision without an outcome (state machine: decided -> completed)
  // Use computed status, not stored status field
  let outcomeDue = null
  let completedToday = null
  if (allDecisionsWithChoice && allDecisionsWithChoice.length > 0) {
    // Sort by due date (earliest first, then by date)
    const sorted = [...allDecisionsWithChoice].sort((a, b) => {
      if (a.next_action_due_date && b.next_action_due_date) {
        return a.next_action_due_date.localeCompare(b.next_action_due_date)
      }
      if (a.next_action_due_date) return -1
      if (b.next_action_due_date) return 1
      return b.date.localeCompare(a.date)
    })

    for (const decision of sorted) {
      // CRITICAL: Verify decision belongs to this user before checking outcomes
      if (decision.user_id !== user.id) {
        console.error('SECURITY: Decision does not belong to user!', {
          userId: user.id,
          decisionId: decision.id,
          decisionUserId: decision.user_id,
        })
        continue
      }
      
      // Check if outcome exists
      const { data: existingOutcome } = await supabase
        .from('outcomes')
        .select('id, completed_at')
        .eq('decision_id', decision.id)
        .single()
      
      if (existingOutcome) {
        // Check if completed today
        const completedDate = new Date(existingOutcome.completed_at).toISOString().split('T')[0]
        if (completedDate === today && !completedToday) {
          completedToday = decision
        }
      } else if (!outcomeDue) {
        // Only show as outcomeDue if status is 'decided' (has decided_at + chosen_option_id but no outcome_id)
        // Enforce: DECIDED = has decided_at AND chosen_option_id AND no outcome_id
        if (decision.decided_at && decision.chosen_option_id && !decision.outcome_id) {
          outcomeDue = decision
        }
      }
    }
  }

  // Calculate streak (increments on: decision created, outcome logged, or check-in completed)
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  // Get all activity dates
  const [checkinsResult, decisionsResult, outcomesResult] = await Promise.all([
    supabase.from('checkins').select('date').eq('user_id', user.id),
    supabase.from('decisions').select('created_at').eq('user_id', user.id),
    supabase
      .from('outcomes')
      .select('completed_at, decision_id')
      .in(
        'decision_id',
        (await supabase.from('decisions').select('id').eq('user_id', user.id)).data?.map(
          (d) => d.id
        ) || []
      ),
  ])

  // Collect all activity dates
  const activityDates = new Set<string>()

  // Add check-in dates
  checkinsResult.data?.forEach((c) => {
    activityDates.add(c.date)
  })

  // Add decision creation dates
  decisionsResult.data?.forEach((d) => {
    const date = new Date(d.created_at).toISOString().split('T')[0]
    activityDates.add(date)
  })

  // Add outcome completion dates
  outcomesResult.data?.forEach((o) => {
    if (o.completed_at) {
      const date = new Date(o.completed_at).toISOString().split('T')[0]
      activityDates.add(date)
    }
  })

  // Calculate streak
  let streak = 0
  const sortedDates = Array.from(activityDates).sort((a, b) => b.localeCompare(a))
  let currentDate = new Date(todayDate)

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

  // Get decisions this week (for stats display)
  const weekStartForStats = new Date()
  weekStartForStats.setDate(weekStartForStats.getDate() - weekStartForStats.getDay())
  const weekStartStrForStats = format(weekStartForStats, 'yyyy-MM-dd')
  const { count: decisionsThisWeek } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('date', weekStartStrForStats)

  // Get outcomes logged this week
  const { count: outcomesThisWeek } = await supabase
    .from('outcomes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekStartForStats.toISOString())
    .in(
      'decision_id',
      (
        await supabase
          .from('decisions')
          .select('id')
          .eq('user_id', user.id)
      ).data?.map((d) => d.id) || []
    )

  // Get total decision count for onboarding
  const { count: totalDecisions } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get onboarding state, feedback state, and nudge tracking
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_welcome_shown, onboarding_first_decision_shown, onboarding_first_outcome_shown, feedback_submitted, timezone, last_morning_nudge_date, last_outcome_nudge_date, last_weekly_reflection_week')
    .eq('id', user.id)
    .single()

  const userTimezone = profile?.timezone || 'UTC'

  // Get last decision date
  const { data: lastDecision } = await supabase
    .from('decisions')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const lastDecisionDate = lastDecision?.date || null

  // Get yesterday's decisions without outcomes
  const retentionLibForYesterday = await import('@/lib/retention')
  const yesterdayDate = retentionLibForYesterday.getYesterdayInTimezone(userTimezone)
  
  // Get yesterday's decisions that are decided (has decided_at + chosen_option_id)
  // CRITICAL: Include user_id in select to verify ownership
  const { data: yesterdayDecisions } = await supabase
    .from('decisions')
    .select('id, title, date, user_id')
    .eq('user_id', user.id)
    .eq('date', yesterdayDate)
    .not('chosen_option_id', 'is', null)
    .not('decided_at', 'is', null)

  // Check which yesterday decisions don't have outcomes
  // CRITICAL: Only check outcomes for decisions that belong to this user
  let outcomeReminderDecision = null
  if (yesterdayDecisions && yesterdayDecisions.length > 0) {
    for (const decision of yesterdayDecisions) {
      // Double-check: Verify decision belongs to this user
      if (decision.user_id !== user.id) {
        console.error('SECURITY: Yesterday decision does not belong to user!', {
          userId: user.id,
          decisionId: decision.id,
          decisionUserId: decision.user_id,
        })
        continue
      }
      
      const { data: existingOutcome } = await supabase
        .from('outcomes')
        .select('id')
        .eq('decision_id', decision.id)
        .single()
      
      if (!existingOutcome) {
        outcomeReminderDecision = decision
        break
      }
    }
  }

  // Get decisions this week (for weekly reflection)
  const { getISOWeekString, getCurrentDayOfWeekInTimezone, getCurrentHourInTimezone } = await import('@/lib/retention')
  const currentWeek = getISOWeekString(new Date(), userTimezone)
  const dayOfWeek = getCurrentDayOfWeekInTimezone(userTimezone)
  const currentHour = getCurrentHourInTimezone(userTimezone)

  // Get weekly decision count (from start of week in user's timezone)
  const weekStartForReflection = new Date()
  weekStartForReflection.setDate(weekStartForReflection.getDate() - weekStartForReflection.getDay()) // Start of week (Sunday)
  const weekStartStrForReflection = format(weekStartForReflection, 'yyyy-MM-dd')
  const { count: weeklyDecisionCount } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('date', weekStartStrForReflection)

  // Get total outcomes count for onboarding
  const { data: allUserDecisions } = await supabase
    .from('decisions')
    .select('id')
    .eq('user_id', user.id)
  
  const allDecisionIds = allUserDecisions?.map((d) => d.id) || []
  
  const { count: totalOutcomes } = allDecisionIds.length > 0
    ? await supabase
        .from('outcomes')
        .select('*', { count: 'exact', head: true })
        .in('decision_id', allDecisionIds)
    : { count: 0 }

  // CRITICAL: Final verification - ensure all decisions belong to this user before rendering
  const safeDecisions = (decisionsWithOutcomes || []).filter((decision: any) => {
    if (decision.user_id !== user.id) {
      console.error('SECURITY: Filtering out decision not belonging to user!', {
        userId: user.id,
        decisionId: decision.id,
        decisionUserId: decision.user_id,
      })
      return false
    }
    return true
  })

  return (
    <TodayScreen
      checkin={checkin}
      decisions={safeDecisions}
      outcomeDue={outcomeDue}
      completedToday={completedToday}
      streak={streak}
      decisionsThisWeek={decisionsThisWeek || 0}
      outcomesThisWeek={outcomesThisWeek || 0}
      totalDecisions={totalDecisions || 0}
      totalOutcomes={totalOutcomes || 0}
      onboardingState={profile || {
        onboarding_welcome_shown: false,
        onboarding_first_decision_shown: false,
        onboarding_first_outcome_shown: false,
      }}
      feedbackSubmitted={profile?.feedback_submitted || false}
      retentionData={{
        lastDecisionDate,
        userTimezone: userTimezone,
        currentHour,
        dayOfWeek,
        currentWeek,
        outcomeReminderDecision,
        weeklyDecisionCount: weeklyDecisionCount || 0,
        nudgeTracking: {
          last_morning_nudge_date: profile?.last_morning_nudge_date || null,
          last_outcome_nudge_date: profile?.last_outcome_nudge_date || null,
          last_weekly_reflection_week: profile?.last_weekly_reflection_week || null,
        },
      }}
    />
  )
}

