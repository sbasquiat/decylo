'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { PrimaryButton } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function UpgradeButton({ priceType }: { priceType: 'monthly' | 'yearly' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const priceId = priceType === 'monthly' 
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY

      if (!priceId) {
        alert('Stripe price not configured. Please contact support.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const { url, error } = await response.json()

      if (error) {
        alert(error)
        setLoading(false)
        return
      }

      if (url) {
        window.location.href = url
      } else {
        alert('Failed to create checkout session. Please try again.')
        setLoading(false)
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (priceType === 'monthly') {
    return (
      <PrimaryButton onClick={handleUpgrade} disabled={loading} className="w-full">
        {loading ? 'Loading...' : 'Upgrade to Pro'}
      </PrimaryButton>
    )
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full py-2 px-4 text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-xl hover:bg-[var(--primary)] hover:text-white transition-colors disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Get Pro Annual'}
    </button>
  )
}

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin?returnTo=/upgrade')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single()

      if (profile?.is_pro) {
        router.push('/app')
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-sm text-[var(--text-muted)]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            href="/app"
            className="text-sm text-[var(--primary)] hover:opacity-90 mb-4 inline-block"
          >
            ← Back to app
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text)] mb-4">
            Turn experience into better judgment.
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            You already make decisions every day.
            <br />
            Decylo Pro helps you learn from them and compound your thinking over time.
          </p>
        </div>

        {/* What Pro unlocks */}
        <Card className="mb-8">
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-[var(--text)]">What Pro unlocks</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">Full Decision History</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  See every decision you've made — not just the last 7 days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">Decision Health Engine</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Measure how well your confidence matches reality and how your judgment is evolving.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">Judgment Profile</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Discover your decision-making style, blind spots, and strengths.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">Decision Trajectory</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Track momentum, consistency, and improvement across life categories.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">Weekly Review</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  A guided reflection that turns last week's decisions into next week's progress.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--text)] mb-1">Exports & Advanced Filters</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Your decisions, portable. Your patterns, visible.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Why people upgrade */}
        <div className="mb-8 text-center">
          <p className="text-lg text-[var(--text-muted)] italic">
            "Decylo doesn't tell me what to do.
            <br />
            It teaches me how to think better."
          </p>
        </div>

        {/* Pricing */}
        <Card className="mb-8">
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[var(--text)] mb-2">Pro — €10/month</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                or €89/year (save 2 months)
              </p>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Start compounding your judgment today.
              </p>
            </div>

            <UpgradeButton priceType="monthly" />
            <UpgradeButton priceType="yearly" />
          </div>
        </Card>

        {/* Comparison Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[var(--text)] mb-6 text-center">
              Free vs Pro Comparison
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--text)]">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-[var(--text)]">Free</th>
                    <th className="text-center py-3 px-4 font-semibold text-[var(--text)]">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Create unlimited decisions</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Log outcomes & check-ins</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Timeline (last 7 days)</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Full decision history</td>
                    <td className="py-3 px-4 text-center text-[var(--text-muted)]">—</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Decision Health engine</td>
                    <td className="py-3 px-4 text-center text-[var(--text-muted)]">—</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Judgment Profile</td>
                    <td className="py-3 px-4 text-center text-[var(--text-muted)]">—</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Decision Trajectory metrics</td>
                    <td className="py-3 px-4 text-center text-[var(--text-muted)]">—</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Weekly Review</td>
                    <td className="py-3 px-4 text-center text-[var(--text-muted)]">—</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Advanced filters & search</td>
                    <td className="py-3 px-4 text-center text-[var(--text-muted)]">—</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-[var(--text)]">Export decisions</td>
                    <td className="py-3 px-4 text-center text-[var(--text-muted)]">—</td>
                    <td className="py-3 px-4 text-center text-[rgba(59,214,113,0.9)]">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Free helps you decide.
                <br />
                Pro helps you become better at deciding.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

