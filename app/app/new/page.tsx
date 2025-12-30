'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { DecisionCategory } from '@/lib/db/types'
import { calculateOptionScore, formatScoreForDisplay, getSuggestedOption } from '@/lib/scoring'
import ScoringSlider from '@/components/ScoringSlider'

interface Option {
  id: string
  label: string
  notes: string
  impact_int: number
  effort_int: number
  risk_int: number
  total_score_int: number
}

export default function NewDecisionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Step 1: Title + Category
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<DecisionCategory>('other')
  const [categoryCalibrationFeedback, setCategoryCalibrationFeedback] = useState<string | null>(null) // Gap 3: Category feedback
  
  // Check if user is new (no decisions yet) to show tooltip
  useEffect(() => {
    const checkIfNewUser = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        if (!user) return

        const { count } = await supabase
          .from('decisions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Show tooltip only if user has 0 decisions (first decision)
        setShowTooltip((count || 0) === 0)
      } catch (err) {
        console.error('Error checking decision count:', err)
      }
    }

    checkIfNewUser()
  }, [])
  
  // Fetch category calibration feedback when category changes (Gap 3)
  useEffect(() => {
    const fetchCategoryFeedback = async () => {
      if (!category) return
      
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        if (!user) return

        // Get past decisions in this category
        const { data: pastDecisions } = await supabase
          .from('decisions')
          .select('id, confidence_int')
          .eq('user_id', user.id)
          .eq('category', category)
          .not('confidence_int', 'is', null)
          .limit(10)

        if (!pastDecisions || pastDecisions.length < 3) {
          setCategoryCalibrationFeedback(null)
          return
        }

        // Get outcomes for these decisions
        const decisionIds = pastDecisions.map((d) => d.id)
        const { data: outcomes } = await supabase
          .from('outcomes')
          .select('decision_id, learning_confidence_int')
          .in('decision_id', decisionIds)
          .not('learning_confidence_int', 'is', null)

        if (!outcomes || outcomes.length < 3) {
          setCategoryCalibrationFeedback(null)
          return
        }

        // Calculate average calibration gap for this category
        const gaps: number[] = []
        for (const decision of pastDecisions) {
          const outcome = outcomes.find((o) => o.decision_id === decision.id)
          if (outcome && decision.confidence_int !== null && outcome.learning_confidence_int !== null) {
            const gap = Math.abs(decision.confidence_int - outcome.learning_confidence_int)
            gaps.push(gap)
          }
        }

        if (gaps.length >= 3) {
          const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
          setCategoryCalibrationFeedback(
            `In similar decisions, your confidence has been off by ~${Math.round(avgGap)}%.`
          )
        } else {
          setCategoryCalibrationFeedback(null)
        }
      } catch (err) {
        console.error('Error fetching category feedback:', err)
        setCategoryCalibrationFeedback(null)
      }
    }

    fetchCategoryFeedback()
  }, [category])

  // Step 2: Context + Success Outcome + Constraints + Risky Assumption
  const [context, setContext] = useState('')
  const [successOutcome, setSuccessOutcome] = useState('')
  const [constraints, setConstraints] = useState('')
  const [riskyAssumption, setRiskyAssumption] = useState('')

  // Step 3: Options
  const [options, setOptions] = useState<Option[]>(() => {
    const initOption = (id: string) => ({
      id,
      label: '',
      notes: '',
      impact_int: 5,
      effort_int: 5,
      risk_int: 5,
      total_score_int: calculateOptionScore({ impact_int: 5, effort_int: 5, risk_int: 5 }),
    })
    return [initOption('1'), initOption('2')]
  })

  // Step 4: Commit
  const [chosenOptionId, setChosenOptionId] = useState<string | null>(null)
  const [decisionRationale, setDecisionRationale] = useState('') // Required: Why choosing this option
  const [predictedOutcomePositive, setPredictedOutcomePositive] = useState('') // If it goes well
  const [predictedOutcomeNegative, setPredictedOutcomeNegative] = useState('') // If it goes badly
  const [confidence, setConfidence] = useState(50)
  const [nextAction, setNextAction] = useState('')
  const [nextActionDueDate, setNextActionDueDate] = useState('')
  const [commitmentConfirmed, setCommitmentConfirmed] = useState(false) // Commitment checkbox
  const [highImpactReflection, setHighImpactReflection] = useState('') // Gap 4: Anti-impulse mechanism

  const updateOption = (id: string, updates: Partial<Option>) => {
    setOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === id) {
          const updated = { ...opt, ...updates }
          updated.total_score_int = calculateOptionScore(updated)
          return updated
        }
        return opt
      })
    )
  }

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: '',
        notes: '',
        impact_int: 5,
        effort_int: 5,
        risk_int: 5,
        total_score_int: 0,
      },
    ])
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((opt) => opt.id !== id))
    }
  }

  const handleSubmit = async () => {
    if (!chosenOptionId) return

    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      // Ensure profile exists before creating decision (foreign key constraint)
      // The trigger should create it, but we'll verify and create if missing
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileCheckError) {
        console.error('Error checking profile:', profileCheckError)
      }

      if (!existingProfile) {
        // Profile doesn't exist - create it
        console.log('Profile not found, creating profile for user:', user.id)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            display_name: null,
            timezone: 'UTC',
          })

        if (profileError) {
          console.error('Failed to create profile:', {
            error: profileError,
            errorString: JSON.stringify(profileError, null, 2),
            userId: user.id,
          })
          setError('Failed to initialize your account. Please try again.')
          setLoading(false)
          return
        }
        console.log('Profile created successfully')
      }

      const today = new Date().toISOString().split('T')[0]

      // Validate required fields before submission
      if (!title.trim()) {
        setError('Please enter a decision title.')
        setLoading(false)
        return
      }

      if (!context.trim()) {
        setError('Please provide context for your decision.')
        setLoading(false)
        return
      }

      if (!successOutcome.trim()) {
        setError('Please define what success looks like for this decision.')
        setLoading(false)
        return
      }

      // Validate options have labels
      const validOptions = options.filter(opt => opt.label && opt.label.trim())
      if (validOptions.length < 2) {
        setError('Please provide at least 2 options with labels.')
        setLoading(false)
        return
      }

      // Validate chosen option exists
      const chosenOption = options.find(opt => opt.id === chosenOptionId)
      if (!chosenOption || !chosenOption.label.trim()) {
        setError('Please select a valid option.')
        setLoading(false)
        return
      }

      // Validate new required fields
      if (!decisionRationale.trim()) {
        setError('Please explain why you are choosing this option.')
        setLoading(false)
        return
      }

      if (!commitmentConfirmed) {
        setError('Please confirm that you understand you are committing to review this decision.')
        setLoading(false)
        return
      }

      // Create decision (chosen_option_id and decided_at will be set after options are created)
      const { data: decision, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          user_id: user.id,
          date: today,
          title: title.trim(),
          category,
          context: context.trim(),
          success_outcome: successOutcome.trim(),
          constraints: constraints?.trim() || null,
          risky_assumption: riskyAssumption?.trim() || null,
          chosen_option_id: null, // Will be updated after options are created
          decided_at: null, // Will be set when chosen_option_id is set
          confidence_int: confidence,
          next_action: nextAction?.trim() || null,
          next_action_due_date: nextActionDueDate || null,
          decision_rationale: decisionRationale.trim(),
          predicted_outcome_positive: predictedOutcomePositive?.trim() || null,
          predicted_outcome_negative: predictedOutcomeNegative?.trim() || null,
          commitment_confirmed: commitmentConfirmed,
          status: 'open', // Will be updated to 'decided' when chosen_option_id is set
        })
        .select()
        .single()

      if (decisionError) {
        // Enhanced error logging with full context
        const errorString = JSON.stringify(decisionError, Object.getOwnPropertyNames(decisionError), 2)
        console.error('Decision creation error:', {
          error: decisionError,
          errorString: errorString,
          errorKeys: Object.keys(decisionError),
          message: decisionError?.message,
          code: decisionError?.code,
          details: decisionError?.details,
          hint: decisionError?.hint,
          status: (decisionError as any)?.status,
          statusText: (decisionError as any)?.statusText,
          userId: user.id,
          decisionData: {
            title: title.trim(),
            category,
            date: today,
          },
        })

        // Better user-facing error messages
        let errorMessage = 'Failed to create decision. Please try again.'
        
        if (decisionError.message) {
          errorMessage = decisionError.message
        } else if (decisionError.code) {
          // Handle specific error codes
          switch (decisionError.code) {
            case '23503': // Foreign key violation
              errorMessage = 'Invalid user. Please sign in again.'
              break
            case '23505': // Unique violation
              errorMessage = 'This decision already exists.'
              break
            case '23514': // Check constraint violation
              errorMessage = 'Invalid decision data. Please check your inputs.'
              break
            case 'PGRST116': // PostgREST error
              errorMessage = 'Database error. Please try again.'
              break
            default:
              errorMessage = `Error: ${decisionError.code}. Please try again.`
          }
        }

        setError(errorMessage)
        setLoading(false)
        return
      }

      if (!decision) {
        setError('Failed to create decision. Please try again.')
        setLoading(false)
        return
      }

      // Create options (only valid ones with labels)
      const optionsToInsert = validOptions.map((opt) => ({
        decision_id: decision.id,
        label: opt.label.trim(),
        notes: opt.notes?.trim() || null,
        impact_int: opt.impact_int,
        effort_int: opt.effort_int,
        risk_int: opt.risk_int,
        total_score_int: opt.total_score_int,
      }))

      const { data: createdOptions, error: optionsError } = await supabase
        .from('options')
        .insert(optionsToInsert)
        .select()

      if (optionsError) {
        // Enhanced error logging
        console.error('Options creation error:', {
          error: optionsError,
          errorString: JSON.stringify(optionsError, null, 2),
          errorKeys: Object.keys(optionsError),
          message: optionsError?.message,
          code: optionsError?.code,
          details: optionsError?.details,
          hint: optionsError?.hint,
        })

        let errorMessage = 'Failed to save options. Please try again.'
        
        if (optionsError.message) {
          errorMessage = optionsError.message
        } else if (optionsError.code) {
          switch (optionsError.code) {
            case '23503': // Foreign key violation
              errorMessage = 'Invalid decision reference. Please try creating the decision again.'
              break
            case '23514': // Check constraint violation
              errorMessage = 'Invalid option data. Please check your scoring values.'
              break
            default:
              errorMessage = `Error: ${optionsError.code}. Please try again.`
          }
        }

        setError(errorMessage)
        setLoading(false)
        return
      }

      // Map chosen option to newly created option and update decision
      if (createdOptions && createdOptions.length > 0) {
        const chosenOption = validOptions.find(opt => opt.id === chosenOptionId)
        if (chosenOption) {
          // Find the created option that matches the chosen one by label
          // (since we can't match by local ID, we match by label)
          const createdChosenOption = createdOptions.find(
            (created: any) => created.label.trim() === chosenOption.label.trim()
          )
          
          if (createdChosenOption) {
            // Validate transition: OPEN → DECIDED
            const { validateDecisionUpdate, computeDecisionStatus } = await import('@/lib/decision-status')
            const currentStatus = computeDecisionStatus(decision, null)
            const updateValidation = validateDecisionUpdate(
              decision,
              null,
              { 
                chosen_option_id: createdChosenOption.id,
                decided_at: new Date().toISOString(),
                status: 'decided',
              }
            )

            if (!updateValidation.valid) {
              console.error('⚠️ Decision update validation failed:', updateValidation.error)
              // Don't fail the whole operation, but log it
            }

            // Update decision with chosen_option_id and decided_at (state machine: open -> decided)
            const decidedAt = new Date().toISOString()
            const { error: updateError } = await supabase
              .from('decisions')
              .update({ 
                chosen_option_id: createdChosenOption.id,
                decided_at: decidedAt,
                status: 'decided', // Legacy field, kept for backward compatibility
              })
              .eq('id', decision.id)

            if (updateError) {
              console.error('Error updating chosen_option_id and decided_at:', updateError)
              // Don't fail the whole operation, but log it
            }
          } else {
            console.error('Could not find created option matching chosen option')
          }
        }
      }

      // Log event
      console.log('decision_created', { decision_id: decision.id })

      // Redirect to Today page with success flag
      router.push('/app?decisionCreated=true')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      console.error('Unexpected error:', err)
      setError(errorMessage)
      setLoading(false)
    }
  }

  const suggestedOption = useMemo(() => {
    const opts = options.map(opt => ({
      id: opt.id,
      label: opt.label,
      notes: opt.notes,
      impact_int: opt.impact_int,
      effort_int: opt.effort_int,
      risk_int: opt.risk_int,
      total_score_int: opt.total_score_int,
    }))
    return getSuggestedOption(opts as any)
  }, [options])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/app"
            className="text-sm text-[var(--accent)] hover:opacity-90 mb-4 inline-block"
          >
            ← Back to Today
          </Link>
        </div>
        <Card className="p-6">
          <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s === step
                      ? 'bg-accent text-white'
                      : s < step
                      ? 'bg-success text-white'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-muted)]'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? 'bg-[var(--success)]' : 'bg-[var(--surface-elevated)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

                    {/* Step 1: Title + Category */}
                    {step === 1 && (
                      <div className="space-y-6">
                        <div>
                          <h1 className="text-xl font-semibold tracking-tight">What decision are you facing?</h1>
                          <p className="mt-2 text-sm text-[var(--text-muted)]">
                            Choose something real. Even small decisions count.
                          </p>
                          {/* Optional tooltip for first-time users */}
                          {showTooltip && (
                            <div className="mt-3 p-3 rounded-xl bg-[rgba(79,124,255,0.1)] border border-[rgba(79,124,255,0.2)]">
                              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                <span className="font-semibold text-[var(--text)]">Tip:</span> Write the context like you're explaining it to your future self. Clarity now becomes insight later.
                              </p>
                            </div>
                          )}
                        </div>
              <TextInput
                label="Decision Title"
                placeholder="e.g., Should I take the new job offer?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DecisionCategory)}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                >
                  <option value="career">Career</option>
                  <option value="money">Money</option>
                  <option value="health">Health</option>
                  <option value="relationships">Relationships</option>
                  <option value="life_lifestyle">Life & Lifestyle</option>
                  <option value="growth_learning">Growth & Learning</option>
                  <option value="time_priorities">Time & Priorities</option>
                  <option value="other">Other</option>
                </select>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Choose the area of your life this decision affects most.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!title}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Context + Success Outcome + Constraints + Risky Assumption */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">What matters here?</h1>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  This step sets the ground truth for the decision you're about to evaluate.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Context
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Describe the situation and what's important..."
                  rows={5}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Success looks like <span className="text-[var(--danger)]">*</span>
                </label>
                <textarea
                  value={successOutcome}
                  onChange={(e) => setSuccessOutcome(e.target.value)}
                  placeholder="If this decision goes well, what's the outcome you want?"
                  rows={2}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  One sentence. This anchors the rest of the decision process.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Constraints (optional)
                </label>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Money, time, energy, obligations, deadlines, people involved…"
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  What assumption are you making that might be wrong? <span className="text-xs font-normal text-[var(--text-muted)]">(optional, but encouraged)</span>
                </label>
                <textarea
                  value={riskyAssumption}
                  onChange={(e) => setRiskyAssumption(e.target.value)}
                  placeholder="This single question dramatically reduces self-deception..."
                  rows={2}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!context || !successOutcome.trim()}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Options */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Category calibration feedback (Gap 3) */}
              {categoryCalibrationFeedback && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-sm text-[var(--text)]">{categoryCalibrationFeedback}</p>
                </div>
              )}

              {/* Anti-impulse mechanism (Gap 4) - Check if any option has Impact ≥ 7 */}
              {options.some((opt) => opt.impact_int >= 7) && (
                <div className="rounded-xl border border-[rgba(255,176,32,0.25)] bg-[rgba(255,176,32,0.12)] p-4">
                  <p className="text-sm font-semibold text-[var(--text)] mb-2">
                    This is a high-impact decision.
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    Why does this decision matter in 6 months?
                  </p>
                  <textarea
                    value={highImpactReflection}
                    onChange={(e) => setHighImpactReflection(e.target.value)}
                    placeholder="Think about the long-term impact..."
                    rows={3}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
                  />
                  {highImpactReflection.length > 0 && highImpactReflection.length < 20 && (
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {20 - highImpactReflection.length} more characters required.
                    </p>
                  )}
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold tracking-tight">List your options and model their outcomes.</h1>
              </div>
              {options.map((option, idx) => (
                <Card key={option.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold">Option {idx + 1}</h3>
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(option.id)}
                          className="text-danger text-sm hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <TextInput
                      placeholder="Option label"
                      value={option.label}
                      onChange={(e) => updateOption(option.id, { label: e.target.value })}
                    />
                    <textarea
                      placeholder="Notes (optional)"
                      value={option.notes}
                      onChange={(e) => updateOption(option.id, { notes: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                    />
                    <div className="space-y-4 mb-4">
                      <p className="text-xs text-[var(--text-muted)] italic">
                        We evaluate each option by modeling the future it creates — not by how it feels today.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <ScoringSlider
                        label="Outcome Impact"
                        value={option.impact_int}
                        onChange={(value) => updateOption(option.id, { impact_int: value })}
                        dimension="impact"
                      />
                      <ScoringSlider
                        label="Cost & Effort"
                        value={option.effort_int}
                        onChange={(value) => updateOption(option.id, { effort_int: value })}
                        dimension="effort"
                      />
                      <ScoringSlider
                        label="Downside Severity"
                        value={option.risk_int}
                        onChange={(value) => updateOption(option.id, { risk_int: value })}
                        dimension="risk"
                      />
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Expected Value: <span className="font-semibold">{formatScoreForDisplay(option.total_score_int)}</span>
                    </div>
                  </div>
                </Card>
              ))}
              {options.length < 5 && (
                <Button variant="secondary" onClick={addOption} className="w-full">
                  Add Option
                </Button>
              )}
              {suggestedOption && (
                <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl">
                  <p className="text-sm">
                    <span className="font-medium">Decylo Recommendation:</span> {suggestedOption.label} (Expected Value:{' '}
                    {formatScoreForDisplay(suggestedOption.total_score_int)})
                  </p>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={options.some((opt) => !opt.label)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Commit */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Commit</h1>
              </div>
              {error && (
                <div className="text-sm text-[var(--danger)] bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)] rounded-xl p-3">
                  {error}
                </div>
              )}
              
              {/* Choose Option */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Choose Option
                </label>
                <div className="space-y-2">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setChosenOptionId(option.id)}
                      className={`w-full p-4 text-left border rounded-xl transition-all ${
                        chosenOptionId === option.id
                          ? 'border-accent bg-accent/10'
                          : 'border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[rgba(79,124,255,0.30)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{option.label}</div>
                          {option.notes && (
                            <div className="text-sm text-[var(--text-muted)] mt-1">{option.notes}</div>
                          )}
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">Expected Value: {formatScoreForDisplay(option.total_score_int)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Decision Rationale (Required) */}
              {chosenOptionId && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                    Why are you choosing this option? <span className="text-[var(--danger)]">*</span>
                  </label>
                  <textarea
                    value={decisionRationale}
                    onChange={(e) => setDecisionRationale(e.target.value)}
                    placeholder="In one sentence, explain the core reason for your choice."
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    This is the main assumption behind your decision. You'll review this later.
                  </p>
                </div>
              )}

              {/* Predicted Outcome - Positive */}
              {chosenOptionId && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                    If this goes well, what will change in your life?
                  </label>
                  <textarea
                    value={predictedOutcomePositive}
                    onChange={(e) => setPredictedOutcomePositive(e.target.value)}
                    placeholder="e.g. Higher income, faster growth, more energy, less stress."
                    rows={2}
                    maxLength={300}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Be specific. This becomes your prediction.
                  </p>
                </div>
              )}

              {/* Predicted Outcome - Negative */}
              {chosenOptionId && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                    If this goes badly, what's the worst realistic outcome?
                  </label>
                  <textarea
                    value={predictedOutcomeNegative}
                    onChange={(e) => setPredictedOutcomeNegative(e.target.value)}
                    placeholder="e.g. Burnout, lost time, missed opportunity."
                    rows={2}
                    maxLength={300}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition resize-none"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Don't catastrophize — just be honest.
                  </p>
                </div>
              )}

              {/* Confidence Slider */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  How confident are you this decision will turn out well?
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-[var(--text-muted)] mt-1">{confidence}%</div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  This is your probability estimate. Over time, Decylo measures how accurate this is.
                </p>
              </div>

              {/* Next Action */}
              <TextInput
                label="Next Action (optional)"
                placeholder="What's the first step?"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
              />

              {/* Due Date */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={nextActionDueDate}
                  onChange={(e) => setNextActionDueDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  We'll remind you to review this decision and log what actually happened. That's how your judgment improves.
                </p>
              </div>

              {/* Commitment Checkbox */}
              <div className="flex items-start space-x-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
                <input
                  type="checkbox"
                  id="commitment-check"
                  checked={commitmentConfirmed}
                  onChange={(e) => setCommitmentConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                />
                <label htmlFor="commitment-check" className="text-sm text-[var(--text)] cursor-pointer flex-1">
                  I understand I'm committing to this decision and will review its outcome.
                </label>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!chosenOptionId || !decisionRationale.trim() || !commitmentConfirmed || loading}
                >
                  {loading ? 'Saving...' : 'Commit'}
                </Button>
              </div>
            </div>
          )}
          </div>
        </Card>
      </div>
    </div>
  )
}

