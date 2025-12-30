import { Decision, Outcome } from './db/types'

/**
 * Calculate confidence accuracy for a decision
 * confidence_accuracy = (confidence_int / 100) * outcome_score_int
 */
export function calculateConfidenceAccuracy(
  confidence: number | null,
  outcomeScore: number
): number {
  if (confidence === null) return 0
  return (confidence / 100) * outcomeScore
}

/**
 * Calculate outcome ratios (WinRate, NeutralRate, LossRate)
 */
export function calculateOutcomeRatios(outcomes: Outcome[]) {
  const total = outcomes.length
  if (total === 0) {
    return {
      winRate: 0,
      neutralRate: 0,
      lossRate: 0,
      wins: 0,
      neutrals: 0,
      losses: 0,
    }
  }

  const wins = outcomes.filter((o) => o.outcome_score_int === 1).length
  const neutrals = outcomes.filter((o) => o.outcome_score_int === 0).length
  const losses = outcomes.filter((o) => o.outcome_score_int === -1).length

  return {
    winRate: (wins / total) * 100,
    neutralRate: (neutrals / total) * 100,
    lossRate: (losses / total) * 100,
    wins,
    neutrals,
    losses,
    total,
  }
}

/**
 * Calculate Decision Quality Index (DQI)
 * DQI = (Sum(outcome_score_int) / TotalDecisions + 1) / 2
 * Normalized to 0-1 range
 */
export function calculateDQI(outcomes: Outcome[]): number {
  if (outcomes.length === 0) return 0.5 // Default to average if no outcomes

  const sum = outcomes.reduce((acc, o) => acc + o.outcome_score_int, 0)
  const total = outcomes.length
  const dqi = (sum / total + 1) / 2

  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, dqi))
}

/**
 * Calculate Judgment Growth Rate
 * GrowthRate = DQI_recent - DQI_previous
 */
export function calculateJudgmentGrowth(
  recentOutcomes: Outcome[],
  previousOutcomes: Outcome[]
): number {
  const recentDQI = calculateDQI(recentOutcomes)
  const previousDQI = calculateDQI(previousOutcomes)
  return recentDQI - previousDQI
}

/**
 * Calculate Confidence Calibration
 * Calibration = Average(confidence_accuracy)
 */
export function calculateConfidenceCalibration(
  decisions: Decision[],
  outcomes: Outcome[]
): number {
  if (decisions.length === 0 || outcomes.length === 0) return 0

  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  const accuracies: number[] = []

  for (const decision of decisions) {
    const outcome = outcomeMap.get(decision.id)
    if (outcome && decision.confidence_int !== null) {
      const accuracy = calculateConfidenceAccuracy(
        decision.confidence_int,
        outcome.outcome_score_int
      )
      accuracies.push(accuracy)
    }
  }

  if (accuracies.length === 0) return 0

  const sum = accuracies.reduce((acc, val) => acc + val, 0)
  return sum / accuracies.length
}

/**
 * Calculate Category Intelligence (CategoryDQI)
 * CategoryDQI = (Sum(outcome_score_int in category) / Count + 1) / 2
 */
export function calculateCategoryDQI(
  category: string,
  decisions: Decision[],
  outcomes: Outcome[]
): number {
  const categoryDecisions = decisions.filter((d) => d.category === category)
  if (categoryDecisions.length === 0) return 0.5

  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  const categoryOutcomes = categoryDecisions
    .map((d) => outcomeMap.get(d.id))
    .filter((o): o is Outcome => o !== undefined)

  return calculateDQI(categoryOutcomes)
}

/**
 * Get outcomes for a date range
 */
export function getOutcomesInDateRange(
  outcomes: Outcome[],
  startDate: Date,
  endDate: Date
): Outcome[] {
  return outcomes.filter((o) => {
    const completedAt = new Date(o.completed_at)
    return completedAt >= startDate && completedAt <= endDate
  })
}

/**
 * Convert outcome status to score (for backward compatibility)
 */
export function outcomeStatusToScore(status: 'won' | 'neutral' | 'lost'): number {
  switch (status) {
    case 'won':
      return 1
    case 'neutral':
      return 0
    case 'lost':
      return -1
    default:
      return 0
  }
}

/**
 * Convert outcome score to status (for display)
 */
export function outcomeScoreToStatus(score: number): 'won' | 'neutral' | 'lost' {
  if (score === 1) return 'won'
  if (score === -1) return 'lost'
  return 'neutral'
}

/**
 * Calculate Decision Health Score (0-100)
 * 
 * Based on:
 * - Win rate: % of decisions with outcome_result = "better" (0-100)
 * - Calibration gap: |confidence_at_decision - confidence_after| (lower is better)
 * - Completion rate: % of decisions with outcomes (closed loops) (0-100)
 * - Current streak length: normalized to 0-100
 * 
 * Formula:
 * health_score = (
 *   (win_rate * 0.35) +
 *   ((100 - avg_calibration_gap) * 0.25) +  // Invert gap so lower = better
 *   (completion_rate * 0.25) +
 *   (min(streak_length / 30, 1) * 100 * 0.15)  // Normalize streak (30 days = 100%)
 * )
 */
export function calculateDecisionHealth(
  decisions: Decision[],
  outcomes: Outcome[],
  streakLength: number
): {
  healthScore: number
  winRate: number
  avgCalibrationGap: number
  completionRate: number
  streakLength: number
} {
  // 1. Win Rate: % of decisions with outcome_result = "better" (outcome_score_int = 1)
  const totalOutcomes = outcomes.length
  const wins = outcomes.filter((o) => o.outcome_score_int === 1).length
  const winRate = totalOutcomes > 0 ? (wins / totalOutcomes) * 100 : 0

  // 2. Calibration Gap: |confidence_at_decision - confidence_after|
  // confidence_at_decision = decision.confidence_int
  // confidence_after = outcome.learning_confidence_int
  const calibrationGaps: number[] = []
  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  
  for (const decision of decisions) {
    const outcome = outcomeMap.get(decision.id)
    if (outcome && decision.confidence_int !== null && outcome.learning_confidence_int !== null) {
      const gap = Math.abs(decision.confidence_int - outcome.learning_confidence_int)
      calibrationGaps.push(gap)
    }
  }
  
  const avgCalibrationGap = calibrationGaps.length > 0
    ? calibrationGaps.reduce((sum, gap) => sum + gap, 0) / calibrationGaps.length
    : 0

  // 3. Completion Rate: % of decisions with outcomes (closed loops)
  const totalDecisions = decisions.length
  const completedDecisions = decisions.filter((d) => d.outcome_id !== null).length
  const completionRate = totalDecisions > 0 ? (completedDecisions / totalDecisions) * 100 : 0

  // 4. Streak Length: normalized to 0-100 (30 days = 100%)
  const normalizedStreak = Math.min(streakLength / 30, 1) * 100

  // Calculate health score (0-100)
  const healthScore = Math.round(
    (winRate * 0.35) +
    ((100 - Math.min(avgCalibrationGap, 100)) * 0.25) +  // Invert gap, cap at 100
    (completionRate * 0.25) +
    (normalizedStreak * 0.15)
  )

  // Clamp to 0-100
  return {
    healthScore: Math.max(0, Math.min(100, healthScore)),
    winRate: Math.round(winRate * 100) / 100,
    avgCalibrationGap: Math.round(avgCalibrationGap * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    streakLength,
  }
}

/**
 * Get Decision Health trend (current vs last 7 days)
 */
export function getDecisionHealthTrend(
  currentHealth: number,
  previousHealth: number | null
): {
  trend: 'up' | 'down' | 'stable'
  change: number
} {
  if (previousHealth === null) {
    return { trend: 'stable', change: 0 }
  }

  const change = currentHealth - previousHealth
  const threshold = 2 // Minimum change to be considered a trend

  if (change > threshold) {
    return { trend: 'up', change: Math.round(change) }
  } else if (change < -threshold) {
    return { trend: 'down', change: Math.round(change) }
  } else {
    return { trend: 'stable', change: 0 }
  }
}

