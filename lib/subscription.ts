import { createClient } from '@/lib/supabase/server'

export interface UserPlan {
  isPro: boolean
  subscriptionStatus?: string
}

/**
 * Get user's plan status (server-side only)
 * Returns { isPro: boolean } based on subscription status
 */
export async function getUserPlan(): Promise<UserPlan> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isPro: false }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, stripe_subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { isPro: false }
  }

  // is_pro is the source of truth (updated via webhook)
  return {
    isPro: profile.is_pro || false,
    subscriptionStatus: profile.stripe_subscription_status || null,
  }
}

/**
 * Check if a date is within the free tier limit (last 7 days)
 */
export function isWithinFreeTier(date: string | Date): boolean {
  const decisionDate = typeof date === 'string' ? new Date(date) : date
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  decisionDate.setHours(0, 0, 0, 0)
  return decisionDate >= sevenDaysAgo
}


