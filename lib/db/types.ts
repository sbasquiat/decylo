export type DecisionCategory = 'career' | 'money' | 'health' | 'relationships' | 'life_lifestyle' | 'growth_learning' | 'time_priorities' | 'other'
export type DecisionStatus = 'open' | 'decided' | 'completed'
export type OutcomeStatus = 'won' | 'neutral' | 'lost'

export interface Profile {
  id: string
  created_at: string
  display_name: string | null
  timezone: string
  email_preferences?: {
    welcome?: boolean
    reminders?: boolean
    weekly_review?: boolean
  }
}

export interface EmailLog {
  id: string
  user_id: string
  email_type: 'welcome' | 'outcome_reminder' | 'weekly_review' | 'inactivity_nudge' | 'first_insight' | 'upgrade_receipt'
  target_id: string | null // decision_id for outcome_reminder, null for others
  sent_at: string
  created_at: string
}

export interface Decision {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  date: string
  title: string
  category: DecisionCategory
  context: string
  success_outcome: string | null // What success looks like (1 sentence)
  constraints: string | null
  risky_assumption: string | null // Assumption that might be wrong (anti-bias)
  chosen_option_id: string | null
  decided_at: string | null // Timestamp when decision was committed
  confidence_int: number | null
  next_action: string | null
  next_action_due_date: string | null
  decision_rationale: string | null // Core reason for choosing this option (required)
  predicted_outcome_positive: string | null // What will change if it goes well
  predicted_outcome_negative: string | null // Worst realistic outcome if it goes badly
  commitment_confirmed: boolean | null // User confirmed commitment to review outcome
  outcome_id: string | null // Reference to outcome (computed)
  status: DecisionStatus // Legacy field, use computeDecisionStatus() instead
  completed_at: string | null // Timestamp when outcome was logged
}

export interface Option {
  id: string
  decision_id: string
  label: string
  notes: string | null
  impact_int: number
  effort_int: number
  risk_int: number
  total_score_int: number
  created_at: string
}

export interface Checkin {
  id: string
  user_id: string
  date: string
  focus: string | null
  completed_bool: boolean
  mood_int: number | null
  created_at: string
}

export interface Outcome {
  id: string
  decision_id: string
  outcome_score_int: number // 1 (win), 0 (neutral), -1 (loss)
  outcome_reflection_text: string
  learning_reflection_text: string
  learning_confidence_int: number | null // 0-100, null if no learning provided (confidence_after)
  completed_at: string
  created_at: string
  // Cognitive gap fields
  temporal_anchor?: '1_day' | '1_week' | '1_month' | '3_months' | null // Gap 2: Temporal anchoring
  counterfactual_reflection_text?: string | null // Gap 4: Counterfactual capture
  self_reflection_text?: string | null // What this decision taught you about yourself
  // Legacy fields (for backward compatibility during migration)
  outcome_status?: OutcomeStatus
  what_happened?: string
  lesson?: string
}

export interface DecisionHealthSnapshot {
  id: string
  user_id: string
  health_score: number // 0-100
  win_rate: number // 0-100
  avg_calibration_gap: number
  completion_rate: number // 0-100
  streak_length: number
  snapshot_date: string
  created_at: string
}

