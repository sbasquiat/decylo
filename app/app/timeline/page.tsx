import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, isWithinFreeTier } from '@/lib/subscription'
import TimelineClient from '@/components/TimelineClient'
import UpgradePrompt from '@/components/UpgradePrompt'

export default async function TimelinePage() {
  const supabase = await createClient()
  
  // CRITICAL: Refresh session first to ensure we have the latest auth state
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('TimelinePage: Session error', { error: sessionError.message })
    redirect('/signin')
  }

  // Get user from the refreshed session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('TimelinePage: Authentication error', {
      error: authError?.message,
      hasUser: !!user,
    })
    redirect('/signin')
  }

  // CRITICAL: Verify session user matches authenticated user
  if (session?.user?.id !== user.id) {
    console.error('TimelinePage: Session user mismatch!', {
      sessionUserId: session?.user?.id,
      authUserId: user.id,
    })
    redirect('/signin')
  }

  const plan = await getUserPlan()

  // Get all decisions
  const { data: decisions, error: decisionsError } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (decisionsError) {
    console.error('Error fetching decisions for Timeline page:', {
      error: decisionsError,
      errorString: JSON.stringify(decisionsError, Object.getOwnPropertyNames(decisionsError), 2),
      userId: user.id,
    })
  }

  // Get all outcomes for these decisions
  // CRITICAL: Verify all decisions belong to this user before fetching outcomes
  const decisionIds = decisions?.map((d) => d.id) || []
  
  // Double-check: Verify all decisions belong to this user (defensive check)
  if (decisions && decisions.length > 0) {
    const invalidDecisions = decisions.filter((d) => d.user_id !== user.id)
    if (invalidDecisions.length > 0) {
      console.error('SECURITY: Timeline - Found decisions not belonging to user!', {
        userId: user.id,
        invalidDecisionIds: invalidDecisions.map((d) => d.id),
      })
      decisionIds.length = 0
    }
  }
  
  const { data: outcomes } = decisionIds.length > 0
    ? await supabase
        .from('outcomes')
        .select('*')
        .in('decision_id', decisionIds)
    : { data: null }

  // Additional safety: Filter out any outcomes that don't belong to this user's decisions
  const safeOutcomes = outcomes?.filter((outcome: any) => {
    const decision = decisions?.find((d) => d.id === outcome.decision_id)
    if (!decision) return false
    if (decision.user_id !== user.id) {
      console.error('SECURITY: Timeline - Outcome belongs to different user!', {
        userId: user.id,
        outcomeDecisionId: outcome.decision_id,
        decisionUserId: decision.user_id,
      })
      return false
    }
    return true
  }) || []

  // Create a map of decision_id -> outcome for quick lookup (using safe filtered outcomes)
  const outcomeMap = new Map()
  safeOutcomes?.forEach((outcome: any) => {
    outcomeMap.set(outcome.decision_id, outcome)
  })

  // Attach outcomes to decisions and compute status
  const decisionsWithOutcomes = decisions?.map((decision) => ({
    ...decision,
    outcome: outcomeMap.get(decision.id) || null,
  })) || []

  // Filter decisions based on plan
  const freeDecisions = decisionsWithOutcomes.filter((d) => isWithinFreeTier(d.created_at))
  const allDecisions = plan.isPro ? decisionsWithOutcomes : freeDecisions

  // Check if there are decisions beyond 7 days for free users
  const hasOlderDecisions = !plan.isPro && decisionsWithOutcomes.some((d) => !isWithinFreeTier(d.created_at))

  return (
    <>
      {hasOlderDecisions && (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <UpgradePrompt
            reason="timeline"
            message="You've reached the 7-day limit. Upgrade to Pro to unlock your full decision history."
          />
        </div>
      )}
      <TimelineClient decisions={allDecisions} isPro={plan.isPro} />
    </>
  )
}
