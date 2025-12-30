'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { useRouter } from 'next/navigation'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  reason: 'history' | 'insights' | 'export'
}

export default function PaywallModal({ isOpen, onClose, reason }: PaywallModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const getContent = () => {
    switch (reason) {
      case 'history':
        return {
          title: 'Keep your full decision history',
          body: 'Free includes 7 days. Pro keeps everything — so you can learn from patterns over time.',
          bullets: [
            'Unlimited decision history',
            'Decision Health: DQI, growth, calibration',
            'Category intelligence',
            'Export anytime',
          ],
        }
      case 'insights':
        return {
          title: 'Unlock Decision Health',
          body: 'Pro shows how your judgment is changing — not just what you did.',
          bullets: [
            'Decision Quality Index (DQI)',
            'Judgment Growth Rate',
            'Confidence Calibration',
            'Category Intelligence',
          ],
        }
      case 'export':
        return {
          title: 'Export is a Pro feature',
          body: 'Keep your decisions portable. Your data stays yours.',
          bullets: [
            'Export to CSV',
            'Export to PDF (coming soon)',
            'Unlimited decision history',
            'Full data portability',
          ],
        }
    }
  }

  const content = getContent()

  const handleUpgrade = async () => {
    setLoading(true)
    console.log('upgrade_started')
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{content.title}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{content.body}</p>
          </div>

          <ul className="space-y-2">
            {content.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-[var(--primary)] mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <PrimaryButton onClick={handleUpgrade} disabled={loading} className="w-full">
              {loading ? 'Loading...' : 'Upgrade to Pro (€10/month)'}
            </PrimaryButton>
            <SecondaryButton onClick={onClose} className="w-full">
              Not now
            </SecondaryButton>
          </div>

          <p className="text-center text-xs text-[var(--text-muted)]">
            Pro is for people who take their decisions seriously.
            <br />
            No ads. No selling data. Cancel anytime.
          </p>
        </div>
      </Card>
    </div>
  )
}

