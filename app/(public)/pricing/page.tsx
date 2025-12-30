'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

export default function PricingPage() {
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [loadingYearly, setLoadingYearly] = useState(false)

  const handleUpgrade = async (priceId: string, setLoading: (val: boolean) => void) => {
    setLoading(true)
    console.log('upgrade_clicked', { priceId })
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      if (!response.ok) {
        throw new Error('Checkout failed')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-xl text-[var(--text-muted)]">
            Make better decisions. Every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card>
            <CardHeader title="Free" subtitle="For getting started." />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold mb-1">€0</div>
                  <div className="text-sm text-[var(--text-muted)]">/ month</div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold mb-2">Includes:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Daily decision capture</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Option evaluation</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Decision timeline</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Outcome tracking</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">7-day history</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Basic insights</p>
                    </div>
                  </div>
                </div>
                <Link href="/signup" className="block">
                  <Button variant="secondary" className="w-full">
                    Start Free
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Pro Plan */}
          <Card className="border-[rgba(79,124,255,0.25)]">
            <CardHeader
              title="Pro"
              subtitle="Pro is for people who take their decisions seriously."
              right={
                <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-[rgba(79,124,255,0.12)] text-white border border-[rgba(79,124,255,0.25)]">
                  Most Popular
                </span>
              }
            />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold mb-1">€10</div>
                  <div className="text-sm text-[var(--text-muted)]">/ month</div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold mb-2">Everything in Free, plus:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">
                        Unlimited decision history
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">
                        Advanced insights & trends
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Decision templates</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">
                        Export decisions (CSV/PDF)
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Priority feature access</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">
                        Early access to AI insights (coming soon)
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    handleUpgrade(
                      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
                      setLoadingMonthly
                    )
                  }
                  disabled={loadingMonthly}
                >
                  {loadingMonthly ? 'Loading...' : 'Upgrade to Pro (€10/month)'}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    handleUpgrade(
                      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
                      setLoadingYearly
                    )
                  }
                  disabled={loadingYearly}
                >
                  {loadingYearly ? 'Loading...' : 'Get Pro Annual (€89/year)'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Teams Plan */}
          <Card>
            <CardHeader title="Teams" subtitle="For founders & teams who decide together." />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold mb-1">From €25</div>
                  <div className="text-sm text-[var(--text-muted)]">/ user / month</div>
                  <div className="mt-2">
                    <span className="px-3 py-1 text-xs font-semibold rounded-xl bg-[rgba(255,176,32,0.12)] text-white border border-[rgba(255,176,32,0.25)]">
                      Coming Soon
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold mb-2">Includes:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Shared decision spaces</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Team decision logs</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">
                        Collaboration & comments
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Org-level insights</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">•</span>
                      <p className="text-sm text-[var(--text-muted)]">Role permissions</p>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" className="w-full" disabled>
                  Join Waitlist
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Pricing Footer */}
        <div className="mt-16 text-center space-y-2">
          <p className="text-sm text-[var(--text-muted)]">No ads.</p>
          <p className="text-sm text-[var(--text-muted)]">No selling data.</p>
          <p className="text-sm text-[var(--text-muted)]">Cancel anytime.</p>
        </div>
    </div>
  )
}

