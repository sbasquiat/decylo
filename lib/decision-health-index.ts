/**
 * Decision Health Index (DHI) Calculation
 * 
 * DHI = (0.45 × PA) + (0.30 × FT) + (0.15 × RI) + (0.10 × GM_normalized)
 * 
 * Where:
 * - PA, FT, RI in range 0–1
 * - GM_normalized = clamp((GM + 1) / 2, 0, 1)
 * 
 * Final DHI scaled to 0–100
 */

export interface DHIComponents {
  predictionAccuracy: number // 0-1
  followThroughRate: number // 0-1
  riskIntelligence: number // -1 to 1
  growthMomentum: number // can be negative
}

/**
 * Normalize Growth Momentum to 0-1 range
 * GM_normalized = clamp((GM + 1) / 2, 0, 1)
 */
export function normalizeGrowthMomentum(gm: number): number {
  // Assuming GM is typically in range -1 to +1, but can be outside
  // Normalize: (GM + 1) / 2, then clamp to 0-1
  const normalized = (gm + 1) / 2
  return Math.max(0, Math.min(1, normalized))
}

/**
 * Normalize Risk Intelligence to 0-1 range
 * RI is currently -1 to 1, need to convert to 0-1
 */
export function normalizeRiskIntelligence(ri: number): number {
  // RI is -1 to 1, convert to 0-1
  return Math.max(0, Math.min(1, (ri + 1) / 2))
}

/**
 * Calculate Decision Health Index (DHI)
 * Returns value 0-100
 */
export function calculateDHI(components: DHIComponents): number {
  const { predictionAccuracy, followThroughRate, riskIntelligence, growthMomentum } = components
  
  // Normalize all components to 0-1 range
  const pa = Math.max(0, Math.min(1, predictionAccuracy))
  const ft = Math.max(0, Math.min(1, followThroughRate))
  const ri = normalizeRiskIntelligence(riskIntelligence)
  const gm = normalizeGrowthMomentum(growthMomentum)
  
  // Calculate DHI
  const dhi = (0.45 * pa) + (0.30 * ft) + (0.15 * ri) + (0.10 * gm)
  
  // Scale to 0-100
  return Math.round(dhi * 100)
}

/**
 * Calculate Trajectory Momentum Score (TMS)
 * TMS = (DHI_last_7_days_avg − DHI_prev_7_days_avg)
 * 
 * Returns:
 * - 'accelerating' if TMS ≥ +3
 * - 'stable' if -3 < TMS < +3
 * - 'declining' if TMS ≤ -3
 */
export function calculateTMS(
  dhiLast7Days: number | null,
  dhiPrev7Days: number | null
): { score: number; status: 'accelerating' | 'stable' | 'declining' } {
  if (dhiLast7Days === null || dhiPrev7Days === null) {
    return { score: 0, status: 'stable' }
  }
  
  const tms = dhiLast7Days - dhiPrev7Days
  
  if (tms >= 3) {
    return { score: tms, status: 'accelerating' }
  } else if (tms <= -3) {
    return { score: tms, status: 'declining' }
  } else {
    return { score: tms, status: 'stable' }
  }
}


