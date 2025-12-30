'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { PrimaryButton } from './ui/Button'
import PaywallModal from './PaywallModal'

interface InsightsLockProps {
  title: string
  children: React.ReactNode
}

export default function InsightsLock({ title, children }: InsightsLockProps) {
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      <div className="relative">
        {/* Blurred content - shows what they're missing */}
        <div className="blur-sm select-none pointer-events-none">{children}</div>
        
        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Card className="p-6 max-w-md mx-auto border-[rgba(79,124,255,0.25)] bg-[var(--surface)]/95 backdrop-blur-md">
            <div className="text-center space-y-4">
              <h3 className="text-base font-semibold">Unlock Decision Health</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Pro shows how your judgment is changing — not just what you did.
                <br />
                <span className="text-xs italic mt-1 block">Pro is for people who take their decisions seriously.</span>
              </p>
              <PrimaryButton
                onClick={() => {
                  setShowPaywall(true)
                  console.log('paywall_shown', { reason: 'insights' })
                }}
                className="w-full"
              >
                Upgrade to Pro
              </PrimaryButton>
            </div>
          </Card>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-[var(--text-muted-2)]">
        Pro users improve decision quality over time.
      </p>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="insights"
      />
    </>
  )
}

