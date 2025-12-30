/**
 * Immediate Insight Feedback (Gap 5)
 * 
 * Generate micro-feedback messages that appear immediately after an outcome is logged.
 * This provides immediate reinforcement and drives habit formation.
 */

import { Decision, Outcome } from './db/types'
import { calculateConfidenceCalibration, calculateJudgmentGrowth, getOutcomesInDateRange } from './insights'
import { subDays } from 'date-fns'

export interface InsightFeedback {
  message: string
  type: 'positive' | 'neutral' | 'warning'
}

/**
 * Generate immediate insight feedback after outcome is logged
 */
export function generateInsightFeedback(
  decisions: Decision[],
  outcomes: Outcome[],
  newOutcome: Outcome
): InsightFeedback | null {
  if (outcomes.length < 2) {
    // Need at least 2 outcomes to generate meaningful feedback
    return null
  }

  const now = new Date()
  const last7DaysStart = subDays(now, 7)
  const previous7DaysStart = subDays(now, 14)
  const previous7DaysEnd = subDays(now, 7)

  // Get recent outcomes (last 7 days)
  const recentOutcomes = getOutcomesInDateRange(outcomes, last7DaysStart, now)
  const previousOutcomes = getOutcomesInDateRange(
    outcomes,
    previous7DaysStart,
    previous7DaysEnd
  )

  // Calculate growth rate
  const growthRate = calculateJudgmentGrowth(recentOutcomes, previousOutcomes)

  // Calculate calibration
  const calibration = calculateConfidenceCalibration(decisions, outcomes)

  // Generate feedback based on patterns
  if (growthRate > 0.1) {
    return {
      message: `Your confidence has been trending ${Math.round(growthRate * 100)}% more accurate this week.`,
      type: 'positive',
    }
  }

  if (calibration > 0.3 && recentOutcomes.length >= 3) {
    return {
      message: `Your last ${recentOutcomes.length} decisions show strong calibration.`,
      type: 'positive',
    }
  }

  if (recentOutcomes.length >= 5) {
    const wins = recentOutcomes.filter((o) => o.outcome_score_int === 1).length
    const winRate = (wins / recentOutcomes.length) * 100

    if (winRate > 60) {
      return {
        message: `${Math.round(winRate)}% of your recent decisions turned out better than expected.`,
        type: 'positive',
      }
    }
  }

  // Check if calibration improved (Gap 7)
  if (recentOutcomes.length >= 3 && previousOutcomes.length >= 3) {
    const recentCalibration = calculateConfidenceCalibration(
      decisions.filter((d) => recentOutcomes.some((o) => o.decision_id === d.id)),
      recentOutcomes
    )
    const previousCalibration = calculateConfidenceCalibration(
      decisions.filter((d) => previousOutcomes.some((o) => o.decision_id === d.id)),
      previousOutcomes
    )

    if (recentCalibration > previousCalibration + 0.05) {
      return {
        message: 'Your calibration just improved.',
        type: 'positive',
      }
    }
  }

  // Default neutral feedback
  return {
    message: 'Outcome logged. Your judgment is improving.',
    type: 'neutral',
  }
}

