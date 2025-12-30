import {
  computeDecisionStatus,
  canTransitionStatus,
  canMarkAsCompleted,
  canLogOutcome,
  canModifyDecisionField,
  validateDecisionUpdate,
  logIllegalTransition,
} from '../decision-status'
import { Decision, Outcome } from '../db/types'

describe('Decision Status State Machine', () => {
  describe('computeDecisionStatus', () => {
    it('should return OPEN when no decided_at or chosen_option_id', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: null,
        decided_at: null,
        confidence_int: null,
        next_action: null,
        next_action_due_date: null,
        outcome_id: null,
        status: 'open',
      }

      expect(computeDecisionStatus(decision, null)).toBe('open')
    })

    it('should return DECIDED when has decided_at and chosen_option_id but no outcome', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: null,
        status: 'decided',
      }

      expect(computeDecisionStatus(decision, null)).toBe('decided')
    })

    it('should return COMPLETED when has outcome', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: 'outcome1',
        status: 'completed',
      }

      const outcome: Outcome = {
        id: 'outcome1',
        decision_id: '1',
        outcome_score_int: 1,
        outcome_reflection_text: 'Great!',
        learning_reflection_text: 'Learned something',
        learning_confidence_int: 90,
        completed_at: '2024-01-02T10:00:00Z',
        created_at: '2024-01-02T10:00:00Z',
      }

      expect(computeDecisionStatus(decision, outcome)).toBe('completed')
    })
  })

  describe('canTransitionStatus', () => {
    it('should allow OPEN → DECIDED', () => {
      expect(canTransitionStatus('open', 'decided')).toBe(true)
    })

    it('should allow DECIDED → COMPLETED', () => {
      expect(canTransitionStatus('decided', 'completed')).toBe(true)
    })

    it('should reject COMPLETED → DECIDED', () => {
      expect(canTransitionStatus('completed', 'decided')).toBe(false)
    })

    it('should reject COMPLETED → OPEN', () => {
      expect(canTransitionStatus('completed', 'open')).toBe(false)
    })

    it('should reject DECIDED → OPEN', () => {
      expect(canTransitionStatus('decided', 'open')).toBe(false)
    })

    it('should allow same status (no transition)', () => {
      expect(canTransitionStatus('open', 'open')).toBe(true)
      expect(canTransitionStatus('decided', 'decided')).toBe(true)
      expect(canTransitionStatus('completed', 'completed')).toBe(true)
    })
  })

  describe('canMarkAsCompleted', () => {
    it('should allow marking DECIDED decision as COMPLETED with outcome', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: null,
        status: 'decided',
      }

      const outcome: Outcome = {
        id: 'outcome1',
        decision_id: '1',
        outcome_score_int: 1,
        outcome_reflection_text: 'Great!',
        learning_reflection_text: 'Learned something',
        learning_confidence_int: 90,
        completed_at: '2024-01-02T10:00:00Z',
        created_at: '2024-01-02T10:00:00Z',
      }

      const result = canMarkAsCompleted(decision, outcome)
      expect(result.valid).toBe(true)
    })

    it('should reject marking DECIDED decision as COMPLETED without outcome', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: null,
        status: 'decided',
      }

      const result = canMarkAsCompleted(decision, null)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('without an outcome')
    })

    it('should reject marking already COMPLETED decision as COMPLETED', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: 'outcome1',
        status: 'completed',
      }

      const outcome: Outcome = {
        id: 'outcome1',
        decision_id: '1',
        outcome_score_int: 1,
        outcome_reflection_text: 'Great!',
        learning_reflection_text: 'Learned something',
        learning_confidence_int: 90,
        completed_at: '2024-01-02T10:00:00Z',
        created_at: '2024-01-02T10:00:00Z',
      }

      const result = canMarkAsCompleted(decision, outcome)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already completed')
    })
  })

  describe('canLogOutcome', () => {
    it('should allow logging outcome for DECIDED decision', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: null,
        status: 'decided',
      }

      const result = canLogOutcome(decision, null)
      expect(result.valid).toBe(true)
    })

    it('should reject logging outcome for COMPLETED decision', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: 'outcome1',
        status: 'completed',
      }

      const outcome: Outcome = {
        id: 'outcome1',
        decision_id: '1',
        outcome_score_int: 1,
        outcome_reflection_text: 'Great!',
        learning_reflection_text: 'Learned something',
        learning_confidence_int: 90,
        completed_at: '2024-01-02T10:00:00Z',
        created_at: '2024-01-02T10:00:00Z',
      }

      const result = canLogOutcome(decision, outcome)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('multiple outcomes')
    })

    it('should reject logging outcome for OPEN decision', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: null,
        decided_at: null,
        confidence_int: null,
        next_action: null,
        next_action_due_date: null,
        outcome_id: null,
        status: 'open',
      }

      const result = canLogOutcome(decision, null)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Must be DECIDED')
    })
  })

  describe('canModifyDecisionField', () => {
    it('should allow modifying learning notes for COMPLETED decision', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: 'outcome1',
        status: 'completed',
      }

      const outcome: Outcome = {
        id: 'outcome1',
        decision_id: '1',
        outcome_score_int: 1,
        outcome_reflection_text: 'Great!',
        learning_reflection_text: 'Learned something',
        learning_confidence_int: 90,
        completed_at: '2024-01-02T10:00:00Z',
        created_at: '2024-01-02T10:00:00Z',
      }

      const result = canModifyDecisionField(decision, outcome, 'learning_reflection_text')
      expect(result.valid).toBe(true)
    })

    it('should reject modifying title for COMPLETED decision', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: 'outcome1',
        status: 'completed',
      }

      const outcome: Outcome = {
        id: 'outcome1',
        decision_id: '1',
        outcome_score_int: 1,
        outcome_reflection_text: 'Great!',
        learning_reflection_text: 'Learned something',
        learning_confidence_int: 90,
        completed_at: '2024-01-02T10:00:00Z',
        created_at: '2024-01-02T10:00:00Z',
      }

      const result = canModifyDecisionField(decision, outcome, 'title')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Cannot modify title')
    })
  })

  describe('validateDecisionUpdate', () => {
    it('should allow valid OPEN → DECIDED transition', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: null,
        decided_at: null,
        confidence_int: null,
        next_action: null,
        next_action_due_date: null,
        outcome_id: null,
        status: 'open',
      }

      const result = validateDecisionUpdate(decision, null, {
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        status: 'decided',
      })

      expect(result.valid).toBe(true)
    })

    it('should reject invalid COMPLETED → DECIDED transition', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: 'outcome1',
        status: 'completed',
      }

      const outcome: Outcome = {
        id: 'outcome1',
        decision_id: '1',
        outcome_score_int: 1,
        outcome_reflection_text: 'Great!',
        learning_reflection_text: 'Learned something',
        learning_confidence_int: 90,
        completed_at: '2024-01-02T10:00:00Z',
        created_at: '2024-01-02T10:00:00Z',
      }

      const result = validateDecisionUpdate(decision, outcome, {
        status: 'decided',
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid state transition')
    })

    it('should reject marking as COMPLETED without outcome', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: null,
        status: 'decided',
      }

      const result = validateDecisionUpdate(decision, null, {
        status: 'completed',
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('without an outcome')
    })

    it('should reject modifying title of COMPLETED decision', () => {
      const decision: Decision = {
        id: '1',
        user_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        date: '2024-01-01',
        title: 'Test',
        category: 'career',
        context: 'Test context',
        constraints: null,
        chosen_option_id: 'option1',
        decided_at: '2024-01-01T10:00:00Z',
        confidence_int: 80,
        next_action: null,
        next_action_due_date: null,
        outcome_id: 'outcome1',
        status: 'completed',
      }

      const outcome: Outcome = {
        id: 'outcome1',
        decision_id: '1',
        outcome_score_int: 1,
        outcome_reflection_text: 'Great!',
        learning_reflection_text: 'Learned something',
        learning_confidence_int: 90,
        completed_at: '2024-01-02T10:00:00Z',
        created_at: '2024-01-02T10:00:00Z',
      }

      const result = validateDecisionUpdate(decision, outcome, {
        title: 'New Title',
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Cannot modify title')
    })
  })
})

