import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/subscription'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { format, startOfWeek, subDays, eachDayOfInterval } from 'date-fns'
import {
  calculateOutcomeRatios,
  calculateDQI,
  calculateJudgmentGrowth,
  calculateConfidenceCalibration,
  calculateCategoryDQI,
  getOutcomesInDateRange,
  calculateConfidenceAccuracy,
  calculateDecisionHealth,
  getDecisionHealthTrend,
} from '@/lib/insights'
import {
  calculateCategoryCalibration,
  detectPatternWarnings,
} from '@/lib/bias-reduction'
import { Decision, Outcome } from '@/lib/db/types'
import InsightsLock from '@/components/InsightsLock'
import PatternWarningCard from '@/components/PatternWarningCard'
import CategoryCalibrationInsight from '@/components/CategoryCalibrationInsight'
import WeeklyInsightBanner from '@/components/WeeklyInsightBanner'
import StateOfYouCard from '@/components/StateOfYouCard'
import JudgmentProfileCard from '@/components/JudgmentProfileCard'
import TrajectoryCard from '@/components/TrajectoryCard'
import RequirePro from '@/components/RequirePro'
import { formatCategory } from '@/lib/category-format'
import { DecisionCategory } from '@/lib/db/types'
import { generateStateOfYou } from '@/lib/state-of-you'
import { generateJudgmentProfile } from '@/lib/judgment-profile'
import { generateDecisionTrajectory } from '@/lib/decision-trajectory'

export default async function InsightsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Calculate streak (increments on: decision created, outcome logged, or check-in completed)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

  // Get all decisions and outcomes
  const { data: allDecisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)

  const decisionIds = allDecisions?.map((d) => d.id) || []

  const { data: allOutcomes } = await supabase
    .from('outcomes')
    .select('*')
    .in('decision_id', decisionIds)

  // Convert to typed arrays
  const decisions: Decision[] = (allDecisions || []) as Decision[]
  const outcomes: Outcome[] = (allOutcomes || []) as Outcome[]

  // Calculate outcome ratios
  const outcomeRatios = calculateOutcomeRatios(outcomes)

  // Calculate Decision Quality Index (DQI)
  const dqi = calculateDQI(outcomes)

  // Calculate Judgment Growth Rate (last 14 days vs previous 14 days)
  const now = new Date()
  const last14DaysStart = subDays(now, 14)
  const previous14DaysStart = subDays(now, 28)
  const previous14DaysEnd = subDays(now, 14)

  const recentOutcomes = getOutcomesInDateRange(outcomes, last14DaysStart, now)
  const previousOutcomes = getOutcomesInDateRange(
    outcomes,
    previous14DaysStart,
    previous14DaysEnd
  )
  const growthRate = calculateJudgmentGrowth(recentOutcomes, previousOutcomes)

  // Calculate Confidence Calibration
  const calibration = calculateConfidenceCalibration(decisions, outcomes)

  // Calculate Decision Health
  const decisionHealth = calculateDecisionHealth(decisions, outcomes, streak)

  // Get Decision Health trend (current vs last 7 days)
  const sevenDaysAgo = subDays(now, 7)
  const { data: previousHealthSnapshot } = await supabase
    .from('decision_health_snapshots')
    .select('health_score')
    .eq('user_id', user.id)
    .eq('snapshot_date', format(sevenDaysAgo, 'yyyy-MM-dd'))
    .single()

  const healthTrend = getDecisionHealthTrend(
    decisionHealth.healthScore,
    previousHealthSnapshot?.health_score || null
  )

  // Calculate Category Intelligence
  const categories = ['career', 'money', 'health', 'relationships', 'life_lifestyle', 'growth_learning', 'time_priorities', 'other'] as const
  const categoryDQI: Record<string, number> = {}
  for (const category of categories) {
    categoryDQI[category] = calculateCategoryDQI(category, decisions, outcomes)
  }

  // Calculate Category Calibration (bias reduction insights)
  const categoryCalibrations = calculateCategoryCalibration(decisions, outcomes)

  // Detect Pattern Warnings (challenging insights)
  const patternWarnings = detectPatternWarnings(decisions, outcomes)

  // Generate "State of You" profile (legacy, keep for now)
  const stateOfYou = generateStateOfYou(decisions, outcomes)

  // Get options for Risk Intelligence calculation
  const { data: allOptions } = await supabase
    .from('options')
    .select('id, risk_int')
    .in('decision_id', decisionIds)

  const optionsMap = new Map(
    allOptions?.map((o) => [o.id, { risk_int: o.risk_int }]) || []
  )

  // Get health snapshots for trajectory
  const thirtyDaysAgo = subDays(now, 30)
  const { data: healthSnapshotsData } = await supabase
    .from('decision_health_snapshots')
    .select('snapshot_date, health_score')
    .eq('user_id', user.id)
    .gte('snapshot_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
    .order('snapshot_date', { ascending: true })

  const healthSnapshots = (healthSnapshotsData || []).map((s) => ({
    date: new Date(s.snapshot_date),
    health: s.health_score,
  }))

  // Get health at different time points
  const { data: health7DaysAgoSnapshot } = await supabase
    .from('decision_health_snapshots')
    .select('health_score')
    .eq('user_id', user.id)
    .eq('snapshot_date', format(subDays(now, 7), 'yyyy-MM-dd'))
    .single()

  const { data: health14DaysAgoSnapshot } = await supabase
    .from('decision_health_snapshots')
    .select('health_score')
    .eq('user_id', user.id)
    .eq('snapshot_date', format(subDays(now, 14), 'yyyy-MM-dd'))
    .single()

  const { data: health30DaysAgoSnapshot } = await supabase
    .from('decision_health_snapshots')
    .select('health_score')
    .eq('user_id', user.id)
    .eq('snapshot_date', format(subDays(now, 30), 'yyyy-MM-dd'))
    .single()

  // Generate Judgment Profile
  const judgmentProfile = generateJudgmentProfile(
    decisions,
    outcomes,
    decisionHealth.healthScore,
    health14DaysAgoSnapshot?.health_score || null,
    optionsMap
  )

  // Generate Decision Trajectory
  const trajectory = generateDecisionTrajectory(
    decisions,
    outcomes,
    decisionHealth.healthScore,
    health7DaysAgoSnapshot?.health_score || null,
    health14DaysAgoSnapshot?.health_score || null,
    health30DaysAgoSnapshot?.health_score || null,
    healthSnapshots,
    optionsMap
  )

  // Prepare trend data (outcomes over time - last 30 days)
  const trendStart = subDays(now, 30)
  const trendDays = eachDayOfInterval({ start: trendStart, end: now })
  const trendData = trendDays.map((day) => {
    const dayOutcomes = outcomes.filter((o) => {
      if (!o.completed_at) return false
      const completedDate = new Date(o.completed_at)
      return (
        completedDate.getDate() === day.getDate() &&
        completedDate.getMonth() === day.getMonth() &&
        completedDate.getFullYear() === day.getFullYear()
      )
    })
    return {
      date: day,
      wins: dayOutcomes.filter((o) => o.outcome_score_int === 1).length,
      neutrals: dayOutcomes.filter((o) => o.outcome_score_int === 0).length,
      losses: dayOutcomes.filter((o) => o.outcome_score_int === -1).length,
      total: dayOutcomes.length,
    }
  })

  // Prepare confidence vs outcome data
  const confidenceVsOutcome = decisions
    .filter((d) => d.confidence_int !== null)
    .map((d) => {
      const outcome = outcomes.find((o) => o.decision_id === d.id)
      if (!outcome) return null
      return {
        confidence: d.confidence_int!,
        outcomeScore: outcome.outcome_score_int,
        accuracy: calculateConfidenceAccuracy(d.confidence_int, outcome.outcome_score_int),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  // Category distribution (count)
  const categoryCounts: Record<string, number> = {}
  if (decisions) {
    for (const d of decisions) {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1
    }
  }

  const hasCategoryData = categoryCounts && Object.keys(categoryCounts).length > 0
  const hasOutcomeData = outcomes.length > 0

  const plan = await getUserPlan()

  // Check if weekly banner should show (once per week, only if growth is positive)
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_weekly_insight_banner_week')
    .eq('id', user.id)
    .single()

  // Get current week string (format: yyyy-ww) - reuse existing `now` variable
  const year = now.getFullYear()
  const week = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  const currentWeek = `${year}-${week.toString().padStart(2, '0')}`
  
  const showWeeklyBanner = 
    outcomes.length >= 4 &&
    profile?.last_weekly_insight_banner_week !== currentWeek

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/app"
            className="text-sm text-[var(--primary)] hover:opacity-90 mb-4 inline-block"
          >
            ← Back to Today
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Your decision-making patterns</p>
          <div className="mt-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              <span className="font-semibold text-[var(--text)]">Decision Quality measures how accurately you predict the real consequences of your choices — and how often you follow through.</span>
            </p>
          </div>
        </div>

        {/* Judgment Profile Card - Pro only */}
        {judgmentProfile && (
          <div className="mb-8">
            <RequirePro
              isPro={plan.isPro}
              reason="judgment_profile"
              message="Unlock Pro to see your Judgment Profile and discover your decision-making style."
            >
              <JudgmentProfileCard profile={judgmentProfile} />
            </RequirePro>
          </div>
        )}

        {/* State of You Card (legacy, keep for now) */}
        {stateOfYou && (
          <div className="mb-8">
            <StateOfYouCard profile={stateOfYou} />
          </div>
        )}

        {/* Decision Trajectory Card - Pro only */}
        {trajectory && (
          <div className="mb-8">
            <RequirePro
              isPro={plan.isPro}
              reason="trajectory"
              message="Unlock Pro to see your Decision Trajectory and track momentum over time."
            >
              <TrajectoryCard
                trajectory={trajectory}
                decisionHealth={decisionHealth.healthScore}
              />
            </RequirePro>
          </div>
        )}

        {/* How Decylo Improves Your Thinking */}
        <div className="mb-8">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-[var(--text)] mb-4">How Decylo Improves Your Thinking</h2>
            <div className="space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
              <p>
                Decylo doesn't tell you what to choose. It trains you to model the future more accurately.
              </p>
              <p>
                Each decision you log becomes an experiment: you predict the impact, cost, and downside of your options — then later you record what actually happened.
              </p>
              <p className="font-semibold text-[var(--text)] mb-2">
                Decision Health measures how accurately you model the future and how consistently you execute on your own judgment.
              </p>
              <p>
                Over time, Decylo measures how closely your predictions match reality. This builds your Decision Health — a personal score of judgment quality.
              </p>
              <p className="font-semibold text-[var(--text)]">
                High Decision Health means: you estimate outcomes well, manage risk wisely, and consistently choose options that improve your life.
              </p>
              <p className="text-xs italic">
                In short: Decylo turns experience into judgment.
              </p>
            </div>
          </Card>
        </div>

        {/* Weekly Insight Banner (Gap 5) */}
        {showWeeklyBanner && (
          <WeeklyInsightBanner
            outcomes={outcomes}
            isVisible={true}
            onDismiss={async () => {
              // Mark banner as shown for this week
              await supabase
                .from('profiles')
                .update({ last_weekly_insight_banner_week: currentWeek })
                .eq('id', user.id)
            }}
          />
        )}

        {/* Decision Health Stats */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[var(--text-muted)] mb-2">Decision Health</h2>
          <p className="text-xs text-[var(--text-muted-2)] mb-4 italic">
            Decision Health measures how accurately you model the future and how consistently you execute on your own judgment.
          </p>
          
          {/* Health Score Card */}
          <div className="mb-4">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
                    Health Score
                  </p>
                  <div className="flex items-baseline gap-3">
                    <div className="text-4xl font-bold text-[var(--text)]">
                      {decisionHealth.healthScore}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">/ 100</div>
                    {healthTrend.trend !== 'stable' && (
                      <div
                        className={`text-sm font-semibold ${
                          healthTrend.trend === 'up'
                            ? 'text-[rgba(59,214,113,1)]'
                            : 'text-[rgba(255,93,93,1)]'
                        }`}
                      >
                        {healthTrend.trend === 'up' ? '↑' : '↓'} {Math.abs(healthTrend.change)}
                        {healthTrend.trend === 'up' ? ' vs last 7 days' : ' vs last 7 days'}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 h-3 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        decisionHealth.healthScore >= 70
                          ? 'bg-[rgba(59,214,113,1)]'
                          : decisionHealth.healthScore >= 50
                          ? 'bg-[rgba(255,176,32,1)]'
                          : 'bg-[rgba(255,93,93,1)]'
                      }`}
                      style={{ width: `${decisionHealth.healthScore}%` }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)]">Win Rate</span>
                      <p className="text-sm font-semibold mt-1">{decisionHealth.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Calibration Gap</span>
                      <p className="text-sm font-semibold mt-1">{decisionHealth.avgCalibrationGap.toFixed(1)}</p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Completion Rate</span>
                      <p className="text-sm font-semibold mt-1">{decisionHealth.completionRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Streak</span>
                      <p className="text-sm font-semibold mt-1">{decisionHealth.streakLength} days</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {plan.isPro ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* DQI */}
              <Card className="p-6">
                <div className="mb-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                    Decision Quality Index
                  </p>
                  <div className="text-3xl font-bold text-[var(--text)]">
                    {(dqi * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="mt-4 h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all"
                    style={{ width: `${dqi * 100}%` }}
                  />
                </div>
              </Card>

              {/* Growth */}
              <Card className="p-6">
                <div className="mb-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                    Growth Rate
                  </p>
                  <div
                    className={`text-3xl font-bold ${
                      growthRate > 0
                        ? 'text-[var(--text)]'
                        : growthRate < 0
                        ? 'text-[var(--text-muted)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {growthRate > 0 ? '+' : ''}
                    {(growthRate * 100).toFixed(1)}%
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-4">
                  {growthRate > 0
                    ? 'Improving over last 14 days'
                    : growthRate < 0
                    ? 'Declining over last 14 days'
                    : 'Stable'}
                </p>
              </Card>

              {/* Calibration */}
              <Card className="p-6">
                <div className="mb-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                    Confidence Calibration
                  </p>
                  <div className="text-3xl font-bold text-[var(--text)]">
                    {hasOutcomeData ? (calibration > 0 ? '+' : '') + calibration.toFixed(2) : '—'}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-4">
                  {hasOutcomeData
                    ? calibration > 0.3
                      ? 'Well-calibrated'
                      : calibration > 0
                      ? 'Moderately calibrated'
                      : 'Needs improvement'
                    : 'No data yet'}
                </p>
                {/* Calibration Trend Indicator */}
                {hasOutcomeData && decisionHealth.avgCalibrationGap > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Avg Gap</span>
                      <span className="font-semibold">
                        {decisionHealth.avgCalibrationGap.toFixed(1)} points
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {decisionHealth.avgCalibrationGap < 10
                        ? 'Low calibration gap'
                        : decisionHealth.avgCalibrationGap < 20
                        ? 'Moderate calibration gap'
                        : 'High calibration gap'}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <InsightsLock title="Decision Health">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* DQI */}
                <Card className="p-6">
                  <div className="mb-2">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                      Decision Quality Index
                    </p>
                    <div className="text-3xl font-bold text-[var(--text)]">
                      {(dqi * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] transition-all"
                      style={{ width: `${dqi * 100}%` }}
                    />
                  </div>
                </Card>

                {/* Growth */}
                <Card className="p-6">
                  <div className="mb-2">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                      Growth Rate
                    </p>
                    <div
                      className={`text-3xl font-bold ${
                        growthRate > 0
                          ? 'text-[var(--text)]'
                          : growthRate < 0
                          ? 'text-[var(--text-muted)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {growthRate > 0 ? '+' : ''}
                      {(growthRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-4">
                    {growthRate > 0
                      ? 'Improving over last 14 days'
                      : growthRate < 0
                      ? 'Declining over last 14 days'
                      : 'Stable'}
                  </p>
                </Card>

                {/* Calibration */}
                <Card className="p-6">
                  <div className="mb-2">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">
                      Confidence Calibration
                    </p>
                    <div className="text-3xl font-bold text-[var(--text)]">
                      {hasOutcomeData ? (calibration > 0 ? '+' : '') + calibration.toFixed(2) : '—'}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-4">
                    {hasOutcomeData
                      ? calibration > 0.3
                        ? 'Well-calibrated'
                        : calibration > 0
                        ? 'Moderately calibrated'
                        : 'Needs improvement'
                      : 'No data yet'}
                  </p>
                </Card>
              </div>
            </InsightsLock>
          )}
        </div>

        {/* Pattern Warnings (Challenging Insights) */}
        {patternWarnings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[var(--text-muted)] mb-4">
              Pattern Detection
            </h2>
            <div className="space-y-3">
              {patternWarnings.map((warning, idx) => (
                <PatternWarningCard key={idx} warning={warning} />
              ))}
            </div>
          </div>
        )}

        {/* Category Calibration Insights */}
        {categoryCalibrations.length > 0 && plan.isPro && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[var(--text-muted)] mb-4">
              Confidence Calibration by Category
            </h2>
            <div className="space-y-3">
              {categoryCalibrations.slice(0, 3).map((calibration) => (
                <CategoryCalibrationInsight key={calibration.category} calibration={calibration} />
              ))}
            </div>
          </div>
        )}

        {/* Trends */}
        {hasOutcomeData && (
          <div className="mb-8 space-y-6">
            {/* Outcome Over Time */}
            <Card className="p-6">
              <h3 className="text-base font-semibold mb-6">Outcome Over Time</h3>
              <div className="h-48 flex items-end gap-1">
                {trendData.map((day, idx) => {
                  const maxTotal = Math.max(...trendData.map((d) => d.total), 1)
                  const height = maxTotal > 0 ? (day.total / maxTotal) * 100 : 0
                  const winHeight =
                    day.total > 0 ? (day.wins / day.total) * height : 0
                  const neutralHeight =
                    day.total > 0 ? (day.neutrals / day.total) * height : 0
                  const lossHeight =
                    day.total > 0 ? (day.losses / day.total) * height : 0

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col justify-end group relative"
                      style={{ minHeight: '40px' }}
                    >
                      <div className="w-full flex flex-col-reverse gap-0.5">
                        {day.total > 0 && (
                          <>
                            {day.losses > 0 && (
                              <div
                                className="bg-[rgba(255,93,93,0.2)] rounded-t"
                                style={{ height: `${lossHeight}%` }}
                              />
                            )}
                            {day.neutrals > 0 && (
                              <div
                                className="bg-[rgba(255,176,32,0.2)] rounded-t"
                                style={{ height: `${neutralHeight}%` }}
                              />
                            )}
                            {day.wins > 0 && (
                              <div
                                className="bg-[rgba(59,214,113,0.2)] rounded-t"
                                style={{ height: `${winHeight}%` }}
                              />
                            )}
                          </>
                        )}
                        {day.total === 0 && (
                          <div className="h-full bg-[var(--surface-elevated)] rounded" />
                        )}
                      </div>
                      {idx % 7 === 0 && (
                        <div className="absolute -bottom-5 left-0 right-0 text-[10px] text-[var(--text-muted)] text-center">
                          {format(day.date, 'M/d')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[rgba(59,214,113,0.2)]" />
                  <span>Win</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[rgba(255,176,32,0.2)]" />
                  <span>Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[rgba(255,93,93,0.2)]" />
                  <span>Loss</span>
                </div>
              </div>
            </Card>

            {/* Confidence vs Outcome */}
            {confidenceVsOutcome.length > 0 && (
              <Card className="p-6">
                <h3 className="text-base font-semibold mb-6">Confidence vs Outcome</h3>
                <div className="h-64 flex items-end gap-1">
                  {Array.from({ length: 10 }, (_, i) => {
                    const confidenceRange = [i * 10, (i + 1) * 10]
                    const rangeData = confidenceVsOutcome.filter(
                      (d) => d.confidence >= confidenceRange[0] && d.confidence < confidenceRange[1]
                    )
                    const avgAccuracy =
                      rangeData.length > 0
                        ? rangeData.reduce((sum, d) => sum + d.accuracy, 0) / rangeData.length
                        : 0
                    const height = Math.abs(avgAccuracy) * 100

                    return (
                      <div key={i} className="flex-1 flex flex-col justify-center items-center">
                        <div
                          className={`w-full rounded-t transition-all ${
                            avgAccuracy > 0
                              ? 'bg-[rgba(59,214,113,0.2)]'
                              : avgAccuracy < 0
                              ? 'bg-[rgba(255,93,93,0.2)]'
                              : 'bg-[var(--surface-elevated)]'
                          }`}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                        <div className="mt-2 text-[10px] text-[var(--text-muted)] text-center">
                          {i * 10}%
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-[var(--text-muted)] text-center mt-4">
                  Average accuracy by confidence level
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Category Intelligence */}
        {hasCategoryData && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[var(--text-muted)] mb-4">
              Category Intelligence
            </h2>
            {plan.isPro ? (
              <Card className="p-6">
                <div className="space-y-4">
                  {Object.entries(categoryCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => {
                      const categoryDqi = categoryDQI[category] || 0.5
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{formatCategory(category as DecisionCategory)}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-[var(--text-muted)]">
                                {count} decision{count !== 1 ? 's' : ''}
                              </span>
                              <span className="text-sm font-semibold">
                                {(categoryDqi * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] transition-all"
                              style={{ width: `${categoryDqi * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </Card>
            ) : (
              <div className="relative">
                {/* Blurred content without duplicate overlay */}
                <div className="blur-sm select-none pointer-events-none">
                  <Card className="p-6">
                    <div className="space-y-4">
                      {Object.entries(categoryCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, count]) => {
                          const categoryDqi = categoryDQI[category] || 0.5
                          return (
                            <div key={category} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{formatCategory(category as DecisionCategory)}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {count} decision{count !== 1 ? 's' : ''}
                                  </span>
                                  <span className="text-sm font-semibold">
                                    {(categoryDqi * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--primary)] transition-all"
                                  style={{ width: `${categoryDqi * 100}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">Streak</p>
            <div className="text-2xl font-bold text-[var(--text)]">{streak}</div>
            <p className="text-xs text-[var(--text-muted)] mt-1">consecutive days</p>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
              Total Decisions
            </p>
            <div className="text-2xl font-bold text-[var(--text)]">{decisions.length}</div>
            <p className="text-xs text-[var(--text-muted)] mt-1">all time</p>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
              Outcomes Logged
            </p>
            <div className="text-2xl font-bold text-[var(--text)]">{outcomes.length}</div>
            <p className="text-xs text-[var(--text-muted)] mt-1">completed decisions</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
