import { Decision, Outcome } from './db/types'
import { calculateDecisionHealth } from './insights'

export type DecisionMakerArchetype = 
  | 'Precision Thinker'
  | 'Conviction Driver'
  | 'Overthinker'
  | 'Impulse Reactor'

export type SecondaryTrait =
  | 'Asymmetric Hunter'
  | 'Safety Maximizer'
  | 'Compounding Operator'
  | 'Stagnation Trap'
  | null

export interface JudgmentProfile {
  // Core metrics
  predictionAccuracy: number // 0-1
  followThroughRate: number // 0-1
  riskIntelligence: number // -1 to 1
  growthMomentum: number // can be negative
  
  // Archetype
  archetype: DecisionMakerArchetype
  secondaryTrait: SecondaryTrait
  
  // Profile text
  profileText: string
  secondaryTraitText: string
  insightNarrative: string
}

/**
 * Calculate Prediction Accuracy (PA)
 * PA = 1 - |Confidence% - OutcomeScore|
 * Where Win = 1.0, Neutral = 0.5, Loss = 0.0
 * Confidence% = chosen confidence / 100
 */
export function calculatePredictionAccuracy(
  decisions: Decision[],
  outcomes: Outcome[]
): number {
  if (outcomes.length === 0) return 0.5 // Default to average

  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  
  const accuracies: number[] = []
  
  for (const decision of decisions) {
    const outcome = outcomeMap.get(decision.id)
    if (!outcome || decision.confidence_int === null) continue
    
    // Convert outcome score to 0-1 scale
    // Win (1) = 1.0, Neutral (0) = 0.5, Loss (-1) = 0.0
    const outcomeScore = outcome.outcome_score_int === 1 
      ? 1.0 
      : outcome.outcome_score_int === 0 
      ? 0.5 
      : 0.0
    
    // Confidence as decimal (0-1)
    const confidenceDecimal = decision.confidence_int / 100
    
    // PA = 1 - |Confidence% - OutcomeScore|
    const accuracy = 1 - Math.abs(confidenceDecimal - outcomeScore)
    accuracies.push(accuracy)
  }
  
  if (accuracies.length === 0) return 0.5
  
  // Average of last 30 decisions
  const recentAccuracies = accuracies.slice(-30)
  return recentAccuracies.reduce((sum, acc) => sum + acc, 0) / recentAccuracies.length
}

/**
 * Calculate Follow-Through Rate (FT)
 * FT = Completed decisions / Total decisions
 */
export function calculateFollowThroughRate(decisions: Decision[]): number {
  if (decisions.length === 0) return 0
  
  const completed = decisions.filter((d) => d.outcome_id !== null).length
  return completed / decisions.length
}

/**
 * Calculate Risk Intelligence (RI)
 * Compare predicted risk vs actual outcome
 * 
 * Risk Given | Outcome | Score
 * Low + Win  | +1.0
 * Low + Loss | -1.0
 * High + Win | +0.5
 * High + Loss| +0.2
 */
export function calculateRiskIntelligence(
  decisions: Decision[],
  outcomes: Outcome[]
): number {
  if (outcomes.length === 0) return 0

  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  
  // Get options to find risk scores
  // For now, we'll use decision-level risk if available, or estimate from options
  // Note: We need to fetch options separately, but for now we'll use a simplified approach
  // Risk is considered "Low" if < 5, "High" if >= 5
  
  const scores: number[] = []
  
  for (const decision of decisions) {
    const outcome = outcomeMap.get(decision.id)
    if (!outcome) continue
    
    // For now, we'll need to get the chosen option's risk score
    // This is a simplified version - in production, you'd fetch options
    // For now, assume we can't get risk directly from decision
    // We'll need to modify this to fetch options
  }
  
  // Simplified: Use average risk from options if available
  // For now, return 0 as placeholder - will need to fetch options
  return 0
}

/**
 * Calculate Risk Intelligence with options data
 */
export function calculateRiskIntelligenceWithOptions(
  decisions: Decision[],
  outcomes: Outcome[],
  optionsMap: Map<string, { risk_int: number }>
): number {
  if (outcomes.length === 0) return 0

  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  
  const scores: number[] = []
  
  for (const decision of decisions) {
    const outcome = outcomeMap.get(decision.id)
    if (!outcome || !decision.chosen_option_id) continue
    
    const option = optionsMap.get(decision.chosen_option_id)
    if (!option) continue
    
    const riskLevel = option.risk_int < 5 ? 'low' : 'high'
    const outcomeType = outcome.outcome_score_int === 1 ? 'win' : outcome.outcome_score_int === -1 ? 'loss' : 'neutral'
    
    let score = 0
    if (riskLevel === 'low' && outcomeType === 'win') {
      score = 1.0
    } else if (riskLevel === 'low' && outcomeType === 'loss') {
      score = -1.0
    } else if (riskLevel === 'high' && outcomeType === 'win') {
      score = 0.5
    } else if (riskLevel === 'high' && outcomeType === 'loss') {
      score = 0.2
    }
    
    scores.push(score)
  }
  
  if (scores.length === 0) return 0
  
  // Rolling average of last 20 decisions
  const recentScores = scores.slice(-20)
  return recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
}

/**
 * Calculate Growth Momentum (GM)
 * GM = (TodayHealth - Health14DaysAgo) / 14
 */
export function calculateGrowthMomentum(
  currentHealth: number,
  health14DaysAgo: number | null
): number {
  if (health14DaysAgo === null) return 0
  return (currentHealth - health14DaysAgo) / 14
}

/**
 * Determine Decision Maker Archetype (Primary)
 * PA ≥ 0.70 and FT ≥ 0.70 = Precision Thinker
 * PA < 0.70 and FT ≥ 0.70 = Conviction Driver
 * PA ≥ 0.70 and FT < 0.70 = Overthinker
 * PA < 0.70 and FT < 0.70 = Impulse Reactor
 */
export function determineArchetype(
  predictionAccuracy: number,
  followThroughRate: number
): DecisionMakerArchetype {
  const highPA = predictionAccuracy >= 0.70
  const highFT = followThroughRate >= 0.70
  
  if (highPA && highFT) {
    return 'Precision Thinker'
  } else if (!highPA && highFT) {
    return 'Conviction Driver'
  } else if (highPA && !highFT) {
    return 'Overthinker'
  } else {
    return 'Impulse Reactor'
  }
}

/**
 * Determine Secondary Trait
 */
export function determineSecondaryTrait(
  riskIntelligence: number,
  growthMomentum: number
): SecondaryTrait {
  if (riskIntelligence >= 0.60) {
    return 'Asymmetric Hunter'
  } else if (riskIntelligence <= 0.40) {
    return 'Safety Maximizer'
  } else if (growthMomentum > 0.15) {
    return 'Compounding Operator'
  } else if (growthMomentum < -0.10) {
    return 'Stagnation Trap'
  }
  return null
}

/**
 * Generate insight narrative based on metrics
 */
export function generateInsightNarrative(
  predictionAccuracy: number,
  followThroughRate: number,
  riskIntelligence: number,
  growthMomentum: number,
  archetype: DecisionMakerArchetype,
  secondaryTrait: SecondaryTrait
): string {
  const narratives: string[] = []
  
  // Primary archetype insights
  if (predictionAccuracy >= 0.70 && followThroughRate < 0.70) {
    narratives.push('You think clearly but struggle with consistent execution.')
    narratives.push('Your biggest leverage is follow-through discipline.')
  } else if (predictionAccuracy < 0.70 && followThroughRate >= 0.70) {
    narratives.push('You act decisively but your predictions need refinement.')
    narratives.push('Slowing down your initial judgment will improve outcomes.')
  } else if (predictionAccuracy >= 0.70 && followThroughRate >= 0.70) {
    narratives.push('You predict outcomes accurately and consistently follow through.')
    if (growthMomentum > 0.15) {
      narratives.push('Your recent decisions are compounding your judgment at an above-average rate.')
    } else {
      narratives.push('Your judgment is stable and reliable.')
    }
  } else {
    narratives.push('You need to improve both prediction accuracy and follow-through.')
    narratives.push('Start by logging outcomes more consistently.')
  }
  
  // Secondary trait insights
  if (riskIntelligence >= 0.60) {
    narratives.push('You assess downside accurately and avoid unnecessary damage.')
  }
  
  if (growthMomentum < -0.10) {
    narratives.push('Your recent decisions are degrading your long-term judgment.')
    narratives.push('Focus on fewer, higher-impact choices.')
  }
  
  return narratives.join(' ')
}

/**
 * Get archetype description
 */
export function getArchetypeDescription(archetype: DecisionMakerArchetype): string {
  switch (archetype) {
    case 'Precision Thinker':
      return 'Rare, elite judgment'
    case 'Conviction Driver':
      return 'Acts fast, needs calibration'
    case 'Overthinker':
      return 'Thinks well, fails to execute'
    case 'Impulse Reactor':
      return 'Inconsistent & impulsive'
  }
}

/**
 * Generate complete Judgment Profile
 */
export function generateJudgmentProfile(
  decisions: Decision[],
  outcomes: Outcome[],
  currentHealth: number,
  health14DaysAgo: number | null,
  optionsMap?: Map<string, { risk_int: number }>
): JudgmentProfile {
  const predictionAccuracy = calculatePredictionAccuracy(decisions, outcomes)
  const followThroughRate = calculateFollowThroughRate(decisions)
  const riskIntelligence = optionsMap && optionsMap.size > 0
    ? calculateRiskIntelligenceWithOptions(decisions, outcomes, optionsMap)
    : calculateRiskIntelligence(decisions, outcomes)
  const growthMomentum = calculateGrowthMomentum(currentHealth, health14DaysAgo)
  
  const archetype = determineArchetype(predictionAccuracy, followThroughRate)
  const secondaryTrait = determineSecondaryTrait(riskIntelligence, growthMomentum)
  const insightNarrative = generateInsightNarrative(
    predictionAccuracy,
    followThroughRate,
    riskIntelligence,
    growthMomentum,
    archetype,
    secondaryTrait
  )
  
  return {
    predictionAccuracy,
    followThroughRate,
    riskIntelligence,
    growthMomentum,
    archetype,
    secondaryTrait,
    profileText: `Judgment Profile: ${archetype}`,
    secondaryTraitText: secondaryTrait ? `Secondary trait: ${secondaryTrait}` : '',
    insightNarrative,
  }
}

