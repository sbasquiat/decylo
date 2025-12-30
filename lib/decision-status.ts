import { Decision, Outcome } from './db/types'

export type DecisionStatus = 'open' | 'decided' | 'completed'

/**
 * Compute decision status from fields (strict state machine)
 * 
 * State machine: OPEN → DECIDED → COMPLETED
 * 
 * Rules:
 * - OPEN: no decided_at OR no chosen_option_id
 * - DECIDED: has decided_at + chosen_option_id but no outcome_id
 * - COMPLETED: has outcome_id (outcome record exists)
 * 
 * Enforcements:
 * - A decision becomes DECIDED only when chosen_option_id AND decided_at exist
 * - A decision becomes COMPLETED only when an outcome record exists (outcome_id is set)
 * - COMPLETED decisions are immutable (no further edits except note append)
 */
export function computeDecisionStatus(
  decision: Decision,
  outcome: Outcome | null
): DecisionStatus {
  // OPEN: no decided_at OR no chosen_option_id
  if (!decision.decided_at || !decision.chosen_option_id) {
    return 'open'
  }

  // DECIDED: has decided_at + chosen_option_id but no outcome_id
  // Check both outcome_id field and outcome object for safety
  const hasOutcome = decision.outcome_id !== null && decision.outcome_id !== undefined
  const hasOutcomeObject = outcome !== null && outcome !== undefined
  
  if (decision.decided_at && decision.chosen_option_id && !hasOutcome && !hasOutcomeObject) {
    return 'decided'
  }

  // COMPLETED: has outcome_id (outcome record exists)
  if (hasOutcome || hasOutcomeObject) {
    return 'completed'
  }

  // Fallback to open
  return 'open'
}

/**
 * Validate status transition
 * Prevents invalid transitions:
 * - completed -> decided/open
 * - decided -> open
 */
export function canTransitionStatus(
  currentStatus: DecisionStatus,
  targetStatus: DecisionStatus
): boolean {
  // No transition needed
  if (currentStatus === targetStatus) {
    return true
  }

  // Invalid transitions
  if (currentStatus === 'completed') {
    return false // Cannot go back from completed
  }

  if (currentStatus === 'decided' && targetStatus === 'open') {
    return false // Cannot go back from decided to open
  }

  // Valid transitions
  // open -> decided (user commits)
  // decided -> completed (user logs outcome)
  return true
}

/**
 * Get status badge text for display
 */
export function getStatusBadgeText(status: DecisionStatus): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'decided':
      return 'Outcome due'
    case 'completed':
      return 'Completed'
    default:
      return 'Open'
  }
}

/**
 * Validate that a decision can be marked as COMPLETED
 * Requires: outcome record exists
 */
export function canMarkAsCompleted(
  decision: Decision,
  newOutcome: Outcome | null
): { valid: boolean; error?: string } {
  // Check current status WITHOUT the new outcome (use existing outcome_id if present)
  const existingOutcome = decision.outcome_id ? { id: decision.outcome_id } as Outcome : null
  const currentStatus = computeDecisionStatus(decision, existingOutcome)
  
  if (currentStatus === 'completed') {
    return { valid: false, error: 'Decision is already completed' }
  }

  if (currentStatus !== 'decided') {
    return { valid: false, error: `Cannot complete decision in ${currentStatus} state. Must be DECIDED.` }
  }

  if (!newOutcome) {
    return { valid: false, error: 'Cannot mark decision as COMPLETED without an outcome record' }
  }

  return { valid: true }
}

/**
 * Validate that a decision can have an outcome logged
 * Prevents: multiple outcomes for same decision
 */
export function canLogOutcome(
  decision: Decision,
  existingOutcome: Outcome | null
): { valid: boolean; error?: string } {
  const currentStatus = computeDecisionStatus(decision, existingOutcome)
  
  if (currentStatus === 'completed') {
    if (existingOutcome) {
      return { valid: false, error: 'Cannot log multiple outcomes for the same decision' }
    }
    return { valid: false, error: 'Decision is already completed' }
  }

  if (currentStatus !== 'decided') {
    return { valid: false, error: `Cannot log outcome for decision in ${currentStatus} state. Must be DECIDED.` }
  }

  if (existingOutcome) {
    return { valid: false, error: 'An outcome already exists for this decision' }
  }

  return { valid: true }
}

/**
 * Validate that a decision field can be modified
 * COMPLETED decisions are immutable except for learning notes
 */
export function canModifyDecisionField(
  decision: Decision,
  outcome: Outcome | null,
  fieldName: string
): { valid: boolean; error?: string } {
  const currentStatus = computeDecisionStatus(decision, outcome)
  
  if (currentStatus === 'completed') {
    // Only allow modifying learning notes for completed decisions
    const allowedFields = ['learning_reflection_text', 'learning_confidence_int']
    if (!allowedFields.includes(fieldName)) {
      return {
        valid: false,
        error: `Cannot modify ${fieldName} for COMPLETED decision. Only learning notes can be updated.`,
      }
    }
  }

  return { valid: true }
}

/**
 * Validate decision update operation
 * Blocks API mutations that violate state machine
 */
export function validateDecisionUpdate(
  currentDecision: Decision,
  currentOutcome: Outcome | null,
  updateData: Partial<Decision>
): { valid: boolean; error?: string; warning?: string } {
  const currentStatus = computeDecisionStatus(currentDecision, currentOutcome)

  // Check for illegal status transitions
  if (updateData.status) {
    const targetStatus = updateData.status as DecisionStatus
    if (!canTransitionStatus(currentStatus, targetStatus)) {
      const warning = `⚠️ Illegal state transition attempted: ${currentStatus} → ${targetStatus}`
      console.warn(warning, { decisionId: currentDecision.id, currentStatus, targetStatus })
      return { valid: false, error: `Invalid state transition: ${currentStatus} → ${targetStatus}` }
    }
  }

  // Prevent marking as COMPLETED without outcome
  if (updateData.status === 'completed' || updateData.outcome_id) {
    if (!currentOutcome && !updateData.outcome_id) {
      const warning = `⚠️ Attempted to mark decision as COMPLETED without outcome`
      console.warn(warning, { decisionId: currentDecision.id })
      return { valid: false, error: 'Cannot mark decision as COMPLETED without an outcome record' }
    }
  }

  // Prevent modifying COMPLETED decision fields
  if (currentStatus === 'completed') {
    const immutableFields = ['title', 'context', 'category', 'chosen_option_id', 'decided_at', 'confidence_int']
    for (const field of immutableFields) {
      if (field in updateData && updateData[field as keyof Decision] !== currentDecision[field as keyof Decision]) {
        const warning = `⚠️ Attempted to modify immutable field ${field} on COMPLETED decision`
        console.warn(warning, { decisionId: currentDecision.id, field })
        return {
          valid: false,
          error: `Cannot modify ${field} for COMPLETED decision. Only learning notes can be updated.`,
        }
      }
    }
  }

  // Prevent removing decided_at or chosen_option_id from DECIDED/COMPLETED decisions
  if (currentStatus !== 'open') {
    if (updateData.decided_at === null || updateData.chosen_option_id === null) {
      const warning = `⚠️ Attempted to remove decided_at or chosen_option_id from ${currentStatus} decision`
      console.warn(warning, { decisionId: currentDecision.id })
      return {
        valid: false,
        error: `Cannot remove decided_at or chosen_option_id from ${currentStatus} decision`,
      }
    }
  }

  return { valid: true }
}

/**
 * Log warning for illegal transition attempt
 */
export function logIllegalTransition(
  decisionId: string,
  currentStatus: DecisionStatus,
  attemptedStatus: DecisionStatus
): void {
  console.warn(
    `⚠️ Illegal state transition attempted for decision ${decisionId}: ${currentStatus} → ${attemptedStatus}`,
    {
      decisionId,
      currentStatus,
      attemptedStatus,
      allowedTransitions: {
        open: ['decided'],
        decided: ['completed'],
        completed: [],
      },
    }
  )
}

