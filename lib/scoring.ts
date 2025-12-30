import { Option } from './db/types'

/**
 * Decylo Decision Scoring Model (Outcome Modeling)
 * 
 * We evaluate each option by modeling the future it creates — not by how it feels today.
 * 
 * Expected Value Formula (Weighted):
 * DecisionScore = (ImpactScore × 0.5) + (EffortScore × 0.3) + (RiskScore × 0.2)
 * 
 * Where:
 * - ImpactScore = impact_int (1-10, how much life improves in 3-12 months)
 * - EffortScore = 11 - effort_int (1-10, inverted so low effort = high score)
 * - RiskScore = 11 - risk_int (1-10, inverted so low risk = high score)
 * 
 * Higher Expected Value = better option
 * 
 * Note: Stored as integer × 10 (e.g., 6.9 → 69) to preserve decimal precision
 */
export function calculateOptionScore(option: {
  impact_int: number
  effort_int: number
  risk_int: number
}): number {
  // Validate inputs (1-10 range)
  const impact = Math.max(1, Math.min(10, option.impact_int))
  const effort = Math.max(1, Math.min(10, option.effort_int))
  const risk = Math.max(1, Math.min(10, option.risk_int))

  // Normalize dimensions to 1-10 scale where higher = better
  const impactScore = impact // Already 1-10, higher is better
  const effortScore = 11 - effort // Invert: low effort (1) = high score (10)
  const riskScore = 11 - risk // Invert: low risk (1) = high score (10)

  // Weighted formula: Impact 50%, Effort 30%, Risk 20%
  const expectedValue = (impactScore * 0.5) + (effortScore * 0.3) + (riskScore * 0.2)

  // Clamp to 1-10 range (should already be in range, but safety check)
  const clampedValue = Math.max(1, Math.min(10, expectedValue))

  // Round to 1 decimal and convert to integer × 10 for storage
  // (e.g., 6.9 → 69, so we can store as INTEGER and display as 6.9)
  return Math.round(clampedValue * 10)
}

/**
 * Convert stored score (integer × 10) to display value (1-10 decimal)
 * @param storedScore - Score stored in database (integer × 10, e.g., 69 for 6.9)
 * @returns Display value (1-10, 1 decimal place, e.g., 6.9)
 */
export function formatScoreForDisplay(storedScore: number): number {
  return Math.round((storedScore / 10) * 10) / 10
}

/**
 * Get suggested option from a list of options
 * Uses Decylo scoring: highest total_score_int wins
 * This is the Decylo Recommendation
 * 
 * Note: User still chooses the final option manually
 */
export function getSuggestedOption(options: Option[]): Option | null {
  if (options.length === 0) return null

  // Filter out options without labels (incomplete)
  const validOptions = options.filter((opt) => opt.label && opt.label.trim())

  if (validOptions.length === 0) return null

  // Sort by total_score_int (desc) - highest score is the recommendation
  const sorted = [...validOptions].sort((a, b) => {
    return b.total_score_int - a.total_score_int
  })

  return sorted[0]
}

