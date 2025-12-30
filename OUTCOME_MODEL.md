# Decylo Outcome Model Implementation

## Overview

The Decylo Outcome Model tracks decision outcomes with numeric scores and calculates advanced insights to measure decision quality and judgment growth.

## Outcome Data Model

### Fields

- **outcome_score_int** (1, 0, -1)
  - `1` = Win
  - `0` = Neutral
  - `-1` = Loss

- **outcome_reflection_text** - What actually happened
- **learning_reflection_text** - Lessons learned
- **completed_at** - Timestamp when outcome was logged

## Confidence Accuracy

For each decision:
```
confidence_accuracy = (confidence_int / 100) * outcome_score_int
```

**Range:**
- `+1.0` → Strong confident win
- `0` → Neutral
- `-1.0` → Confident failure

**Average Confidence Accuracy** = Average of all confidence_accuracy values
This is the **Judgment Quality Metric**.

## Insight Calculations

### 1. Outcome Ratio

- **WinRate** = (Wins / Total) × 100%
- **NeutralRate** = (Neutrals / Total) × 100%
- **LossRate** = (Losses / Total) × 100%

### 2. Decision Quality Index (DQI)

```
DQI = (Sum(outcome_score_int) / TotalDecisions + 1) / 2
```

**Normalized to 0-1 range:**
- `0.0` = Consistently bad decisions
- `0.5` = Average
- `1.0` = Excellent decision-making

### 3. Judgment Growth Rate

Compare last 14 days vs previous 14 days:
```
GrowthRate = DQI_recent - DQI_previous
```

- **Positive** = Improvement
- **Negative** = Decline
- **Zero** = Stable

### 4. Confidence Calibration

```
Calibration = Average(confidence_accuracy)
```

Measures how accurate a user's confidence predictions are.

### 5. Category Intelligence

For each category:
```
CategoryDQI = (Sum(outcome_score_int in category) / Count + 1) / 2
```

Shows where the user makes their best decisions.

## Streak Engine

**Streak increments when ANY of these occur:**
- New decision created
- Outcome logged
- Daily check-in completed

**Streak resets** only if no activity for 24 hours.

## Database Migration

Run the migration script in Supabase SQL editor:
```sql
-- See: supabase/migration_outcome_model.sql
```

This will:
1. Add new columns (`outcome_score_int`, `outcome_reflection_text`, `learning_reflection_text`, `completed_at`)
2. Migrate existing data (maps old `outcome_status` to new `outcome_score_int`)
3. Keep legacy columns for backward compatibility during transition

## Implementation Status

✅ **Complete:**
- Outcome data model (TypeScript types)
- Outcome logging form (uses new fields)
- Outcome display (backward compatible)
- Insight calculations (all metrics)
- Insights page (shows all new metrics)
- Streak calculation (includes decisions, outcomes, check-ins)

✅ **Files Updated:**
- `lib/db/types.ts` - Updated Outcome interface
- `lib/insights.ts` - All calculation functions
- `components/DecisionDetail.tsx` - Outcome form and display
- `app/app/insights/page.tsx` - New metrics display
- `supabase/schema.sql` - Updated schema
- `supabase/migration_outcome_model.sql` - Migration script

## Next Steps

1. **Run database migration** in Supabase SQL editor
2. **Test outcome logging** - Create a decision, log an outcome
3. **Verify insights** - Check that all metrics calculate correctly
4. **Test streak** - Verify streak increments on all activity types

## Backward Compatibility

The implementation maintains backward compatibility:
- Legacy fields (`outcome_status`, `what_happened`, `lesson`) are preserved
- Display logic handles both old and new formats
- Migration script maps old data to new structure


