import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, isWithinFreeTier } from '@/lib/subscription'
import DecisionDetail from '@/components/DecisionDetail'
import DecisionDetailWithPaywall from '@/components/DecisionDetailWithPaywall'

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // In Next.js 15+, params is a Promise and must be awaited
  const { id } = await params
  
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Enhanced error handling: distinguish "not authenticated" vs other errors
  if (authError || !user) {
    console.error('Decision Detail: Authentication error:', {
      decisionId: id,
      authError: authError?.message,
      hasUser: !!user,
    })
    redirect('/signin?returnTo=' + encodeURIComponent(`/app/decision/${id}`))
  }

  const plan = await getUserPlan()

  // Fetch decision - use EXACT same table and query pattern as Timeline
  // Timeline query: .from('decisions').select('*').eq('user_id', user.id)
  // We query by id AND user_id for consistency and safety
  // Both use the same table: 'decisions'
  // Both filter by user_id: user.id
  // Both use the same Supabase server client with authenticated context
  
  // First, verify the decision ID format (should be UUID)
  if (!id || typeof id !== 'string' || id.length < 30) {
    console.error('Decision Detail: Invalid decision ID format:', {
      decisionId: id,
      userId: user.id,
    })
    notFound()
  }

  const { data: decision, error: decisionError } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Explicit user filter (RLS also enforces this, but explicit is safer)
    .maybeSingle() // Use maybeSingle() instead of single() - returns null instead of error when no rows

  // Enhanced error handling with detailed logging
  if (decisionError) {
    // Serialize error object properly to capture all properties
    // Try multiple serialization methods to capture error details
    let errorString = '{}'
    let errorKeys: string[] = []
    try {
      errorString = JSON.stringify(decisionError, Object.getOwnPropertyNames(decisionError), 2)
      errorKeys = Object.keys(decisionError)
    } catch (e) {
      // If JSON.stringify fails, try toString
      errorString = String(decisionError)
      errorKeys = ['toString']
    }
    
    // Try to extract error properties using multiple methods
    const errorDetails = {
      decisionId: id,
      userId: user.id,
      table: 'decisions',
      error: decisionError,
      errorString: errorString,
      errorKeys: errorKeys,
      code: (decisionError as any)?.code || (decisionError as any)?.error_code || null,
      message: (decisionError as any)?.message || (decisionError as any)?.error_description || String(decisionError) || null,
      details: (decisionError as any)?.details || null,
      hint: (decisionError as any)?.hint || null,
      status: (decisionError as any)?.status || null,
      statusText: (decisionError as any)?.statusText || null,
      // Try to get all enumerable properties
      allProps: Object.getOwnPropertyNames(decisionError).reduce((acc, key) => {
        try {
          acc[key] = (decisionError as any)[key]
        } catch {
          acc[key] = '[unable to access]'
        }
        return acc
      }, {} as Record<string, any>),
    }

    console.error('Decision Detail: Query error:', errorDetails)

    // Check for authentication errors (shouldn't happen here since we check auth above, but log it)
    const errorMessage = decisionError?.message || ''
    if (errorMessage.includes('JWT') || errorMessage.includes('authentication') || errorMessage.includes('Unauthorized')) {
      console.error('Decision Detail: Authentication error (unexpected):', errorDetails)
      redirect('/signin?returnTo=' + encodeURIComponent(`/app/decision/${id}`))
    }

    // Check for RLS denial (permission error)
    const errorCode = decisionError?.code || ''
    if (errorCode === '42501' || errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('row-level security')) {
      console.error('Decision Detail: RLS denied (permission error):', {
        decisionId: id,
        userId: user.id,
        code: errorCode,
        message: errorMessage,
        errorString: errorString,
        hint: 'This decision may not belong to this user or RLS policy is blocking access',
      })
      notFound()
    }

    // Check for "not found" errors (PGRST116 is PostgREST "no rows" error)
    if (errorCode === 'PGRST116' || errorMessage.includes('No rows') || errorMessage.includes('not found') || errorMessage.includes('Could not find')) {
      // Decision doesn't exist
      console.error('Decision Detail: Not found (no matching record):', {
        decisionId: id,
        userId: user.id,
        code: errorCode,
        message: errorMessage,
        errorString: errorString,
        hint: 'Decision does not exist or was deleted',
      })
      notFound()
    }

    // For other errors (network, timeout, etc.), still show not found but log extensively
    console.error('Decision Detail: Unexpected query error:', errorDetails)
    notFound()
  }

  // Handle case where decision is null (maybeSingle returns null instead of error for no rows)
  if (!decision) {
    // Check if there was an error that we might have missed
    if (decisionError) {
      // Error was already logged above, just show not found
      notFound()
    }
    
    // No error but no decision - likely doesn't exist or RLS blocked
    console.error('Decision Detail: Null result (no decision returned):', {
      decisionId: id,
      userId: user.id,
      table: 'decisions',
      hasError: !!decisionError,
      hint: 'Query returned null - decision may not exist, was deleted, or RLS blocked access',
    })
    notFound()
  }

  // Verify the decision belongs to the user (double-check, though RLS should enforce this)
  // This is a safety check - if RLS is working correctly, this should never fail
  if (decision.user_id !== user.id) {
    console.error('Decision Detail: User ID mismatch (RLS violation?):', {
      decisionId: id,
      decisionUserId: decision.user_id,
      currentUserId: user.id,
      table: 'decisions',
      hint: 'CRITICAL: Decision returned but user_id does not match - possible RLS bypass',
    })
    notFound()
  }

  // Fetch related data (always fetch, even if Pro gated)
  const { data: options, error: optionsError } = await supabase
    .from('options')
    .select('*')
    .eq('decision_id', id)
    .order('total_score_int', { ascending: false })

  if (optionsError) {
    console.error('Decision Detail: Error fetching options:', {
      decisionId: id,
      error: optionsError,
      errorString: JSON.stringify(optionsError, Object.getOwnPropertyNames(optionsError), 2),
    })
  }

  const { data: outcome, error: outcomeError } = await supabase
    .from('outcomes')
    .select('*')
    .eq('decision_id', id)
    .maybeSingle() // Use maybeSingle() - decision might not have an outcome yet

  if (outcomeError) {
    console.error('Decision Detail: Error fetching outcome:', {
      decisionId: id,
      error: outcomeError,
      errorString: JSON.stringify(outcomeError, Object.getOwnPropertyNames(outcomeError), 2),
    })
  }

  // Log successful data fetch for debugging
  console.log('Decision Detail: Data fetched successfully:', {
    decisionId: id,
    hasDecision: !!decision,
    hasOptions: !!options && options.length > 0,
    optionsCount: options?.length || 0,
    hasOutcome: !!outcome,
    decisionStatus: decision.status,
    computedStatus: decision.decided_at && !outcome ? 'decided' : outcome ? 'completed' : 'open',
  })

  // Pro gating: Check if decision is older than 7 days
  // Use created_at for the 7-day check (not date field)
  // If older AND not Pro, show paywall component (UI layer), don't redirect
  const decisionCreatedAt = new Date(decision.created_at)
  const isOlderThan7Days = !isWithinFreeTier(decisionCreatedAt)
  const showPaywall = isOlderThan7Days && !plan.isPro

  // Ensure we have valid data before rendering
  if (!decision) {
    console.error('Decision Detail: Decision is null after fetch')
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-sm text-[var(--text-muted)]">Loading decision...</div>
      </div>
    }>
      {showPaywall ? (
        <DecisionDetailWithPaywall
          decision={decision}
          options={options || []}
          outcome={outcome || null}
          chosenOptionId={decision.chosen_option_id || null}
        />
      ) : (
        <DecisionDetail
          decision={decision}
          options={options || []}
          outcome={outcome || null}
          chosenOptionId={decision.chosen_option_id || null}
        />
      )}
    </Suspense>
  )
}

