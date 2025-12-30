'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import DecisionDetail from './DecisionDetail'
import { Card, CardHeader, CardBody } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { Decision, Option, Outcome } from '@/lib/db/types'
import { formatCategory } from '@/lib/category-format'

interface DecisionDetailWithPaywallProps {
  decision: Decision
  options: Option[]
  outcome: Outcome | null
  chosenOptionId: string | null
}

export default function DecisionDetailWithPaywall({
  decision,
  options,
  outcome,
  chosenOptionId,
}: DecisionDetailWithPaywallProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Log paywall shown
  useEffect(() => {
    console.log('paywall_shown', { reason: 'history', decisionId: decision.id })
  }, [decision.id])

  const handleUnlockPro = async () => {
    setLoading(true)
    console.log('upgrade_clicked', { source: 'decision_detail' })
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
        }),
      })

      if (!response.ok) {
        throw new Error('Checkout failed')
      }

      const { url } = await response.json()
      if (url) {
        console.log('upgrade_completed')
        window.location.href = url
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      setLoading(false)
    }
  }

  const handleBackToTimeline = () => {
    router.push('/app/timeline')
  }

  // Format decision date
  const decisionDate = decision.decided_at
    ? format(new Date(decision.decided_at), 'MMMM d, yyyy')
    : format(new Date(decision.date), 'MMMM d, yyyy')

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER - Visible */}
        <div className="mb-8">
          <Link
            href="/app/timeline"
            className="text-sm text-[var(--primary)] hover:opacity-90 mb-4 inline-block"
          >
            ← Back to Timeline
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">{decision.title}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {decision.decided_at
                ? `Decided on ${decisionDate} · Category: ${formatCategory(decision.category)}`
                : `Created on ${format(new Date(decision.date), 'MMMM d, yyyy')} · Category: ${formatCategory(decision.category)}`
              }
            </p>
          </div>
        </div>

        {/* Blurred Decision Detail Content */}
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none opacity-50">
            <DecisionDetail
              decision={decision}
              options={options}
              outcome={outcome}
              chosenOptionId={chosenOptionId}
            />
          </div>

          {/* Paywall Card Overlay */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader
                title="Unlock your full decision history"
                subtitle="Free includes 7 days. Pro keeps everything — so you can learn from patterns over time."
              />
              <CardBody>
                <div className="space-y-4">
                  <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>Unlimited decision history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>Decision Health: DQI, growth, calibration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>Category intelligence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>Export anytime</span>
                    </li>
                  </ul>

                  <div className="space-y-3 pt-2">
                    <PrimaryButton
                      onClick={handleUnlockPro}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Loading...' : 'Unlock Pro'}
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={handleBackToTimeline}
                      className="w-full"
                    >
                      Back to Timeline
                    </SecondaryButton>
                  </div>

                  <p className="text-center text-xs text-[var(--text-muted)] pt-2">
                    No ads. No selling data. Cancel anytime.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

