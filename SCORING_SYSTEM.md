# Decylo Decision Scoring System

## Overview

Decylo uses a normalized, weighted scoring model to evaluate decision options and provide recommendations. The system converts user input (impact, effort, risk) into a single Decision Score (1-10).

## Scoring Formula

### Step 1: Normalize Dimensions

All dimensions are normalized to a 1-10 scale where **higher = better**:

- **ImpactScore** = `impact_int` (1-10)
- **EffortScore** = `11 - effort_int` (1-10, inverted so low effort = high score)
- **RiskScore** = `11 - risk_int` (1-10, inverted so low risk = high score)

### Step 2: Weighted Formula

```
DecisionScore = (ImpactScore × 0.5) + (EffortScore × 0.3) + (RiskScore × 0.2)
```

**Weighting Rationale:**
- Impact matters most (50%)
- Effort second (30%)
- Risk third (20%)

### Step 3: Final Score

Round to 1 decimal place (1-10 range).

**Storage:** Stored as integer × 10 (e.g., 6.9 → 69) to preserve decimal precision in INTEGER database column.

**Display:** Converted back to decimal for display (e.g., 69 → 6.9).

## Example Calculation

### Option A
- Impact: 9
- Effort: 7
- Risk: 5

**Calculation:**
- ImpactScore = 9
- EffortScore = 11 - 7 = 4
- RiskScore = 11 - 5 = 6
- DecisionScore = (9×0.5) + (4×0.3) + (6×0.2) = 4.5 + 1.2 + 1.2 = **6.9**
- Stored as: **69**

### Option B
- Impact: 7
- Effort: 3
- Risk: 2

**Calculation:**
- ImpactScore = 7
- EffortScore = 11 - 3 = 8
- RiskScore = 11 - 2 = 9
- DecisionScore = (7×0.5) + (8×0.3) + (9×0.2) = 3.5 + 2.4 + 1.8 = **7.7**
- Stored as: **77**

**Recommendation:** Option B (higher score: 7.7 > 6.9)

## Implementation

### Functions

- `calculateOptionScore(option)` - Calculates and returns score as integer × 10
- `formatScoreForDisplay(storedScore)` - Converts stored score to display value (1-10 decimal)
- `getSuggestedOption(options)` - Returns option with highest score (Decylo Recommendation)

### Database

- `total_score_int` (INTEGER) - Stores score as integer × 10 (e.g., 69 for 6.9)
- `impact_int` (1-10)
- `effort_int` (1-10)
- `risk_int` (1-10)

### User Input

- Range sliders: 1-10 (not 0-10)
- User sets confidence: 0-100% at commit time
- Stored as `confidence_int` (0-100)

## Key Points

1. **User chooses final option** - The recommendation is a suggestion, not a mandate
2. **Confidence tracking** - User's confidence (0-100%) is stored for later comparison with outcomes
3. **Decimal precision** - Scores are stored as integers but displayed with 1 decimal place
4. **Validation** - Input values are clamped to 1-10 range

## Testing

All scoring tests pass, including:
- ✅ Decylo example calculations (Option A: 6.9, Option B: 7.7)
- ✅ Edge cases (min/max values)
- ✅ Display formatting
- ✅ Recommendation selection


