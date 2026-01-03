'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import AuthNavbar from '@/components/AuthNavbar'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (priceId: string, label: string) => {
    setLoading(priceId)
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
      console.error('Upgrade error:', error)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AuthNavbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text)]">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Pro is for people who take their decisions seriously.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card>
            <CardHeader title="Free" />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold text-[var(--text)]">€0</div>
                  <div className="text-sm text-[var(--text-muted)]">Forever free</div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] mt-0.5">✓</span>
                    <span>Unlimited decisions</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] mt-0.5">✓</span>
                    <span>7-day decision history</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] mt-0.5">✓</span>
                    <span>Basic insights</span>
                  </li>
                </ul>

                <Link href="/signup" className="block">
                  <Button variant="secondary" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Pro Plan */}
          <Card className="border-[rgba(79,124,255,0.25)] bg-gradient-to-b from-white/[0.05] to-white/[0.02]">
            <CardHeader title="Pro" />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold text-[var(--text)]">€10</div>
                  <div className="text-sm text-[var(--text-muted)]">per month</div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] mt-0.5">✓</span>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] mt-0.5">✓</span>
                    <span>Full decision history</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] mt-0.5">✓</span>
                    <span>Judgment Profile & Trajectory</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] mt-0.5">✓</span>
                    <span>Weekly Review & exports</span>
                  </li>
                </ul>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(
                      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
                      'monthly'
                    )}
                    disabled={!!loading}
                  >
                    {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
                      ? 'Loading...'
                      : 'Get Pro Monthly'}
                  </Button>
                  {process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleUpgrade(
                        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || '',
                        'annual'
                      )}
                      disabled={!!loading}
                    >
                      {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL
                        ? 'Loading...'
                        : 'Get Pro Annual'}
                    </Button>
                  )}
                </div>

                <p className="text-xs text-center text-[var(--text-muted)]">
                  No ads. No selling data. Cancel anytime.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Questions? <Link href="/contact" className="text-[var(--accent)] hover:opacity-90">Contact us</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

