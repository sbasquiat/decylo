'use client'

import Link from 'next/link'
import { Card, CardHeader, CardBody } from './ui/Card'
import { Button, PrimaryButton, SecondaryButton } from './ui/Button'
import { StatusBadge } from './ui/StatusBadge'
import { TextInput } from './ui/TextInput'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { computeDecisionStatus } from '@/lib/decision-status'
import OnboardingModal from './OnboardingModal'
import OnboardingFlow from './OnboardingFlow'
import OnboardingToast from './OnboardingToast'
import FeedbackModal from './FeedbackModal'
import MorningAnchorBanner from './MorningAnchorBanner'
import OutcomeReminderToast from './OutcomeReminderToast'
import WeeklyReflectionModal from './WeeklyReflectionModal'
import SuccessToast from './SuccessToast'
import QuickCheckinModal from './QuickCheckinModal'
import UpgradeModal from './UpgradeModal'
import {
  getTodayInTimezone,
  getCurrentHourInTimezone,
  getCurrentMinutesInTimezone,
  getCurrentDayOfWeekInTimezone,
  getISOWeekString,
} from '@/lib/retention'

interface TodayScreenProps {
  checkin: any
  decisions: any[]
  outcomeDue: any
  completedToday: any | null
  streak: number
  decisionsThisWeek: number
  outcomesThisWeek: number
  totalDecisions: number
  totalOutcomes: number
  onboardingState: {
    onboarding_welcome_shown: boolean
    onboarding_first_decision_shown: boolean
    onboarding_first_outcome_shown: boolean
  }
  feedbackSubmitted: boolean
  retentionData: {
    lastDecisionDate: string | null
    userTimezone: string
    currentHour: number
    dayOfWeek: number
    currentWeek: string
    outcomeReminderDecision: { id: string; title: string } | null
    weeklyDecisionCount: number
    nudgeTracking: {
      last_morning_nudge_date: string | null
      last_outcome_nudge_date: string | null
      last_weekly_reflection_week: string | null
    }
  }
}

function TopBar() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">What deserves your attention?</p>
        <p className="mt-2 text-xs font-medium text-[var(--text)]">Is your judgment improving today?</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/app/timeline"
          className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:border-white/10 transition"
          aria-label="Timeline"
          title="Timeline"
        >
          Timeline
        </Link>
        <Link
          href="/app/insights"
          className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:border-white/10 transition"
          aria-label="Insights"
          title="Insights"
        >
          Insights
        </Link>
        <Link
          href="/app/settings"
          className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:border-white/10 transition"
          aria-label="Settings"
          title="Settings"
        >
          Settings
        </Link>
      </div>
    </div>
  )
}

function DailyCheckInCard({ focus, setFocus, onSave, onQuickCheckin, saving }: any) {
  return (
    <Card>
      <CardBody>
        <div className="space-y-3">
          <TextInput
            placeholder="Today's focus (optional) — e.g. Finish the proposal"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          />
          <div className="flex gap-2">
            <Link href="/app/new" className="flex-1">
              <PrimaryButton className="w-full">Add Decision</PrimaryButton>
            </Link>
            <SecondaryButton onClick={onQuickCheckin} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Quick Check-in'}
            </SecondaryButton>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Keep it simple. One decision at a time.
          </p>
        </div>
      </CardBody>
    </Card>
  )
}

function Pill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function MomentumStrip({ streak, decisionsThisWeek, outcomesThisWeek }: any) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{streak}-day streak</p>
          <p className="text-xs text-[var(--text-muted)]">You're building momentum.</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill label="Decisions this week" value={decisionsThisWeek} />
          <Pill label="Outcomes logged" value={outcomesThisWeek} />
        </div>
      </div>
    </div>
  )
}

function OutcomeDueCard({ outcomeDue, onQuickCheckin }: any) {
  if (!outcomeDue) return null

  return (
    <Card>
      <CardHeader
        title="Outcome due"
        subtitle="Close the loop. Log what happened."
      />
      <CardBody>
        <div className="space-y-3">
          <Link href={`/app/decision/${outcomeDue.id}`} className="block">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 hover:border-white/10 hover:bg-white/5 transition">
              <p className="text-sm font-semibold">{outcomeDue.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Decided {format(new Date(outcomeDue.date), 'PPP')} · Confidence{' '}
                {outcomeDue.confidence_int}%
              </p>
            </div>
          </Link>
          <PrimaryButton onClick={() => onQuickCheckin(outcomeDue)} className="w-full">
            Quick Check-in
          </PrimaryButton>
          <p className="text-xs text-[var(--text-muted)]">
            The learning is the feature.
          </p>
        </div>
      </CardBody>
    </Card>
  )
}

function CompletedTodayCard({ completedToday }: any) {
  if (!completedToday) return null

  return (
    <Card>
      <CardHeader
        title="Completed today"
        subtitle="Decision loop closed."
      />
      <CardBody>
        <div className="space-y-3">
          <Link href={`/app/decision/${completedToday.id}`} className="block">
            <div className="rounded-xl border border-[rgba(59,214,113,0.25)] bg-[rgba(59,214,113,0.12)] p-4 hover:border-[rgba(59,214,113,0.35)] transition">
              <p className="text-sm font-semibold">{completedToday.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Outcome logged today
              </p>
            </div>
          </Link>
          <p className="text-xs text-[var(--text-muted)]">
            Outcome logged.
          </p>
        </div>
      </CardBody>
    </Card>
  )
}

function TodaysDecisions({ decisions }: any) {
  return (
    <Card>
      <CardHeader
        title="Today's decisions"
        subtitle="Your recent decisions from today."
        right={
          <Link
            className="text-sm font-semibold text-[var(--primary)] hover:opacity-90"
            href="/app/timeline"
          >
            View all
          </Link>
        }
      />
      <CardBody>
        <div className="space-y-2">
          {decisions && decisions.length > 0 ? (
            decisions.map((decision: any) => (
              <Link
                key={decision.id}
                href={`/app/decision/${decision.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 hover:border-white/10 hover:bg-white/5 transition"
              >
                <div>
                  <p className="text-sm font-semibold">{decision.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Tap to view details</p>
                </div>
                <StatusBadge status={computeDecisionStatus(decision, decision.outcome || null)} />
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-center">
              <p className="text-sm text-[var(--text-muted)] mb-2">No decisions logged today.</p>
              <p className="text-xs font-medium text-[var(--text)]">Your future self is shaped by today's decisions.</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

function QuickLinksCard() {
  return (
    <Card>
      <CardHeader title="Quick links" subtitle="Jump back in." />
      <CardBody>
        <div className="grid grid-cols-2 gap-2">
          <QuickLink href="/app/new" title="New decision" />
          <QuickLink href="/app/insights" title="Insights" />
          <QuickLink href="/app/timeline" title="Timeline" />
          <QuickLink href="/app/settings" title="Settings" />
        </div>
      </CardBody>
    </Card>
  )
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold hover:bg-white/5 hover:border-white/10 transition"
    >
      {title}
    </Link>
  )
}

export default function TodayScreen({
  checkin,
  decisions,
  outcomeDue,
  completedToday,
  streak,
  decisionsThisWeek,
  outcomesThisWeek,
  totalDecisions,
  totalOutcomes,
  onboardingState,
  feedbackSubmitted,
  retentionData,
}: TodayScreenProps) {
  const router = useRouter()
  const [focus, setFocus] = useState(checkin?.focus || '')
  const [saving, setSaving] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false)
  const [showFirstDecisionToast, setShowFirstDecisionToast] = useState(false)
  const [showFirstOutcomeModal, setShowFirstOutcomeModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showMorningBanner, setShowMorningBanner] = useState(false)
  const [showOutcomeReminder, setShowOutcomeReminder] = useState(false)
  const [showWeeklyReflection, setShowWeeklyReflection] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successToastMessage, setSuccessToastMessage] = useState("Nice. You're building better judgment.")
  const [showQuickCheckinModal, setShowQuickCheckinModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalData, setUpgradeModalData] = useState<{ title?: string; message?: string; reason?: string } | null>(null)

  // Check for success toasts (decision created or outcome logged)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('decisionCreated') === 'true') {
      setSuccessToastMessage("Nice. You're building better judgment.")
      setShowSuccessToast(true)
      // Clean up URL
      window.history.replaceState({}, '', '/app')
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowSuccessToast(false)
      }, 5000)
    } else if (urlParams.get('outcomeLogged') === 'true') {
      setSuccessToastMessage('Outcome logged. Your judgment is improving.')
      setShowSuccessToast(true)
      // Clean up URL
      window.history.replaceState({}, '', '/app')
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowSuccessToast(false)
      }, 5000)
    }
  }, [])

  // Check onboarding state on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      // Stage 1: Onboarding flow (if no decisions and not shown)
      if (totalDecisions === 0 && !onboardingState.onboarding_welcome_shown) {
        setShowOnboardingFlow(true)
        return
      }

      // Stage 2: First decision toast (if 1 decision and not shown)
      if (totalDecisions === 1 && !onboardingState.onboarding_first_decision_shown) {
        // Mark as shown
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ onboarding_first_decision_shown: true })
            .eq('id', user.id)
        }
        setShowFirstDecisionToast(true)
        return
      }

      // Stage 3: First outcome modal (if 1 outcome and not shown)
      if (totalOutcomes === 1 && !onboardingState.onboarding_first_outcome_shown) {
        // Mark as shown
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ onboarding_first_outcome_shown: true })
            .eq('id', user.id)
        }
        setShowFirstOutcomeModal(true)
        return
      }
    }

    checkOnboarding()

    // Check feedback modal (show if user has logged at least one outcome and hasn't submitted feedback)
    if (totalOutcomes >= 1 && !feedbackSubmitted) {
      setShowFeedbackModal(true)
      return
    }

    // Check retention nudges
    const checkRetentionNudges = async () => {
      const today = getTodayInTimezone(retentionData.userTimezone)
      const currentHour = getCurrentHourInTimezone(retentionData.userTimezone)
      const currentMinutes = getCurrentMinutesInTimezone(retentionData.userTimezone)
      const dayOfWeek = getCurrentDayOfWeekInTimezone(retentionData.userTimezone)

      // Nudge #1: Morning Anchor (if no decision today AND time >= 10:30 AND not shown today)
      const isAfter1030 = currentHour > 10 || (currentHour === 10 && currentMinutes >= 30)
      
      if (
        retentionData.lastDecisionDate !== today &&
        isAfter1030 &&
        retentionData.nudgeTracking.last_morning_nudge_date !== today
      ) {
        setShowMorningBanner(true)
        return
      }

      // Nudge #2: Outcome Reminder (if decision from yesterday without outcome AND time >= 18:00 AND not shown today)
      if (
        retentionData.outcomeReminderDecision &&
        currentHour >= 18 &&
        retentionData.nudgeTracking.last_outcome_nudge_date !== today
      ) {
        setShowOutcomeReminder(true)
        return
      }

      // Nudge #3: Weekly Reflection (Sunday evening AND weekly_decision_count >= 3 AND not shown this week)
      if (
        dayOfWeek === 0 && // Sunday
        currentHour >= 18 &&
        retentionData.weeklyDecisionCount >= 3 &&
        retentionData.nudgeTracking.last_weekly_reflection_week !== retentionData.currentWeek
      ) {
        setShowWeeklyReflection(true)
        return
      }
    }

    checkRetentionNudges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDecisions, totalOutcomes])

  const handleWelcomeSkip = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_welcome_shown: true })
        .eq('id', user.id)
    }
    setShowWelcomeModal(false)
  }

  const handleMorningBannerDismiss = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const today = getTodayInTimezone(retentionData.userTimezone)
      await supabase
        .from('profiles')
        .update({ last_morning_nudge_date: today })
        .eq('id', user.id)
    }
    setShowMorningBanner(false)
  }

  const handleOutcomeReminderDismiss = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const today = getTodayInTimezone(retentionData.userTimezone)
      await supabase
        .from('profiles')
        .update({ last_outcome_nudge_date: today })
        .eq('id', user.id)
    }
    setShowOutcomeReminder(false)
  }

  const handleWeeklyReflectionClose = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ last_weekly_reflection_week: retentionData.currentWeek })
        .eq('id', user.id)
    }
    setShowWeeklyReflection(false)
  }

  const handleCheckinSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('checkins').upsert({
      user_id: user.id,
      date: today,
      focus: focus || null,
      completed_bool: false,
    })

    if (!error) {
      router.refresh()
    }
    setSaving(false)
  }

  // Get the most recent active decision for Quick Check-in
  // Priority: outcomeDue > first decision from today > most recent decided decision
  // Only allow check-in for decisions that are not yet completed
  const getActiveDecisionForCheckin = () => {
    if (outcomeDue) {
      // Check if outcomeDue is already completed (shouldn't happen, but safety check)
      return { id: outcomeDue.id, title: outcomeDue.title, isCompleted: false }
    }
    if (decisions && decisions.length > 0) {
      // Check if decision has outcome (completed)
      const decision = decisions[0]
      const hasOutcome = decision.outcome !== null && decision.outcome !== undefined
      return { id: decision.id, title: decision.title, isCompleted: hasOutcome }
    }
    return null
  }

  const activeDecision = getActiveDecisionForCheckin()

  const handleQuickCheckinClick = (decision?: any) => {
    const targetDecision = decision || activeDecision
    if (!targetDecision) {
      // No active decision available, show message or redirect
      setSuccessToastMessage("Create a decision first to use Quick Check-in.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
      return
    }
    
    // Prevent opening if already completed
    if (targetDecision.isCompleted) {
      setSuccessToastMessage("This decision is already completed.")
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
      return
    }
    
    setShowQuickCheckinModal(true)
  }

  const handleQuickCheckinClose = () => {
    setShowQuickCheckinModal(false)
  }

  // Listen for outcome check-in saved event
  useEffect(() => {
    const handleOutcomeCheckinSaved = (event: CustomEvent) => {
      setShowQuickCheckinModal(false)
      setSuccessToastMessage('Decision loop closed for today.')
      setShowSuccessToast(true)
      setTimeout(() => {
        setShowSuccessToast(false)
      }, 5000)
      router.refresh()
    }

    window.addEventListener('outcomeCheckinSaved', handleOutcomeCheckinSaved as EventListener)
    return () => window.removeEventListener('outcomeCheckinSaved', handleOutcomeCheckinSaved as EventListener)
  }, [router])

  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <TopBar />
          {showMorningBanner && (
            <MorningAnchorBanner onDismiss={handleMorningBannerDismiss} />
          )}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-4">
              <DailyCheckInCard
                focus={focus}
                setFocus={setFocus}
                onSave={handleCheckinSave}
                onQuickCheckin={handleQuickCheckinClick}
                saving={saving}
              />
              <MomentumStrip
                streak={streak}
                decisionsThisWeek={decisionsThisWeek}
                outcomesThisWeek={outcomesThisWeek}
              />
              <TodaysDecisions decisions={decisions} />
            </div>
            <div className="lg:col-span-5 space-y-4">
              {completedToday ? (
                <CompletedTodayCard completedToday={completedToday} />
              ) : (
                <OutcomeDueCard outcomeDue={outcomeDue} onQuickCheckin={handleQuickCheckinClick} />
              )}
              <QuickLinksCard />
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={showOnboardingFlow}
        onComplete={() => setShowOnboardingFlow(false)}
      />
      {/* Onboarding Modals */}
      <OnboardingModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeSkip}
        stage="welcome"
      />
      <OnboardingModal
        isOpen={showFirstOutcomeModal}
        onClose={() => setShowFirstOutcomeModal(false)}
        stage="first_outcome"
      />

      {/* Onboarding Toast */}
      <OnboardingToast
        isOpen={showFirstDecisionToast}
        onClose={() => setShowFirstDecisionToast(false)}
        title="Nice. This is where it begins."
        body="Return tomorrow and log the outcome. That's how your judgment improves."
        cta="Got it"
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Outcome Reminder Toast */}
      {showOutcomeReminder && retentionData.outcomeReminderDecision && (
        <OutcomeReminderToast
          decisionId={retentionData.outcomeReminderDecision.id}
          decisionTitle={retentionData.outcomeReminderDecision.title}
          onDismiss={handleOutcomeReminderDismiss}
        />
      )}

      {/* Weekly Reflection Modal */}
      <WeeklyReflectionModal
        isOpen={showWeeklyReflection}
        onClose={handleWeeklyReflectionClose}
        decisionCount={retentionData.weeklyDecisionCount}
      />

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        title={successToastMessage}
      />

      {/* Quick Check-in Modal */}
      {activeDecision && (
        <QuickCheckinModal
          isOpen={showQuickCheckinModal}
          onClose={handleQuickCheckinClose}
          decisionId={activeDecision.id}
          decisionTitle={activeDecision.title}
          isCompleted={activeDecision.isCompleted}
        />
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false)
          setUpgradeModalData(null)
        }}
        title={upgradeModalData?.title}
        message={upgradeModalData?.message}
        reason={upgradeModalData?.reason}
      />
    </>
  )
}
