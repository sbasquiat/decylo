import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateDecisionHealth } from '@/lib/insights'
import { format } from 'date-fns'

/**
 * Recalculate and persist Decision Health snapshot
 * Called automatically after outcome save
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all decisions and outcomes
    const { data: allDecisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user.id)

    const decisionIds = allDecisions?.map((d) => d.id) || []

    const { data: allOutcomes } = decisionIds.length > 0
      ? await supabase
          .from('outcomes')
          .select('*')
          .in('decision_id', decisionIds)
      : { data: null }

    // Calculate streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [checkinsResult, decisionsResult, outcomesResult] = await Promise.all([
      supabase.from('checkins').select('date').eq('user_id', user.id),
      supabase.from('decisions').select('created_at').eq('user_id', user.id),
      supabase
        .from('outcomes')
        .select('completed_at, decision_id')
        .in('decision_id', decisionIds),
    ])

    const activityDates = new Set<string>()
    checkinsResult.data?.forEach((c) => activityDates.add(c.date))
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

    // Calculate Decision Health
    const health = calculateDecisionHealth(
      allDecisions || [],
      allOutcomes || [],
      streak
    )

    // Persist snapshot (upsert for today)
    const todayStr = format(today, 'yyyy-MM-dd')
    const { error: snapshotError } = await supabase
      .from('decision_health_snapshots')
      .upsert(
        {
          user_id: user.id,
          health_score: health.healthScore,
          win_rate: health.winRate,
          avg_calibration_gap: health.avgCalibrationGap,
          completion_rate: health.completionRate,
          streak_length: health.streakLength,
          snapshot_date: todayStr,
        },
        {
          onConflict: 'user_id,snapshot_date',
        }
      )

    if (snapshotError) {
      console.error('Error saving health snapshot:', snapshotError)
      return NextResponse.json(
        { error: 'Failed to save health snapshot' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      health: health,
    })
  } catch (error) {
    console.error('Error recalculating decision health:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


