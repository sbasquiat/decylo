import { calculateOptionScore, formatScoreForDisplay, getSuggestedOption } from './scoring'
import { Option } from './db/types'

describe('scoring', () => {
  describe('calculateOptionScore', () => {
    it('calculates score correctly using Decylo formula', () => {
      // Example: Impact=8, Effort=3, Risk=2
      // ImpactScore = 8
      // EffortScore = 11 - 3 = 8
      // RiskScore = 11 - 2 = 9
      // DecisionScore = (8×0.5) + (8×0.3) + (9×0.2) = 4.0 + 2.4 + 1.8 = 8.2
      // Stored as: 82 (8.2 × 10)
      const option = { impact_int: 8, effort_int: 3, risk_int: 2 }
      expect(calculateOptionScore(option)).toBe(82)
    })

    it('matches Decylo example: Option A', () => {
      // Option A: Impact=9, Effort=7, Risk=5
      // ImpactScore = 9
      // EffortScore = 11 - 7 = 4
      // RiskScore = 11 - 5 = 6
      // DecisionScore = (9×0.5) + (4×0.3) + (6×0.2) = 4.5 + 1.2 + 1.2 = 6.9
      // Stored as: 69
      const option = { impact_int: 9, effort_int: 7, risk_int: 5 }
      expect(calculateOptionScore(option)).toBe(69)
      expect(formatScoreForDisplay(69)).toBe(6.9)
    })

    it('matches Decylo example: Option B', () => {
      // Option B: Impact=7, Effort=3, Risk=2
      // ImpactScore = 7
      // EffortScore = 11 - 3 = 8
      // RiskScore = 11 - 2 = 9
      // DecisionScore = (7×0.5) + (8×0.3) + (9×0.2) = 3.5 + 2.4 + 1.8 = 7.7
      // Stored as: 77
      const option = { impact_int: 7, effort_int: 3, risk_int: 2 }
      expect(calculateOptionScore(option)).toBe(77)
      expect(formatScoreForDisplay(77)).toBe(7.7)
    })

    it('handles edge cases with clamping', () => {
      // Values are clamped to 1-10 range
      expect(calculateOptionScore({ impact_int: 0, effort_int: 0, risk_int: 0 })).toBeGreaterThan(0)
      expect(calculateOptionScore({ impact_int: 10, effort_int: 10, risk_int: 10 })).toBeLessThan(100)
    })

    it('handles minimum values', () => {
      // Impact=1, Effort=10, Risk=10
      // ImpactScore = 1
      // EffortScore = 11 - 10 = 1
      // RiskScore = 11 - 10 = 1
      // DecisionScore = (1×0.5) + (1×0.3) + (1×0.2) = 0.5 + 0.3 + 0.2 = 1.0
      // Stored as: 10
      const option = { impact_int: 1, effort_int: 10, risk_int: 10 }
      expect(calculateOptionScore(option)).toBe(10)
    })

    it('handles maximum values', () => {
      // Impact=10, Effort=1, Risk=1
      // ImpactScore = 10
      // EffortScore = 11 - 1 = 10
      // RiskScore = 11 - 1 = 10
      // DecisionScore = (10×0.5) + (10×0.3) + (10×0.2) = 5.0 + 3.0 + 2.0 = 10.0
      // Stored as: 100
      const option = { impact_int: 10, effort_int: 1, risk_int: 1 }
      expect(calculateOptionScore(option)).toBe(100)
    })
  })

  describe('formatScoreForDisplay', () => {
    it('converts stored score to display value', () => {
      expect(formatScoreForDisplay(69)).toBe(6.9)
      expect(formatScoreForDisplay(77)).toBe(7.7)
      expect(formatScoreForDisplay(100)).toBe(10)
      expect(formatScoreForDisplay(10)).toBe(1)
    })
  })

  describe('getSuggestedOption', () => {
    it('returns option with highest score (Decylo Recommendation)', () => {
      // Option A: Score 69 (6.9)
      // Option B: Score 77 (7.7) - should be recommended
      const options: Option[] = [
        {
          id: '1',
          decision_id: 'd1',
          label: 'Option A',
          notes: null,
          impact_int: 9,
          effort_int: 7,
          risk_int: 5,
          total_score_int: 69, // 6.9
          created_at: '2024-01-01',
        },
        {
          id: '2',
          decision_id: 'd1',
          label: 'Option B',
          notes: null,
          impact_int: 7,
          effort_int: 3,
          risk_int: 2,
          total_score_int: 77, // 7.7
          created_at: '2024-01-01',
        },
      ]
      const suggested = getSuggestedOption(options)
      expect(suggested?.id).toBe('2')
      expect(suggested?.label).toBe('Option B')
    })

    it('returns null for empty array', () => {
      expect(getSuggestedOption([])).toBeNull()
    })

    it('filters out options without labels', () => {
      const options: Option[] = [
        {
          id: '1',
          decision_id: 'd1',
          label: '',
          notes: null,
          impact_int: 8,
          effort_int: 3,
          risk_int: 2,
          total_score_int: 82,
          created_at: '2024-01-01',
        },
        {
          id: '2',
          decision_id: 'd1',
          label: 'Valid Option',
          notes: null,
          impact_int: 7,
          effort_int: 3,
          risk_int: 2,
          total_score_int: 77,
          created_at: '2024-01-01',
        },
      ]
      const suggested = getSuggestedOption(options)
      expect(suggested?.id).toBe('2')
    })
  })
})

