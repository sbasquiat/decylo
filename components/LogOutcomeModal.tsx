'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { useRouter } from 'next/navigation'

type OutcomeResult = 'better' | 'as_expected' | 'worse'

interface LogOutcomeModalProps {
  isOpen: boolean
  onClose: () => void
  decisionId: string
  decisionTitle: string
}

export default function LogOutcomeModal({
  isOpen,
  onClose,
  decisionId,
  decisionTitle,
}: LogOutcomeModalProps) {
  const router = useRouter()
  const [outcomeResult, setOutcomeResult] = useState<OutcomeResult | null>(null)
  const [whatHappened, setWhatHappened] = useState('')
  const [whatLearned, setWhatLearned] = useState('')
  const [learningConfidence, setLearningConfidence] = useState(50)
  const [temporalAnchor, setTemporalAnchor] = useState<'1_day' | '1_week' | '1_month' | '3_months' | null>(null)
  const [counterfactual, setCounterfactual] = useState('')
  const [selfReflection, setSelfReflection] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOutcomeResult(null)
      setWhatHappened('')
      setWhatLearned('')
      setLearningConfidence(50)
      setTemporalAnchor(null)
      setCounterfactual('')
      setSelfReflection('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const getOutcomeScore = (result: OutcomeResult): number => {
    switch (result) {
      case 'better':
        return 1
      case 'as_expected':
        return 0
      case 'worse':
        return -1
    }
  }

  const handleSubmit = async () => {
    // Validation: All required fields must be present
    if (!outcomeResult) {
      setError('Please select how the decision turned out.')
      return
    }

    if (!whatHappened.trim()) {
      setError('Please describe what happened.')
      return
    }

    if (whatHappened.trim().length > 240) {
      setError('What happened must be 240 characters or less.')
      return
    }

    if (whatLearned.trim().length > 240) {
      setError('What you learned must be 240 characters or less.')
      return
    }

    // Confidence in learning is required (per spec)
    // But only validate if user provided learning text
    if (whatLearned.trim()) {
      if (learningConfidence === null || learningConfidence < 0 || learningConfidence > 100) {
        setError('Please set your confidence in this learning.')
        return
      }
    }

    // Temporal anchor is required (Gap 2)
    if (!temporalAnchor) {
      setError('Please select how much time has passed since the decision.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
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

      const outcomeScore = getOutcomeScore(outcomeResult)
      const completedAt = new Date().toISOString()

      // Build insert payload - only include fields that exist in schema
      const insertPayload: any = {
        decision_id: decisionId,
        outcome_score_int: outcomeScore,
        outcome_reflection_text: whatHappened.trim(),
        learning_reflection_text: whatLearned.trim() || '', // NOT NULL field - use empty string if no learning provided
        completed_at: completedAt,
        // Legacy fields for backward compatibility
        outcome_status: outcomeResult === 'better' ? 'won' : outcomeResult === 'worse' ? 'lost' : 'neutral',
        what_happened: whatHappened.trim(),
        lesson: whatLearned.trim() || '', // Use empty string if NOT NULL constraint exists
      }

      // Add optional fields only if they have values (columns may not exist in older schemas)
      if (whatLearned.trim() && learningConfidence !== null) {
        insertPayload.learning_confidence_int = learningConfidence
      }
      
      // temporal_anchor is required in UI, so it should always be set
      // But handle gracefully if column doesn't exist in database
      if (temporalAnchor) {
        insertPayload.temporal_anchor = temporalAnchor
      }
      
      if (counterfactual.trim()) {
        insertPayload.counterfactual_reflection_text = counterfactual.trim()
      }
      
      if (selfReflection.trim()) {
        insertPayload.self_reflection_text = selfReflection.trim()
      }

      // Insert outcome
      // Wrap in try-catch to catch any network or unexpected errors
      let outcome: any = null
      let outcomeError: any = null
      
      try {
        const result = await supabase
          .from('outcomes')
          .insert(insertPayload)
          .select()
          .single()
        
        outcome = result.data
        outcomeError = result.error
      } catch (err) {
        // Catch any unexpected errors (network, parsing, etc.)
        console.error('Unexpected error during outcome insert:', err)
        outcomeError = err
      }

      if (outcomeError) {
        // Enhanced error logging - try multiple methods to extract error info
        console.log('=== OUTCOME ERROR DEBUG ===')
        console.log('Error type:', typeof outcomeError)
        console.log('Error constructor:', outcomeError?.constructor?.name)
        console.log('Error instanceof Error:', outcomeError instanceof Error)
        console.log('Error keys:', Object.keys(outcomeError || {}))
        console.log('Error own properties:', Object.getOwnPropertyNames(outcomeError || {}))
        
        let errorString = '{}'
        let errorKeys: string[] = []
        try {
          errorString = JSON.stringify(outcomeError, Object.getOwnPropertyNames(outcomeError), 2)
          errorKeys = Object.keys(outcomeError)
        } catch (e) {
          // If JSON.stringify fails, try toString
          errorString = String(outcomeError)
          errorKeys = ['toString']
          console.log('JSON.stringify failed, using String():', errorString)
        }
        
        // Try to extract message using multiple methods
        const extractedErrorMessage = 
          (outcomeError as any)?.message || 
          (outcomeError as any)?.error_description || 
          (outcomeError as any)?.error?.message ||
          outcomeError?.toString?.() ||
          String(outcomeError) || 
          'Unknown error'
        
        // Try to extract code
        const extractedErrorCode = 
          (outcomeError as any)?.code || 
          (outcomeError as any)?.error_code ||
          (outcomeError as any)?.error?.code ||
          null
        
        // Extract error properties using multiple methods
        const errorDetails = {
          error: outcomeError,
          errorType: typeof outcomeError,
          errorConstructor: outcomeError?.constructor?.name,
          errorString: errorString,
          errorKeys: errorKeys,
          message: extractedErrorMessage,
          code: extractedErrorCode,
          details: (outcomeError as any)?.details || (outcomeError as any)?.error?.details || null,
          hint: (outcomeError as any)?.hint || (outcomeError as any)?.error?.hint || null,
          status: (outcomeError as any)?.status || (outcomeError as any)?.error?.status || null,
          statusText: (outcomeError as any)?.statusText || (outcomeError as any)?.error?.statusText || null,
          // Try to get all enumerable properties
          allProps: Object.getOwnPropertyNames(outcomeError || {}).reduce((acc, key) => {
            try {
              acc[key] = (outcomeError as any)[key]
            } catch {
              acc[key] = '[unable to access]'
            }
            return acc
          }, {} as Record<string, any>),
          insertData: {
            decision_id: decisionId,
            outcome_score_int: outcomeScore,
            outcome_reflection_text: whatHappened.trim().substring(0, 50),
            learning_reflection_text: whatLearned.trim().substring(0, 50) || '(empty)',
            learning_confidence_int: whatLearned.trim() ? learningConfidence : null,
            completed_at: completedAt,
            temporal_anchor: temporalAnchor,
            counterfactual_reflection_text: counterfactual.trim() || null,
            payloadKeys: Object.keys(insertPayload),
          },
        }
        
        // Log error object directly first (before serialization)
        console.error('Error saving outcome - raw error:', outcomeError)
        console.error('Error saving outcome - details:', errorDetails)
        console.log('=== END ERROR DEBUG ===')
        
        // Provide user-friendly error message
        let userMessage = 'Failed to save outcome. Please try again.'
        const errorMessage = errorDetails.message || ''
        const errorCode = errorDetails.code
        
        if (errorMessage && errorMessage !== 'Unknown error') {
          if (errorMessage.includes('null value') || errorMessage.includes('NOT NULL')) {
            userMessage = 'Please fill in all required fields.'
          } else if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
            userMessage = 'Database schema mismatch. Please run migrations. Check console for details.'
          } else if (errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('row-level security')) {
            userMessage = 'Permission denied. Please sign in again.'
          } else {
            // Show the actual error message if available
            userMessage = errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage
          }
        } else if (errorCode) {
          // Handle specific error codes
          switch (errorCode) {
            case '23503': // Foreign key violation
              userMessage = 'Invalid decision. Please try again.'
              break
            case '23505': // Unique violation
              userMessage = 'Outcome already exists for this decision.'
              break
            case '23514': // Check constraint violation
              userMessage = 'Invalid outcome data. Please check your inputs.'
              break
            case 'PGRST116': // PostgREST error
              userMessage = 'Database error. Please try again.'
              break
            case '42501': // Permission denied
              userMessage = 'Permission denied. Please sign in again.'
              break
            default:
              userMessage = `Error: ${errorDetails.code}. Please try again.`
          }
        }
        
        setError(userMessage)
        setSaving(false)
        return
      }

      // Validate update before applying
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

      // Update decision with outcome_id (state machine: decided -> completed)
      // Keep decided_at unchanged
      // Note: completed_at is stored on the outcome record, not the decision
      const { error: updateError } = await supabase
        .from('decisions')
        .update({ 
          outcome_id: outcome.id,
          status: 'completed', // Legacy field, kept for backward compatibility
        })
        .eq('id', decisionId)

      if (updateError) {
        console.error('Error updating decision status:', updateError)
        // Don't fail the whole operation, but log it
      }

      // Log event
      console.log('outcome_logged', {
        decision_id: decisionId,
        outcome_score: outcomeScore,
        learning_confidence: whatLearned.trim() ? learningConfidence : null,
      })

      // Check if this is the 3rd outcome and trigger upgrade modal
      const { data: allOutcomes } = await supabase
        .from('outcomes')
        .select('id')
        .eq('user_id', decision.user_id)
      
      const outcomeCount = allOutcomes?.length || 0
      
      if (outcomeCount === 3) {
        // Dispatch event to show upgrade modal
        window.dispatchEvent(new CustomEvent('showUpgradeModal', { 
          detail: { 
            reason: 'outcome_3',
            title: "Your Decision Health is starting to form",
            message: "You've logged 3 outcomes. This is where Decylo becomes a judgment engine instead of a notebook. Unlock Pro to see your full Decision Health profile and track how your judgment is improving."
          } 
        }))
        console.log('upgrade_viewed', { reason: 'outcome_3' })
      }

      // Trigger Decision Health recalculation
      try {
        await fetch('/api/decision-health/recalculate', {
          method: 'POST',
        })
      } catch (err) {
        console.error('Error recalculating decision health:', err)
        // Don't fail the operation if health recalculation fails
      }

      // Generate immediate insight feedback (Gap 5)
      try {
        const { generateInsightFeedback } = await import('@/lib/insight-feedback')
        const { data: allDecisions } = await supabase
          .from('decisions')
          .select('*')
          .eq('user_id', decision.user_id)
        
        const { data: allOutcomes } = await supabase
          .from('outcomes')
          .select('*')
          .in('decision_id', allDecisions?.map((d) => d.id) || [])
        
        if (allDecisions && allOutcomes) {
          const feedback = generateInsightFeedback(allDecisions, allOutcomes, outcome)
          if (feedback) {
            window.dispatchEvent(new CustomEvent('insightFeedback', { detail: feedback }))
          }
        }
      } catch (err) {
        console.error('Error generating insight feedback:', err)
        // Don't fail the operation if feedback generation fails
      }

      // Close modal
      onClose()
      
      // Dispatch event to show toast and refresh
      window.dispatchEvent(new CustomEvent('outcomeSaved', { detail: { decisionId } }))
      router.refresh()
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setOutcomeResult(null)
      setWhatHappened('')
      setWhatLearned('')
      setLearningConfidence(50)
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">How did this decision turn out?</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">{decisionTitle}</p>
          </div>

          {error && (
            <div className="text-sm text-[var(--danger)] bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)] rounded-xl p-3">
              {error}
            </div>
          )}

          {/* 1. Outcome Result */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-3">
              1️⃣ Outcome Result
            </label>
            <div className="space-y-2">
              {(['better', 'as_expected', 'worse'] as OutcomeResult[]).map((result) => (
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
                      {result === 'better' ? '👍' : result === 'as_expected' ? '😐' : '👎'}
                    </span>
                    <span className="text-sm font-semibold">
                      {result === 'better'
                        ? 'Better than expected'
                        : result === 'as_expected'
                        ? 'As expected'
                        : 'Worse than expected'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Temporal Anchor (Gap 2) */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              2️⃣ Looking back after how much time? <span className="text-xs font-normal">(Required)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['1_day', '1_week', '1_month', '3_months'] as const).map((anchor) => (
                <button
                  key={anchor}
                  onClick={() => setTemporalAnchor(anchor)}
                  className={`p-3 text-sm rounded-xl border transition ${
                    temporalAnchor === anchor
                      ? 'border-[var(--primary)] bg-[rgba(79,124,255,0.12)] text-[var(--text)]'
                      : 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  {anchor === '1_day' ? '1 day' : anchor === '1_week' ? '1 week' : anchor === '1_month' ? '1 month' : '3 months'}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted-2)] mt-2">
              This prevents premature judgments and gives your data real meaning.
            </p>
          </div>

          {/* 3. What happened? */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              3️⃣ What happened? <span className="text-xs font-normal">(1–3 sentences)</span>
            </label>
            <textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder="I went to the gym. Energy improved. Felt more focused afterward."
              rows={3}
              maxLength={240}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-[var(--text-muted-2)]">
                Keep it focused. 1–3 sentences.
              </p>
              <p className="text-xs text-[var(--text-muted-2)]">
                {whatHappened.length}/240
              </p>
            </div>
          </div>

          {/* 4. What did you learn? */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              4️⃣ What did you learn? <span className="text-xs font-normal text-[var(--text-muted-2)]">(Optional)</span>
            </label>
            <textarea
              value={whatLearned}
              onChange={(e) => setWhatLearned(e.target.value)}
              placeholder="Even when I feel tired, starting creates momentum."
              rows={3}
              maxLength={240}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-[var(--text-muted-2)]">
                This is where Decylo's value compounds.
              </p>
              <p className="text-xs text-[var(--text-muted-2)]">
                {whatLearned.length}/240
              </p>
            </div>
          </div>

          {/* 5. Counterfactual Reflection (Gap 4) */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              5️⃣ What do you think would have happened if you chose the other option? <span className="text-xs font-normal text-[var(--text-muted-2)]">(Optional)</span>
            </label>
            <textarea
              value={counterfactual}
              onChange={(e) => setCounterfactual(e.target.value)}
              placeholder="This strengthens learning and reveals optimism bias."
              rows={3}
              maxLength={240}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-[var(--text-muted-2)]">
                This question improves calibration and reveals bias.
              </p>
              <p className="text-xs text-[var(--text-muted-2)]">
                {counterfactual.length}/240
              </p>
            </div>
          </div>

          {/* 6. Learning Confidence (required if learning provided) */}
          {whatLearned.trim() && (
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              6️⃣ How confident are you in this learning?
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={learningConfidence}
                onChange={(e) => setLearningConfidence(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-muted-2)]">0%</span>
                <span className="text-sm font-semibold">{learningConfidence}%</span>
                <span className="text-xs text-[var(--text-muted-2)]">100%</span>
              </div>
              <p className="text-xs text-[var(--text-muted-2)]">
                This feeds your Decision Health model.
              </p>
            </div>
          </div>
          )}

          {/* 7. Self-Reflection (after completion) */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
              7️⃣ What did this decision teach you about yourself? <span className="text-xs font-normal text-[var(--text-muted-2)]">(Optional)</span>
            </label>
            <textarea
              value={selfReflection}
              onChange={(e) => setSelfReflection(e.target.value)}
              placeholder="This is where judgment growth happens. What did you learn about your decision-making patterns?"
              rows={3}
              maxLength={240}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-[var(--text-muted-2)]">
                This closes the psychological loop.
              </p>
              <p className="text-xs text-[var(--text-muted-2)]">
                {selfReflection.length}/240
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <PrimaryButton onClick={handleSubmit} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save outcome'}
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

