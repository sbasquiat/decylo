/**
 * Bias Reduction Engine
 * 
 * Core Principle: You don't fight bias with advice.
 * You fight bias with comparison.
 * 
 * Decylo's edge is that it lets people compare:
 * - what they thought
 * - what actually happened
 * - how often they're wrong
 * - in what areas they're weak
 */

import { Decision, Outcome, DecisionCategory } from './db/types'
import { formatCategory } from './category-format'

export interface CategoryCalibration {
  category: string
  avgCalibrationGap: number
  overestimateRate: number // % of decisions where confidence > actual outcome
  underestimateRate: number // % of decisions where confidence < actual outcome
  sampleSize: number
}

export interface PatternWarning {
  type: 'category_failure' | 'high_confidence_failure' | 'repeating_pattern'
  severity: 'low' | 'medium' | 'high'
  message: string
  data: {
    category?: string
    confidenceThreshold?: number
    failureCount?: number
    pattern?: string
  }
}

/**
 * Calculate category-specific calibration gaps
 * Returns insights like: "You tend to overestimate outcomes in Career decisions by ~18%"
 */
export function calculateCategoryCalibration(
  decisions: Decision[],
  outcomes: Outcome[]
): CategoryCalibration[] {
  const categoryMap = new Map<string, { decisions: Decision[]; outcomes: Outcome[] }>()
  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))

  // Group decisions and outcomes by category
  for (const decision of decisions) {
    if (!categoryMap.has(decision.category)) {
      categoryMap.set(decision.category, { decisions: [], outcomes: [] })
    }
    const categoryData = categoryMap.get(decision.category)!
    categoryData.decisions.push(decision)
    const outcome = outcomeMap.get(decision.id)
    if (outcome) {
      categoryData.outcomes.push(outcome)
    }
  }

  const calibrations: CategoryCalibration[] = []

  for (const [category, data] of Array.from(categoryMap.entries())) {
    if (data.outcomes.length < 3) continue // Need at least 3 outcomes for meaningful insight

    const gaps: number[] = []
    let overestimates = 0
    let underestimates = 0

    for (const decision of data.decisions) {
      const outcome = outcomeMap.get(decision.id)
      if (!outcome || decision.confidence_int === null || outcome.learning_confidence_int === null) {
        continue
      }

      const gap = decision.confidence_int - outcome.learning_confidence_int
      gaps.push(Math.abs(gap))

      // Overestimate: confidence at decision > confidence after (thought it would go better)
      if (gap > 5) {
        overestimates++
      }
      // Underestimate: confidence at decision < confidence after (thought it would go worse)
      else if (gap < -5) {
        underestimates++
      }
    }

    if (gaps.length === 0) continue

    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    const total = gaps.length

    calibrations.push({
      category,
      avgCalibrationGap: Math.round(avgGap * 10) / 10,
      overestimateRate: Math.round((overestimates / total) * 100),
      underestimateRate: Math.round((underestimates / total) * 100),
      sampleSize: total,
    })
  }

  return calibrations.sort((a, b) => b.avgCalibrationGap - a.avgCalibrationGap)
}

/**
 * Detect patterns that indicate bias or poor decision-making
 * Returns warnings like: "Most of your negative outcomes come from Health decisions made under high confidence"
 */
export function detectPatternWarnings(
  decisions: Decision[],
  outcomes: Outcome[]
): PatternWarning[] {
  const warnings: PatternWarning[] = []
  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))

  // 1. Category failure pattern
  const categoryFailures: Record<string, { total: number; failures: number }> = {}
  for (const decision of decisions) {
    const outcome = outcomeMap.get(decision.id)
    if (!outcome) continue

    if (!categoryFailures[decision.category]) {
      categoryFailures[decision.category] = { total: 0, failures: 0 }
    }
    categoryFailures[decision.category].total++
    if (outcome.outcome_score_int === -1) {
      categoryFailures[decision.category].failures++
    }
  }

  for (const [category, data] of Object.entries(categoryFailures)) {
    if (data.total >= 5 && data.failures / data.total > 0.4) {
      // More than 40% failure rate in a category
      const failureRate = Math.round((data.failures / data.total) * 100)
      warnings.push({
        type: 'category_failure',
        severity: failureRate > 60 ? 'high' : failureRate > 50 ? 'medium' : 'low',
        message: `Most of your negative outcomes come from ${category} decisions.`,
        data: {
          category,
          failureCount: data.failures,
        },
      })
    }
  }

  // 2. High-confidence failure pattern
  const highConfidenceDecisions = decisions.filter(
    (d) => d.confidence_int !== null && d.confidence_int >= 80
  )
  const highConfidenceOutcomes = highConfidenceDecisions
    .map((d) => outcomeMap.get(d.id))
    .filter((o): o is Outcome => o !== undefined)

  if (highConfidenceOutcomes.length >= 5) {
    const failures = highConfidenceOutcomes.filter((o) => o.outcome_score_int === -1).length
    const failureRate = failures / highConfidenceOutcomes.length

    if (failureRate > 0.4) {
      // More than 40% of high-confidence decisions fail
      warnings.push({
        type: 'high_confidence_failure',
        severity: failureRate > 0.6 ? 'high' : 'medium',
        message: `Your last ${highConfidenceOutcomes.length} high-confidence decisions (80%+) ended worse than expected ${Math.round(failureRate * 100)}% of the time.`,
        data: {
          confidenceThreshold: 80,
          failureCount: failures,
        },
      })
    }
  }

  // 3. Category-specific high-confidence failures
  const categoryHighConfidence: Record<string, { decisions: Decision[]; outcomes: Outcome[] }> = {}
  for (const decision of highConfidenceDecisions) {
    const outcome = outcomeMap.get(decision.id)
    if (!outcome) continue

    if (!categoryHighConfidence[decision.category]) {
      categoryHighConfidence[decision.category] = { decisions: [], outcomes: [] }
    }
    categoryHighConfidence[decision.category].decisions.push(decision)
    categoryHighConfidence[decision.category].outcomes.push(outcome)
  }

  for (const [category, data] of Object.entries(categoryHighConfidence)) {
    if (data.outcomes.length >= 5) {
      const failures = data.outcomes.filter((o) => o.outcome_score_int === -1).length
      const failureRate = failures / data.outcomes.length

      if (failureRate > 0.5) {
        warnings.push({
          type: 'high_confidence_failure',
          severity: 'high',
          message: `Your last ${data.outcomes.length} high-confidence decisions in ${category} ended worse than expected ${Math.round(failureRate * 100)}% of the time.`,
          data: {
            category,
            confidenceThreshold: 80,
            failureCount: failures,
          },
        })
      }
    }
  }

  return warnings
}

/**
 * Format category calibration message
 * Example: "You tend to overestimate outcomes in Career decisions by ~18%"
 */
export function formatCategoryCalibrationMessage(calibration: CategoryCalibration): string {
  const { category, avgCalibrationGap, overestimateRate, underestimateRate } = calibration
  const categoryLabel = formatCategory(category as DecisionCategory)

  if (overestimateRate > 50) {
    return `You tend to overestimate outcomes in ${categoryLabel} decisions by ~${Math.round(avgCalibrationGap)}%.`
  } else if (underestimateRate > 50) {
    return `You tend to underestimate outcomes in ${categoryLabel} decisions by ~${Math.round(avgCalibrationGap)}%.`
  } else {
    return `Your confidence calibration in ${categoryLabel} decisions has an average gap of ~${Math.round(avgCalibrationGap)}%.`
  }
}

/**
 * Format pattern warning message
 */
export function formatPatternWarningMessage(warning: PatternWarning): string {
  return warning.message
}

