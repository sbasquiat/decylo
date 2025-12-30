'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from './ui/Card'
import { StatusBadge } from './ui/StatusBadge'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { format } from 'date-fns'
import { Decision, Option, Outcome } from '@/lib/db/types'
import { formatScoreForDisplay } from '@/lib/scoring'
import { computeDecisionStatus } from '@/lib/decision-status'
import { formatCategory } from '@/lib/category-format'
import LogOutcomeModal from './LogOutcomeModal'
import QuickCheckinModal from './QuickCheckinModal'
import SuccessToast from './SuccessToast'

interface DecisionDetailProps {
  decision: Decision
  options: Option[]
  outcome: Outcome | null
  chosenOptionId: string | null
}

export default function DecisionDetail({
  decision,
  options,
  outcome,
  chosenOptionId,
}: DecisionDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chosenOption = options.find((opt) => opt.id === chosenOptionId)
  const [showOutcomeModal, setShowOutcomeModal] = useState(false)
  const [showQuickCheckinModal, setShowQuickCheckinModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Compute status from fields (strict state machine)
  const computedStatus = computeDecisionStatus(decision, outcome)
  const canLogOutcome = computedStatus === 'decided'

  // Auto-open modal if logOutcome query param is present
  useEffect(() => {
    if (canLogOutcome && searchParams.get('logOutcome') === 'true') {
      setShowOutcomeModal(true)
      // Clean up URL
      router.replace(`/app/decision/${decision.id}`, { scroll: false })
    }
  }, [canLogOutcome, searchParams, decision.id, router])

  // Listen for outcome saved events
  useEffect(() => {
    const handleOutcomeSaved = () => {
      setShowSuccessToast(true)
      router.refresh()
      // Auto-dismiss toast after 3 seconds
      setTimeout(() => setShowSuccessToast(false), 3000)
    }

    window.addEventListener('outcomeSaved', handleOutcomeSaved)
    window.addEventListener('outcomeCheckinSaved', handleOutcomeSaved)

    return () => {
      window.removeEventListener('outcomeSaved', handleOutcomeSaved)
      window.removeEventListener('outcomeCheckinSaved', handleOutcomeSaved)
    }
  }, [router])

  // Format outcome result text
  const getOutcomeResultText = () => {
    if (!outcome) return null
    const score = outcome.outcome_score_int
    if (score === 1) return 'Better than expected'
    if (score === -1) return 'Worse than expected'
    return 'As expected'
  }

  // Format dates - handle both created_at and date fields
  const createdDate = decision.created_at 
    ? new Date(decision.created_at)
    : new Date(decision.date)
  const decidedDate = decision.decided_at 
    ? format(new Date(decision.decided_at), 'MMMM d, yyyy')
    : format(createdDate, 'MMMM d, yyyy')
  const confidenceAtDecision = decision.confidence_int ?? null

  // Debug logging (remove in production if needed)
  useEffect(() => {
    console.log('DecisionDetail: Rendering with data:', {
      decisionId: decision.id,
      title: decision.title,
      status: computedStatus,
      hasOptions: options.length > 0,
      hasOutcome: !!outcome,
      chosenOptionId: chosenOptionId,
    })
  }, [decision.id, decision.title, computedStatus, options.length, outcome, chosenOptionId])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <Link
            href="/app/timeline"
            className="text-sm text-[var(--primary)] hover:opacity-90 mb-4 inline-block"
          >
            ← Back to Timeline
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight mb-2">{decision.title}</h1>
              <p className="text-sm text-[var(--text-muted)]">
                {decision.decided_at 
                  ? `Decided on ${decidedDate} · Category: ${formatCategory(decision.category)}${confidenceAtDecision !== null ? ` · Confidence: ${confidenceAtDecision}%` : ''}`
                  : outcome?.completed_at
                  ? `Completed on ${format(new Date(outcome.completed_at), 'MMMM d, yyyy')} · Category: ${formatCategory(decision.category)}`
                  : `Created on ${format(createdDate, 'MMMM d, yyyy')} · Category: ${formatCategory(decision.category)}`
                }
              </p>
            </div>
            <StatusBadge status={computedStatus} />
          </div>
        </div>

        <div className="space-y-6">
          {/* SECTION: Original Decision */}
          <Card>
            <CardHeader title="Original Decision" />
            <CardBody>
              {computedStatus === 'completed' && (
                <div className="mb-4 rounded-xl border border-[rgba(59,214,113,0.25)] bg-[rgba(59,214,113,0.12)] p-3">
                  <p className="text-xs text-[var(--text-muted)]">
                    ✓ This decision is completed and immutable. Core fields cannot be edited.
                  </p>
                </div>
              )}
              <div className="space-y-5">
                {/* Question/Title */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Question</h3>
                  <p className="text-sm text-[var(--text)]">{decision.title}</p>
                </div>

                {/* Context/Notes */}
                {decision.context && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Context</h3>
                    <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">
                      {decision.context}
                    </p>
                  </div>
                )}
                {decision.success_outcome && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Success looks like</h3>
                    <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                      {decision.success_outcome}
                    </p>
                  </div>
                )}
                {decision.constraints && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Constraints</h3>
                    <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">
                      {decision.constraints}
                    </p>
                  </div>
                )}
                {decision.risky_assumption && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Assumption that might be wrong</h3>
                    <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed italic">
                      {decision.risky_assumption}
                    </p>
                  </div>
                )}

                {/* Options List */}
                {options.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-[var(--text-muted)]">Options Considered</h3>
                    <div className="space-y-3">
                      {options.map((option) => (
                        <div
                          key={option.id}
                          className={`rounded-xl border p-4 transition ${
                            option.id === chosenOptionId
                              ? 'border-[rgba(79,124,255,0.25)] bg-[rgba(79,124,255,0.12)]'
                              : 'border-[var(--border)] bg-[var(--surface-elevated)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold">{option.label}</h4>
                                {option.id === chosenOptionId && (
                                  <span className="text-xs font-semibold text-[var(--primary)]">
                                    ✓ Chosen
                                  </span>
                                )}
                              </div>
                              {option.notes && (
                                <p className="text-sm text-[var(--text-muted)] mt-1">{option.notes}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                                <span>Outcome Impact: {option.impact_int}</span>
                                <span>Cost & Effort: {option.effort_int}</span>
                                <span>Downside Severity: {option.risk_int}</span>
                                <span className="font-semibold text-[var(--text)]">
                                  Expected Value: {formatScoreForDisplay(option.total_score_int)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chosen Option Summary */}
                {chosenOption && (
                  <div className="rounded-xl border border-[rgba(79,124,255,0.25)] bg-[rgba(79,124,255,0.12)] p-4">
                    <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Chosen Option</h3>
                    <p className="text-sm font-semibold text-[var(--text)] mb-1">{chosenOption.label}</p>
                    {chosenOption.notes && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">{chosenOption.notes}</p>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* SECTION: Thinking at the time */}
          {decision.decided_at && (
            <Card>
              <CardHeader title="Thinking at the time" />
              <CardBody>
                <div className="space-y-5">
                  {/* Decision Rationale */}
                  {decision.decision_rationale && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Why you chose this option</h3>
                      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                        {decision.decision_rationale}
                      </p>
                    </div>
                  )}

                  {/* Predicted Outcomes */}
                  {(decision.predicted_outcome_positive || decision.predicted_outcome_negative) && (
                    <div className="space-y-3">
                      {decision.predicted_outcome_positive && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">If it goes well</h3>
                          <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                            {decision.predicted_outcome_positive}
                          </p>
                        </div>
                      )}
                      {decision.predicted_outcome_negative && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2 text-[var(--text-muted)]">If it goes badly</h3>
                          <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                            {decision.predicted_outcome_negative}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confidence bar */}
                  {confidenceAtDecision !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[var(--text-muted)]">Confidence at decision</span>
                        <span className="text-sm text-[var(--text)] font-semibold">{confidenceAtDecision}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] transition-all"
                          style={{ width: `${confidenceAtDecision}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Predicted Impact Score */}
                  {chosenOption && (
                    <div>
                      <span className="text-sm font-semibold text-[var(--text-muted)] block mb-1">Predicted Impact Score</span>
                      <p className="text-sm text-[var(--text)] font-semibold">
                        {formatScoreForDisplay(chosenOption.total_score_int)} / 10.0
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* SECTION: Outcome & Learning (critical) */}
          <Card>
            <CardHeader title="Outcome & Learning" />
            <CardBody>
              {computedStatus === 'decided' ? (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-muted)]">Outcome pending</p>
                  <div className="space-y-3">
                    <PrimaryButton onClick={() => setShowOutcomeModal(true)} className="w-full">
                      Log outcome
                    </PrimaryButton>
                    <SecondaryButton onClick={() => setShowQuickCheckinModal(true)} className="w-full">
                      Quick check-in
                    </SecondaryButton>
                  </div>
                </div>
              ) : computedStatus === 'completed' && outcome ? (
                <div className="space-y-5">
                  {/* Outcome Result */}
                  <div>
                    <span className="text-sm font-semibold text-[var(--text-muted)] block mb-2">Result</span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                        outcome.outcome_score_int === 1
                          ? 'bg-[rgba(59,214,113,0.12)] text-white border-[rgba(59,214,113,0.25)]'
                          : outcome.outcome_score_int === -1
                          ? 'bg-[rgba(255,93,93,0.12)] text-white border-[rgba(255,93,93,0.25)]'
                          : 'bg-[rgba(255,176,32,0.12)] text-white border-[rgba(255,176,32,0.25)]'
                      }`}
                    >
                      <span>
                        {outcome.outcome_score_int === 1 ? '👍' : outcome.outcome_score_int === -1 ? '👎' : '😐'}
                      </span>
                      <span>{getOutcomeResultText()}</span>
                    </span>
                  </div>

                  {/* What happened */}
                  <div>
                    <span className="text-sm font-semibold text-[var(--text-muted)] block mb-2">What happened?</span>
                    <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                      {outcome.outcome_reflection_text || outcome.what_happened || ''}
                    </p>
                  </div>

                  {/* Self-Reflection */}
                  {outcome.self_reflection_text && (
                    <div>
                      <span className="text-sm font-semibold text-[var(--text-muted)] block mb-2">What did this teach you about yourself?</span>
                      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed italic">
                        {outcome.self_reflection_text}
                      </p>
                    </div>
                  )}

                  {/* Learning text */}
                  {outcome.learning_reflection_text && (
                    <div>
                      <span className="text-sm font-semibold text-[var(--text-muted)] block mb-2">What did you learn?</span>
                      <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                        {outcome.learning_reflection_text}
                      </p>
                    </div>
                  )}

                  {/* Learning confidence */}
                  {outcome.learning_confidence_int !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[var(--text-muted)]">Confidence in this learning</span>
                        <span className="text-sm text-[var(--text)] font-semibold">{outcome.learning_confidence_int}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] transition-all"
                          style={{ width: `${outcome.learning_confidence_int}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No outcome logged yet.</p>
              )}
            </CardBody>
          </Card>

          {/* SECTION: History (minimal audit) */}
          <Card>
            <CardHeader title="History" />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Created</span>
                  <span className="text-[var(--text)]">
                    {format(new Date(decision.created_at), 'MMM d, yyyy · h:mm a')}
                  </span>
                </div>
                {decision.decided_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Decided</span>
                    <span className="text-[var(--text)]">
                      {format(new Date(decision.decided_at), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                )}
                {outcome?.completed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Outcome logged</span>
                    <span className="text-[var(--text)]">
                      {format(new Date(outcome.completed_at), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Log Outcome Modal */}
      <LogOutcomeModal
        isOpen={showOutcomeModal}
        onClose={() => setShowOutcomeModal(false)}
        decisionId={decision.id}
        decisionTitle={decision.title}
      />

      {/* Quick Check-in Modal */}
      <QuickCheckinModal
        isOpen={showQuickCheckinModal}
        onClose={() => setShowQuickCheckinModal(false)}
        decisionId={decision.id}
        decisionTitle={decision.title}
        isCompleted={computedStatus === 'completed'}
      />

      {/* Success Toast */}
      <SuccessToast
          isOpen={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          title="Outcome logged. Your judgment is improving."
        />
    </div>
  )
}
