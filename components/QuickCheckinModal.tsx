'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { useRouter } from 'next/navigation'

type OutcomeResult = 'better' | 'same' | 'worse'
type Confidence = 20 | 40 | 60 | 80 | 100

interface QuickCheckinModalProps {
  isOpen: boolean
  onClose: () => void
  decisionId: string
  decisionTitle: string // Show which decision is being checked in
  isCompleted?: boolean // Prevent re-opening if already completed
}

export default function QuickCheckinModal({
  isOpen,
  onClose,
  decisionId,
  decisionTitle,
  isCompleted = false,
}: QuickCheckinModalProps) {
  const router = useRouter()
  const [outcomeResult, setOutcomeResult] = useState<OutcomeResult | null>(null)
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [learning, setLearning] = useState('')
  const [selfReflection, setSelfReflection] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOutcomeResult(null)
      setConfidence(null)
      setLearning('')
      setSelfReflection('')
      setError(null)
    }
  }, [isOpen])

  // Prevent opening if already completed
  if (!isOpen || isCompleted) return null

  const getOutcomeScore = (result: OutcomeResult): number => {
    switch (result) {
      case 'better':
        return 1
      case 'same':
        return 0
      case 'worse':
        return -1
    }
  }

  const handleSubmit = async () => {
    // Validation: Required fields
    if (!outcomeResult) {
      setError('Please select how the decision turned out.')
      return
    }

    if (!confidence) {
      setError('Please select your confidence level.')
      return
    }

    if (learning.trim().length > 240) {
      setError('Learning must be 240 characters or less.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Please sign in to save your check-in.')
        setSaving(false)
        return
      }

      // Validate: Check if decision already has an outcome
      const { data: decision } = await supabase
        .from('decisions')
        .select('*')
        .eq('id', decisionId)
        .single()

      if (!decision) {
        setError('Decision not found.')
        setSaving(false)
        return
      }

      const { data: existingOutcome } = await supabase
        .from('outcomes')
        .select('*')
        .eq('decision_id', decisionId)
        .single()

      // Validate state machine: Cannot log multiple outcomes
      const { canLogOutcome } = await import('@/lib/decision-status')
      const validation = canLogOutcome(decision, existingOutcome || null)
      
      if (!validation.valid) {
        console.warn('⚠️ Cannot log outcome:', validation.error, { decisionId })
        setError(validation.error || 'Cannot log outcome for this decision.')
        setSaving(false)
        return
      }

      const now = new Date().toISOString()
      const outcomeScore = getOutcomeScore(outcomeResult)

      // 1. Create outcome record
      const { data: outcome, error: outcomeError } = await supabase
        .from('outcomes')
        .insert({
          decision_id: decisionId,
          outcome_score_int: outcomeScore,
          outcome_reflection_text: `Quick check-in: ${outcomeResult === 'better' ? 'Better than expected' : outcomeResult === 'same' ? 'As expected' : 'Worse than expected'}`,
          learning_reflection_text: learning.trim() || '', // NOT NULL field - use empty string if no learning provided
          learning_confidence_int: confidence, // Use selected confidence as learning confidence
          completed_at: now,
          self_reflection_text: selfReflection.trim() || null, // Optional self-reflection
          // Legacy fields for backward compatibility
          outcome_status: outcomeResult === 'better' ? 'won' : outcomeResult === 'same' ? 'neutral' : 'lost',
          what_happened: `Quick check-in: ${outcomeResult}`,
          lesson: learning.trim() || '', // Use empty string if NOT NULL constraint exists
        })
        .select()
        .single()

      if (outcomeError) {
        console.error('Error saving outcome:', {
          error: outcomeError,
          errorString: JSON.stringify(outcomeError, Object.getOwnPropertyNames(outcomeError), 2),
          message: outcomeError?.message,
          code: outcomeError?.code,
          details: outcomeError?.details,
          hint: outcomeError?.hint,
          decisionId,
          outcomeData: {
            decision_id: decisionId,
            outcome_score_int: outcomeScore,
            outcome_reflection_text: `Quick check-in: ${outcomeResult === 'better' ? 'Better than expected' : outcomeResult === 'same' ? 'As expected' : 'Worse than expected'}`,
            learning_reflection_text: learning.trim() || null,
            learning_confidence_int: confidence,
            completed_at: now,
          },
        })
        
        // Provide more specific error messages
        let errorMessage = 'Failed to save outcome. Please try again.'
        if (outcomeError.message) {
          errorMessage = outcomeError.message
        } else if (outcomeError.code) {
          switch (outcomeError.code) {
            case '23503': // Foreign key violation
              errorMessage = 'Invalid decision reference. Please refresh and try again.'
              break
            case '23514': // Check constraint violation
              errorMessage = 'Invalid outcome data. Please check your inputs.'
              break
            case '23505': // Unique violation
              errorMessage = 'An outcome already exists for this decision.'
              break
            case 'PGRST116': // PostgREST error
              errorMessage = 'Database error. Please try again.'
              break
            default:
              errorMessage = `Error: ${outcomeError.code}. Please try again.`
          }
        }
        
        setError(errorMessage)
        setSaving(false)
        return
      }

      // 2. Validate update before applying
      const { validateDecisionUpdate } = await import('@/lib/decision-status')
      const updateValidation = validateDecisionUpdate(
        decision,
        existingOutcome || null,
        { outcome_id: outcome.id, status: 'completed' }
      )

      if (!updateValidation.valid) {
        console.error('⚠️ Decision update validation failed:', updateValidation.error)
        setError(updateValidation.error || 'Failed to update decision.')
        setSaving(false)
        return
      }

      // 3. Update decision: set outcome_id, completed_at, and transition to COMPLETED
      const { error: updateError } = await supabase
        .from('decisions')
        .update({
          outcome_id: outcome.id,
          completed_at: now, // Set completed_at timestamp
          status: 'completed', // Legacy field, kept for backward compatibility
        })
        .eq('id', decisionId)

      if (updateError) {
        console.error('Error updating decision:', updateError)
        setError('Failed to update decision. Please try again.')
        setSaving(false)
        return
      }

      // 4. Log event
      console.log('outcome_logged', {
        decision_id: decisionId,
        outcome_score: outcomeScore,
        learning_confidence: confidence,
      })

      // 5. Trigger Decision Health recalculation
      try {
        await fetch('/api/decision-health/recalculate', {
          method: 'POST',
        })
      } catch (err) {
        console.error('Error recalculating decision health:', err)
        // Don't fail the operation if health recalculation fails
      }

      // 6. Close modal
      handleClose()

      // 7. Trigger refresh and show toast via custom event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('outcomeCheckinSaved', { detail: { decisionId } }))
        router.refresh()
      }, 100)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
        setOutcomeResult(null)
        setConfidence(null)
        setLearning('')
        setSelfReflection('')
        setError(null)
        onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Outcome Check-in</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Close the loop. Capture the learning.</p>
            <p className="mt-3 text-sm font-medium text-[var(--text)]">{decisionTitle}</p>
          </div>

          {error && (
            <div className="text-sm text-[var(--danger)] bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)] rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Section 1: Outcome Result */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-3">
              How did this decision turn out?
            </label>
            <div className="space-y-2">
              {(['better', 'same', 'worse'] as OutcomeResult[]).map((result) => (
                <button
                  key={result}
                  onClick={() => setOutcomeResult(result)}
                  className={`w-full p-4 text-left rounded-xl border transition ${
                    outcomeResult === result
                      ? result === 'better'
                        ? 'border-[rgba(59,214,113,0.25)] bg-[rgba(59,214,113,0.12)]'
                        : result === 'worse'
                        ? 'border-[rgba(255,93,93,0.25)] bg-[rgba(255,93,93,0.12)]'
                        : 'border-[rgba(255,176,32,0.25)] bg-[rgba(255,176,32,0.12)]'
                      : 'border-[var(--border)] bg-[var(--surface-elevated)] hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {result === 'better' ? '👍' : result === 'same' ? '😐' : '👎'}
                    </span>
                    <span className="text-sm font-semibold">
                      {result === 'better'
                        ? 'Better than expected'
                        : result === 'same'
                        ? 'As expected'
                        : 'Worse than expected'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Confidence */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-3">
              Looking back, how confident were you in this decision?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {([20, 40, 60, 80, 100] as Confidence[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setConfidence(c)}
                  className={`rounded-xl border p-3 text-sm font-semibold transition ${
                    confidence === c
                      ? 'border-[var(--primary)] bg-[rgba(79,124,255,0.12)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  {c}%
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Learning (optional) */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              One thing you learned <span className="text-xs font-normal text-[var(--text-muted-2)]">(optional)</span>
            </label>
            <textarea
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              placeholder="Keep it short. One sentence is enough."
              rows={2}
              maxLength={240}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
            />
            <div className="flex justify-end mt-1">
              <p className="text-xs text-[var(--text-muted-2)]">
                {learning.length}/240
              </p>
            </div>
          </div>

          {/* Section 4: Self-Reflection (optional) */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              What did this teach you about yourself? <span className="text-xs font-normal text-[var(--text-muted-2)]">(optional)</span>
            </label>
            <textarea
              value={selfReflection}
              onChange={(e) => setSelfReflection(e.target.value)}
              placeholder="This closes the psychological loop."
              rows={2}
              maxLength={240}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
            />
            <div className="flex justify-end mt-1">
              <p className="text-xs text-[var(--text-muted-2)]">
                {selfReflection.length}/240
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="space-y-3 pt-2">
            <PrimaryButton onClick={handleSubmit} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save check-in'}
            </PrimaryButton>
            <SecondaryButton onClick={handleClose} disabled={saving} className="w-full">
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </Card>
    </div>
  )
}

