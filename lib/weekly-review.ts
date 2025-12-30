import { Decision, Outcome } from './db/types'

export interface WeeklyReviewInsights {
  cognitivePattern: string
  biggestMiscalibration: {
    decision: Decision | null
    outcome: Outcome | null
    description: string
  }
  bestDecision: {
    decision: Decision | null
    outcome: Outcome | null
    description: string
  }
  worstDecision: {
    decision: Decision | null
    outcome: Outcome | null
    description: string
  }
  thinkingUpgrade: string
}

/**
 * Generate weekly review insights
 */
export function generateWeeklyReviewInsights(
  decisions: Decision[],
  outcomes: Outcome[]
): WeeklyReviewInsights {
  const outcomeMap = new Map(outcomes.map((o) => [o.decision_id, o]))
  
  // Calculate cognitive pattern
  const cognitivePattern = generateCognitivePattern(decisions, outcomes, outcomeMap)
  
  // Find biggest miscalibration (largest confidence-outcome gap)
  const biggestMiscalibration = findBiggestMiscalibration(decisions, outcomes, outcomeMap)
  
  // Find best decision (highest outcome score)
  const bestDecision = findBestDecision(decisions, outcomes, outcomeMap)
  
  // Find worst decision (lowest outcome score)
  const worstDecision = findWorstDecision(decisions, outcomes, outcomeMap)
  
  // Generate thinking upgrade
  const thinkingUpgrade = generateThinkingUpgrade(
    decisions,
    outcomes,
    outcomeMap,
    biggestMiscalibration,
    worstDecision
  )
  
  return {
    cognitivePattern,
    biggestMiscalibration,
    bestDecision,
    worstDecision,
    thinkingUpgrade,
  }
}

function generateCognitivePattern(
  decisions: Decision[],
  outcomes: Outcome[],
  outcomeMap: Map<string, Outcome>
): string {
  if (decisions.length === 0) {
    return 'Not enough data to identify patterns yet. Keep logging decisions.'
  }
  
  const patterns: string[] = []
  
  // Confidence pattern
  const avgConfidence = decisions
    .filter((d) => d.confidence_int !== null)
    .reduce((sum, d) => sum + (d.confidence_int || 0), 0) / 
    decisions.filter((d) => d.confidence_int !== null).length
  
  if (avgConfidence >= 70) {
    patterns.push('You tend to be highly confident in your decisions')
  } else if (avgConfidence <= 40) {
    patterns.push('You tend to be cautious in your decisions')
  } else {
    patterns.push('You show balanced confidence in your decisions')
  }
  
  // Follow-through pattern
  const completionRate = outcomes.length / decisions.length
  if (completionRate >= 0.8) {
    patterns.push('and you consistently follow through on your commitments')
  } else if (completionRate < 0.5) {
    patterns.push('but you struggle to complete the feedback loop')
  } else {
    patterns.push('and you usually complete the feedback loop')
  }
  
  // Category pattern
  const categoryCounts = new Map<string, number>()
  decisions.forEach((d) => {
    categoryCounts.set(d.category, (categoryCounts.get(d.category) || 0) + 1)
  })
  const topCategory = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]
  
  if (topCategory) {
    patterns.push(`Most of your decisions this week were in ${topCategory[0]}`)
  }
  
  return patterns.join('. ') + '.'
}

function findBiggestMiscalibration(
  decisions: Decision[],
  outcomes: Outcome[],
  outcomeMap: Map<string, Outcome>
): { decision: Decision | null; outcome: Outcome | null; description: string } {
  let maxGap = 0
  let miscalibratedDecision: Decision | null = null
  let miscalibratedOutcome: Outcome | null = null
  
  for (const decision of decisions) {
    const outcome = outcomeMap.get(decision.id)
    if (!outcome || decision.confidence_int === null) continue
    
    const outcomeScore = outcome.outcome_score_int === 1 
      ? 1.0 
      : outcome.outcome_score_int === 0 
      ? 0.5 
      : 0.0
    
    const confidenceDecimal = decision.confidence_int / 100
    const gap = Math.abs(confidenceDecimal - outcomeScore)
    
    if (gap > maxGap) {
      maxGap = gap
      miscalibratedDecision = decision
      miscalibratedOutcome = outcome
    }
  }
  
  if (!miscalibratedDecision || !miscalibratedOutcome) {
    return {
      decision: null,
      outcome: null,
      description: 'Not enough data to identify miscalibrations yet.',
    }
  }
  
  const wasOverconfident = (miscalibratedDecision.confidence_int || 0) / 100 > 
    (miscalibratedOutcome.outcome_score_int === 1 ? 1.0 : miscalibratedOutcome.outcome_score_int === 0 ? 0.5 : 0.0)
  
  const description = wasOverconfident
    ? `You were ${miscalibratedDecision.confidence_int}% confident but it went ${miscalibratedOutcome.outcome_score_int === 1 ? 'well' : miscalibratedOutcome.outcome_score_int === 0 ? 'neutral' : 'badly'}.`
    : `You were ${miscalibratedDecision.confidence_int}% confident but it went ${miscalibratedOutcome.outcome_score_int === 1 ? 'better than expected' : miscalibratedOutcome.outcome_score_int === 0 ? 'neutral' : 'worse than expected'}.`
  
  return {
    decision: miscalibratedDecision,
    outcome: miscalibratedOutcome,
    description,
  }
}

function findBestDecision(
  decisions: Decision[],
  outcomes: Outcome[],
  outcomeMap: Map<string, Outcome>
): { decision: Decision | null; outcome: Outcome | null; description: string } {
  if (outcomes.length === 0) {
    return {
      decision: null,
      outcome: null,
      description: 'No outcomes logged yet.',
    }
  }
  
  const bestOutcome = outcomes.reduce((best, current) => {
    if (current.outcome_score_int > best.outcome_score_int) return current
    return best
  })
  
  const bestDecision = decisions.find((d) => d.id === bestOutcome.decision_id)
  
  if (!bestDecision) {
    return {
      decision: null,
      outcome: null,
      description: 'Could not find decision data.',
    }
  }
  
  const description = `This decision turned out ${bestOutcome.outcome_score_int === 1 ? 'better than expected' : 'as expected'}.`
  
  return {
    decision: bestDecision,
    outcome: bestOutcome,
    description,
  }
}

function findWorstDecision(
  decisions: Decision[],
  outcomes: Outcome[],
  outcomeMap: Map<string, Outcome>
): { decision: Decision | null; outcome: Outcome | null; description: string } {
  if (outcomes.length === 0) {
    return {
      decision: null,
      outcome: null,
      description: 'No outcomes logged yet.',
    }
  }
  
  const worstOutcome = outcomes.reduce((worst, current) => {
    if (current.outcome_score_int < worst.outcome_score_int) return current
    return worst
  })
  
  const worstDecision = decisions.find((d) => d.id === worstOutcome.decision_id)
  
  if (!worstDecision) {
    return {
      decision: null,
      outcome: null,
      description: 'Could not find decision data.',
    }
  }
  
  const description = `This decision turned out worse than expected.`
  
  return {
    decision: worstDecision,
    outcome: worstOutcome,
    description,
  }
}

function generateThinkingUpgrade(
  decisions: Decision[],
  outcomes: Outcome[],
  outcomeMap: Map<string, Outcome>,
  biggestMiscalibration: { decision: Decision | null; outcome: Outcome | null; description: string },
  worstDecision: { decision: Decision | null; outcome: Outcome | null; description: string }
): string {
  const upgrades: string[] = []
  
  // Check follow-through
  const completionRate = outcomes.length / decisions.length
  if (completionRate < 0.7) {
    upgrades.push('Focus on closing the loop: log outcomes for every decision you make.')
  }
  
  // Check calibration
  if (biggestMiscalibration.decision) {
    const wasOverconfident = (biggestMiscalibration.decision.confidence_int || 0) >= 80 &&
      biggestMiscalibration.outcome?.outcome_score_int === -1
    if (wasOverconfident) {
      upgrades.push('When you feel highly confident, pause and consider what could go wrong.')
    } else {
      upgrades.push('Trust your judgment more when you have clear evidence.')
    }
  }
  
  // Check worst decision pattern
  if (worstDecision.decision) {
    upgrades.push(`Review your ${worstDecision.decision.category} decisions more carefully before committing.`)
  }
  
  // Default
  if (upgrades.length === 0) {
    upgrades.push('Keep logging outcomes consistently to build your judgment profile.')
  }
  
  return upgrades[0] // Return the most important one
}

