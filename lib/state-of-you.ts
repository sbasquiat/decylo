import { Decision, Outcome } from './db/types'
import { calculateCategoryDQI, calculateConfidenceCalibration } from './insights'
import { calculateCategoryCalibration } from './bias-reduction'
import { formatCategory } from './category-format'
import { DecisionCategory } from './db/types'

export interface StateOfYouProfile {
  text: string
  strengths: string[]
  weaknesses: string[]
  growthAreas: string[]
}

/**
 * Generate "State of You" personalized interpretation
 * Analyzes user's decision patterns and generates human-readable insights
 */
export function generateStateOfYou(
  decisions: Decision[],
  outcomes: Outcome[]
): StateOfYouProfile | null {
  if (decisions.length === 0 || outcomes.length < 3) {
    return null // Need at least some data
  }

  const strengths: string[] = []
  const weaknesses: string[] = []
  const growthAreas: string[] = []

  // 1. Category Intelligence Analysis
  const categories = ['career', 'money', 'health', 'relationships', 'life_lifestyle', 'growth_learning', 'time_priorities', 'other'] as const
  const categoryDQI = categories.map((cat) => ({
    category: cat,
    dqi: calculateCategoryDQI(cat, decisions, outcomes),
  }))
  const categoryCalibration = calculateCategoryCalibration(decisions, outcomes)

  // Find strongest and weakest categories
  const sortedByDQI = [...categoryDQI].sort((a, b) => b.dqi - a.dqi)
  const strongestCategory = sortedByDQI[0]
  const weakestCategory = sortedByDQI[sortedByDQI.length - 1]

  if (strongestCategory && strongestCategory.dqi > 0.6) {
    strengths.push(formatCategory(strongestCategory.category as DecisionCategory))
  }

  if (weakestCategory && weakestCategory.dqi < 0.4) {
    weaknesses.push(formatCategory(weakestCategory.category as DecisionCategory))
  }

  // 2. Calibration Analysis
  const calibration = calculateConfidenceCalibration(decisions, outcomes)
  const calibrationGap = Math.abs(calibration)

  if (calibrationGap < 15) {
    strengths.push('well-calibrated confidence')
  } else if (calibrationGap > 30) {
    weaknesses.push('confidence calibration')
    growthAreas.push('being more realistic about your predictions')
  }

  // 3. Completion Rate Analysis
  const completedDecisions = decisions.filter((d) => d.outcome_id !== null).length
  const completionRate = (completedDecisions / decisions.length) * 100

  if (completionRate < 60) {
    weaknesses.push('follow-through')
    growthAreas.push('closing decision loops by logging outcomes')
  } else if (completionRate > 80) {
    strengths.push('consistent follow-through')
  }

  // 4. Category-specific calibration issues
  const problematicCategories = categoryCalibration.filter(
    (c) => c.avgCalibrationGap > 20 && c.sampleSize >= 3
  )

  if (problematicCategories.length > 0) {
    const categoryNames = problematicCategories
      .map((c) => formatCategory(c.category as DecisionCategory))
      .join(', ')
    growthAreas.push(`improving confidence accuracy in ${categoryNames}`)
  }

  // 5. Trend Analysis
  const recentOutcomes = outcomes.slice(0, Math.min(5, outcomes.length))
  const olderOutcomes = outcomes.slice(5, Math.min(10, outcomes.length))

  if (recentOutcomes.length >= 3 && olderOutcomes.length >= 3) {
    const recentWinRate =
      recentOutcomes.filter((o) => o.outcome_score_int === 1).length / recentOutcomes.length
    const olderWinRate =
      olderOutcomes.filter((o) => o.outcome_score_int === 1).length / olderOutcomes.length

    if (recentWinRate > olderWinRate + 0.1) {
      strengths.push('improving judgment')
    } else if (recentWinRate < olderWinRate - 0.1) {
      growthAreas.push('recent decision quality')
    }
  }

  // Generate text
  const parts: string[] = []

  // Opening
  if (strengths.length > 0) {
    parts.push(`You're strongest in ${strengths[0]} decisions`)
  } else {
    parts.push(`You're building your decision-making practice`)
  }

  // Weaknesses
  if (weaknesses.length > 0) {
    if (weaknesses.length === 1) {
      parts.push(`inconsistent in ${weaknesses[0]}`)
    } else {
      parts.push(`inconsistent in ${weaknesses.join(' and ')}`)
    }
  }

  // Follow-through
  if (completionRate < 60) {
    parts.push(`and your follow-through is your biggest drag on growth`)
  } else if (completionRate >= 60 && completionRate < 80) {
    parts.push(`and your follow-through could be more consistent`)
  }

  // Calibration
  if (calibrationGap > 30) {
    parts.push(`Your confidence is improving, but you still overestimate outcomes in long-term choices`)
  } else if (calibrationGap > 15) {
    parts.push(`Your confidence is improving, but there's room to be more realistic`)
  } else {
    parts.push(`Your confidence is well-calibrated`)
  }

  // Growth areas
  if (growthAreas.length > 0 && growthAreas.length <= 2) {
    parts.push(`Focus on ${growthAreas[0]}`)
  }

  const text = parts.join('. ') + '.'

  return {
    text,
    strengths,
    weaknesses,
    growthAreas,
  }
}

