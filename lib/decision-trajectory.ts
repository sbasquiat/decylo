import { Decision, Outcome } from './db/types'
import { DecisionCategory } from './db/types'
import { calculateDecisionHealth, getOutcomesInDateRange } from './insights'
import { calculatePredictionAccuracy, calculateFollowThroughRate, calculateRiskIntelligenceWithOptions } from './judgment-profile'
import { calculateDHI, calculateTMS } from './decision-health-index'
import { formatCategory } from './category-format'
import { subDays } from 'date-fns'

export interface DecisionTrajectory {
  // Decision Health Index (DHI)
  dhi: {
    score: number // 0-100
    components: {
      predictionAccuracy: number
      followThroughRate: number
      riskIntelligence: number
      growthMomentum: number
    }
  }
  
  // Trajectory Momentum Score (TMS)
  tms: {
    score: number
    status: 'accelerating' | 'stable' | 'declining'
    message: string
  }
  
  // Decision Health Trend (legacy, keep for compatibility)
  healthTrend: {
    slope: number // per day
    message: string
    isImproving: boolean
  }
  
  // Domain Strength Index
  domainStrengths: Array<{
    category: DecisionCategory
    score: number // 0-100
    winRate: number
    followThrough: number
    predictionAccuracy: number
  }>
  
  // Prediction Calibration Curve
  calibrationCurve: Array<{
    confidenceBucket: number // 20, 40, 60, 80, 100
    predictedFrequency: number // 0-1
    actualFrequency: number // 0-1
    gap: number
    calibrationError: number // |confidence - actual|
  }>
}

/**
 * Calculate Decision Health Trend using linear regression
 * Trend = linear regression slope over 30 days
 */
export function calculateHealthTrend(
  healthSnapshots: Array<{ date: Date; health: number }>
): { slope: number; message: string; isImproving: boolean } {
  if (healthSnapshots.length < 2) {
    return {
      slope: 0,
      message: 'Not enough data to calculate trend',
      isImproving: false,
    }
  }
  
  // Simple linear regression: y = mx + b
  // m = slope
  const n = healthSnapshots.length
  const sumX = healthSnapshots.reduce((sum, _, i) => sum + i, 0)
  const sumY = healthSnapshots.reduce((sum, s) => sum + s.health, 0)
  const sumXY = healthSnapshots.reduce((sum, s, i) => sum + i * s.health, 0)
  const sumX2 = healthSnapshots.reduce((sum, _, i) => sum + i * i, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  const isImproving = slope > 0
  const message = isImproving
    ? `Judgment is steadily improving (+${slope.toFixed(2)} per day)`
    : slope < 0
    ? `Judgment is declining (${slope.toFixed(2)} per day)`
    : 'Judgment is stable'
  
  return { slope, message, isImproving }
}

/**
 * Calculate Domain Strength Index
 * DomainScore = 0.40 × WinRate + 0.30 × FT + 0.30 × PA
 * Scaled 0–100
 */
export function calculateDomainStrengthIndex(
  category: DecisionCategory,
  decisions: Decision[],
  outcomes: Outcome[]
): {
  score: number // 0-100
  winRate: number
  followThrough: number
  predictionAccuracy: number
} {
  const categoryDecisions = decisions.filter((d) => d.category === category)
  if (categoryDecisions.length === 0) {
    return { score: 0, winRate: 0, followThrough: 0, predictionAccuracy: 0 }
  }
  
  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  const categoryOutcomes = categoryDecisions
    .map((d) => outcomeMap.get(d.id))
    .filter((o): o is Outcome => o !== undefined)
  
  // Win Rate
  const wins = categoryOutcomes.filter((o) => o.outcome_score_int === 1).length
  const winRate = categoryOutcomes.length > 0 ? wins / categoryOutcomes.length : 0
  
  // Follow-Through
  const followThrough = calculateFollowThroughRate(categoryDecisions)
  
  // Prediction Accuracy
  const predictionAccuracy = calculatePredictionAccuracy(categoryDecisions, categoryOutcomes)
  
  // Domain Score: 0.40 × WinRate + 0.30 × FT + 0.30 × PA
  const scoreRaw = (winRate * 0.40) + (followThrough * 0.30) + (predictionAccuracy * 0.30)
  
  // Scale to 0-100
  const score = Math.round(scoreRaw * 100)
  
  return { score, winRate, followThrough, predictionAccuracy }
}

/**
 * Calculate Prediction Calibration Curve
 * Group decisions by confidence bucket and compare predicted vs actual
 * 
 * CalibrationError = average(|confidence − actual|)
 */
export function calculateCalibrationCurve(
  decisions: Decision[],
  outcomes: Outcome[]
): Array<{
  confidenceBucket: number
  predictedFrequency: number
  actualFrequency: number
  gap: number
  calibrationError: number
}> {
  const buckets = [20, 40, 60, 80, 100]
  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  
  return buckets.map((bucket) => {
    // Decisions in this confidence bucket (bucket-20 to bucket)
    const bucketDecisions = decisions.filter((d) => {
      if (d.confidence_int === null) return false
      const lowerBound = bucket === 20 ? 0 : bucket - 20
      return d.confidence_int >= lowerBound && d.confidence_int <= bucket
    })
    
    if (bucketDecisions.length === 0) {
      return {
        confidenceBucket: bucket,
        predictedFrequency: 0,
        actualFrequency: 0,
        gap: 0,
        calibrationError: 0,
      }
    }
    
    // Predicted frequency = confidence as decimal
    const predictedFrequency = bucket / 100
    
    // Actual frequency = % of outcomes that were wins
    const bucketOutcomes = bucketDecisions
      .map((d) => outcomeMap.get(d.id))
      .filter((o): o is Outcome => o !== undefined)
    
    const wins = bucketOutcomes.filter((o) => o.outcome_score_int === 1).length
    const actualFrequency = bucketOutcomes.length > 0 ? wins / bucketOutcomes.length : 0
    
    const gap = Math.abs(predictedFrequency - actualFrequency)
    
    // CalibrationError = average(|confidence − actual|) for this bucket
    const errors = bucketDecisions
      .map((d) => {
        const outcome = outcomeMap.get(d.id)
        if (!outcome || d.confidence_int === null) return null
        const confidenceDecimal = d.confidence_int / 100
        const actualDecimal = outcome.outcome_score_int === 1 ? 1 : outcome.outcome_score_int === 0 ? 0.5 : 0
        return Math.abs(confidenceDecimal - actualDecimal)
      })
      .filter((e): e is number => e !== null)
    
    const calibrationError = errors.length > 0 
      ? errors.reduce((sum, e) => sum + e, 0) / errors.length 
      : 0
    
    return {
      confidenceBucket: bucket,
      predictedFrequency,
      actualFrequency,
      gap,
      calibrationError,
    }
  })
}

/**
 * Calculate Momentum Index
 * Momentum = (Last 7 days avg Decision Health) - (Previous 7 days avg)
 */
export function calculateMomentumIndex(
  currentHealth: number,
  health7DaysAgo: number | null,
  health14DaysAgo: number | null
): { value: number; status: 'accelerating' | 'stable' | 'slowing'; message: string } {
  if (health7DaysAgo === null || health14DaysAgo === null) {
    return {
      value: 0,
      status: 'stable',
      message: 'Not enough data to calculate momentum',
    }
  }
  
  const last7DaysAvg = (currentHealth + health7DaysAgo) / 2
  const previous7DaysAvg = (health7DaysAgo + health14DaysAgo) / 2
  
  const momentum = last7DaysAvg - previous7DaysAvg
  
  let status: 'accelerating' | 'stable' | 'slowing'
  let message: string
  
  if (momentum > 2) {
    status = 'accelerating'
    message = `Growth speed: Accelerating (+${momentum.toFixed(1)})`
  } else if (momentum < -2) {
    status = 'slowing'
    message = `Growth speed: Slowing (${momentum.toFixed(1)})`
  } else {
    status = 'stable'
    message = 'Growth speed: Stable'
  }
  
  return { value: momentum, status, message }
}

/**
 * Generate complete Decision Trajectory
 */
export function generateDecisionTrajectory(
  decisions: Decision[],
  outcomes: Outcome[],
  currentHealth: number,
  health7DaysAgo: number | null,
  health14DaysAgo: number | null,
  health30DaysAgo: number | null,
  healthSnapshots: Array<{ date: Date; health: number }>,
  optionsMap?: Map<string, { risk_int: number }>
): DecisionTrajectory | null {
  if (outcomes.length < 5) {
    return null // Need at least 5 outcomes for meaningful trajectory
  }
  
  // Calculate core metrics for DHI
  const predictionAccuracy = calculatePredictionAccuracy(decisions, outcomes)
  const followThroughRate = calculateFollowThroughRate(decisions)
  const riskIntelligence = optionsMap && optionsMap.size > 0
    ? calculateRiskIntelligenceWithOptions(decisions, outcomes, optionsMap)
    : 0
  
  // Calculate Growth Momentum (GM)
  const growthMomentum = health14DaysAgo !== null
    ? (currentHealth - health14DaysAgo) / 14
    : 0
  
  // Calculate Decision Health Index (DHI)
  const dhi = calculateDHI({
    predictionAccuracy,
    followThroughRate,
    riskIntelligence,
    growthMomentum,
  })
  
  // Calculate Trajectory Momentum Score (TMS)
  const dhiLast7Days = health7DaysAgo !== null ? currentHealth : null
  const dhiPrev7Days = health14DaysAgo !== null && health7DaysAgo !== null
    ? (health7DaysAgo + health14DaysAgo) / 2
    : null
  
  const tms = calculateTMS(dhiLast7Days, dhiPrev7Days)
  
  // Health Trend (30 days) - legacy, keep for compatibility
  const healthTrend = calculateHealthTrend(healthSnapshots)
  
  // Domain Strength Index
  const categories: DecisionCategory[] = [
    'career',
    'money',
    'health',
    'relationships',
    'life_lifestyle',
    'growth_learning',
    'time_priorities',
    'other',
  ]
  
  const domainStrengths = categories
    .map((category) => ({
      category,
      ...calculateDomainStrengthIndex(category, decisions, outcomes),
    }))
    .filter((d) => d.score > 0) // Only show domains with data
    .sort((a, b) => b.score - a.score)
  
  // Calibration Curve
  const calibrationCurve = calculateCalibrationCurve(decisions, outcomes)
  
  return {
    dhi: {
      score: dhi,
      components: {
        predictionAccuracy,
        followThroughRate,
        riskIntelligence,
        growthMomentum,
      },
    },
    tms: {
      score: tms.score,
      status: tms.status,
      message: tms.status === 'accelerating'
        ? `Accelerating (+${tms.score.toFixed(1)})`
        : tms.status === 'declining'
        ? `Declining (${tms.score.toFixed(1)})`
        : 'Stable',
    },
    healthTrend,
    domainStrengths,
    calibrationCurve,
  }
}

