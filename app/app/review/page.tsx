import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/lib/subscription'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { PrimaryButton } from '@/components/ui/Button'
import Link from 'next/link'
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns'
import { Decision, Outcome } from '@/lib/db/types'
import { generateJudgmentProfile } from '@/lib/judgment-profile'
import { calculateDHI, calculateTMS } from '@/lib/decision-health-index'
import { generateWeeklyReviewInsights } from '@/lib/weekly-review'

export const metadata = {
  title: 'Weekly Review | Decylo',
  description: 'Your weekly decision review.',
}

export default async function WeeklyReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?returnTo=/app/review')
  }

  const plan = await getUserPlan()

  if (!plan.isPro) {
    redirect('/upgrade?reason=weekly_review_locked')
  }

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  // Get ALL user decisions and outcomes for judgment profile calculation
  const { data: allDecisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allDecisionIds = allDecisions?.map((d) => d.id) || []

  const { data: allOutcomes } = await supabase
    .from('outcomes')
    .select('*')
    .in('decision_id', allDecisionIds)

  // Get options for risk intelligence calculation
  const { data: allOptions } = await supabase
    .from('options')
    .select('id, decision_id, risk_int')
    .in('decision_id', allDecisionIds)

  const optionsMap = new Map<string, { risk_int: number }>()
  allOptions?.forEach((opt) => {
    optionsMap.set(opt.id, { risk_int: opt.risk_int })
  })

  // Get decisions and outcomes from this week only
  const weekDecisions = (allDecisions || []).filter((d) => {
    const created = new Date(d.created_at)
    return created >= weekStart && created <= weekEnd
  })

  const weekDecisionIds = weekDecisions.map((d) => d.id)
  const weekOutcomes = (allOutcomes || []).filter((o) => weekDecisionIds.includes(o.decision_id))

  const typedDecisions: Decision[] = allDecisions || []
  const typedOutcomes: Outcome[] = allOutcomes || []
  const typedWeekDecisions: Decision[] = weekDecisions as Decision[]
  const typedWeekOutcomes: Outcome[] = weekOutcomes as Outcome[]

  // Get Decision Health snapshots for DHI calculation
  const { data: healthSnapshots } = await supabase
    .from('decision_health_snapshots')
    .select('health_score, snapshot_date')
    .eq('user_id', user.id)
    .order('snapshot_date', { ascending: false })
    .limit(30)

  const currentDHI = healthSnapshots?.[0]?.health_score || 0
  const dhi14DaysAgo = healthSnapshots?.find((s) => {
    const date = new Date(s.snapshot_date)
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff >= 13 && daysDiff <= 15
  })?.health_score || null

  const dhi7DaysAgo = healthSnapshots?.find((s) => {
    const date = new Date(s.snapshot_date)
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff >= 6 && daysDiff <= 8
  })?.health_score || null

  // Calculate Judgment Profile (using all data for archetype)
  const judgmentProfile = generateJudgmentProfile(
    typedDecisions,
    typedOutcomes,
    currentDHI,
    dhi14DaysAgo,
    optionsMap
  )

  // Calculate Prediction Accuracy for this week only
  const { calculatePredictionAccuracy } = await import('@/lib/judgment-profile')
  // For weekly review, we want this week's accuracy, not averaged over 30
  let weekPredictionAccuracy = 0.5 // Default
  if (typedWeekOutcomes.length > 0) {
    const outcomeMap = new Map(typedWeekOutcomes.map((o) => [o.decision_id, o]))
    const accuracies: number[] = []
    for (const decision of typedWeekDecisions) {
      const outcome = outcomeMap.get(decision.id)
      if (!outcome || decision.confidence_int === null) continue
      const outcomeScore = outcome.outcome_score_int === 1 
        ? 1.0 
        : outcome.outcome_score_int === 0 
        ? 0.5 
        : 0.0
      const confidenceDecimal = decision.confidence_int / 100
      const accuracy = 1 - Math.abs(confidenceDecimal - outcomeScore)
      accuracies.push(accuracy)
    }
    if (accuracies.length > 0) {
      weekPredictionAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    }
  }
  const predictionAccuracyPercent = Math.round(weekPredictionAccuracy * 100)

  // Calculate calibration label
  const getCalibrationLabel = (pa: number): string => {
    if (pa >= 0.8) return 'highly accurate'
    if (pa >= 0.6) return 'well-calibrated'
    if (pa >= 0.4) return 'moderately calibrated'
    return 'poorly calibrated'
  }
  const calibrationLabel = getCalibrationLabel(weekPredictionAccuracy)

  // Calculate DHI and TMS
  const dhiComponents = {
    predictionAccuracy: judgmentProfile.predictionAccuracy,
    followThroughRate: judgmentProfile.followThroughRate,
    riskIntelligence: judgmentProfile.riskIntelligence,
    growthMomentum: judgmentProfile.growthMomentum,
  }
  const dhi = calculateDHI(dhiComponents)
  const tms = calculateTMS(currentDHI, dhi7DaysAgo)

  // Get best and worst decisions from this week
  const bestDecision = typedWeekOutcomes.length > 0
    ? typedWeekOutcomes.reduce((best, current) => {
        if (current.outcome_score_int > best.outcome_score_int) return current
        return best
      })
    : null

  const bestDecisionData = bestDecision
    ? typedWeekDecisions.find((d) => d.id === bestDecision.decision_id)
    : null

  const worstDecision = typedWeekOutcomes.length > 0
    ? typedWeekOutcomes.reduce((worst, current) => {
        if (current.outcome_score_int < worst.outcome_score_int) return current
        return worst
      })
    : null

  const worstDecisionData = worstDecision
    ? typedWeekDecisions.find((d) => d.id === worstDecision.decision_id)
    : null

  // Generate thinking upgrade
  const insights = generateWeeklyReviewInsights(typedWeekDecisions, typedWeekOutcomes)

  // Get learning rate label for Growth Momentum
  const getLearningRateLabel = (gm: number): string => {
    if (gm > 0.15) return 'accelerating'
    if (gm > 0.05) return 'steady'
    if (gm > -0.05) return 'stable'
    if (gm > -0.15) return 'slowing'
    return 'declining'
  }
  const learningRateLabel = getLearningRateLabel(judgmentProfile.growthMomentum)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] mb-2">
            Your Weekly Judgment Review
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            This is where experience becomes skill.
          </p>
        </div>

        {/* Section 1: Your Thinking Pattern */}
        <Card className="mb-6">
          <CardHeader title="Your Thinking Pattern" />
          <CardBody>
            <div className="space-y-4">
              <p className="text-sm text-[var(--text)] leading-relaxed">
                This week, your decisions were driven primarily by:
              </p>
              <div className="space-y-2">
                <p className="text-base font-semibold text-[var(--text)]">
                  {judgmentProfile.archetype}
                </p>
                {judgmentProfile.secondaryTrait && (
                  <p className="text-sm font-medium text-[var(--text-muted)]">
                    {judgmentProfile.secondaryTrait}
                  </p>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted-2)] mt-4">
                This pattern emerges from how you weigh risk, follow through on commitments, and update your beliefs based on results.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Section 2: Prediction Accuracy */}
        <Card className="mb-6">
          <CardHeader title="Prediction Accuracy" />
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-semibold text-[var(--text)] mb-2">
                  {predictionAccuracyPercent}%
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  How closely your confidence matched reality.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text)]">
                  You were <span className="font-semibold">{calibrationLabel}</span> this week.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Section 3: Best & Worst Decisions */}
        <Card className="mb-6">
          <CardHeader title="Best & Worst Decisions" />
          <CardBody>
            <div className="space-y-6">
              {bestDecisionData && bestDecision && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">
                    Best Decision
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)] mb-2">
                    {bestDecisionData.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    This decision produced the highest return relative to its predicted impact and risk.
                  </p>
                </div>
              )}

              {worstDecisionData && worstDecision && (
                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">
                    Worst Decision
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)] mb-2">
                    {worstDecisionData.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    This decision revealed the largest gap between expectation and reality.
                  </p>
                </div>
              )}

              {(!bestDecisionData || !worstDecisionData) && (
                <p className="text-sm text-[var(--text-muted)]">
                  Not enough outcomes logged this week to identify best and worst decisions.
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Section 4: Decision Health Movement */}
        <Card className="mb-6">
          <CardHeader title="Your Decision Health" />
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-semibold text-[var(--text)] mb-2">
                  {Math.round(dhi)}
                </p>
                <p className="text-sm font-medium text-[var(--text-muted)] mb-4 capitalize">
                  {tms.status === 'accelerating' ? 'Accelerating' : tms.status === 'declining' ? 'Declining' : 'Stable'}
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted-2)]">
                Decision Health measures how accurately you model the future and how consistently you execute on your judgment.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Section 5: Growth Momentum */}
        <Card className="mb-6">
          <CardHeader title="Growth Momentum" />
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-semibold text-[var(--text)] mb-2">
                  {judgmentProfile.growthMomentum > 0 ? '+' : ''}{judgmentProfile.growthMomentum.toFixed(2)}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  Your rate of cognitive improvement over the last 14 days.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text)]">
                  Your learning pace is <span className="font-semibold">{learningRateLabel}</span>.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Section 6: The One Upgrade */}
        <Card className="mb-6">
          <CardHeader title="Your One Thinking Upgrade" />
          <CardBody>
            <div className="space-y-4">
              <p className="text-sm text-[var(--text)] leading-relaxed">
                {insights.thinkingUpgrade}
              </p>
              <p className="text-xs text-[var(--text-muted-2)] mt-4">
                Apply this adjustment this week and watch your Decision Health respond.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Section 7: Close the Loop */}
        <div className="mb-8">
          <Link href="/app/new">
            <PrimaryButton className="w-full">
              Start This Week's Decisions
            </PrimaryButton>
          </Link>
          <p className="text-xs text-[var(--text-muted-2)] text-center mt-3">
            Decisions improve only when the loop is closed.
          </p>
        </div>
      </div>
    </div>
  )
}

