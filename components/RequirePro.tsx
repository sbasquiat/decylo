'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'

interface RequireProProps {
  children: ReactNode
  isPro: boolean
  reason?: string
  blur?: boolean
  message?: string
  cta?: string
}

export default function RequirePro({
  children,
  isPro,
  reason = 'feature',
  blur = true,
  message,
  cta = 'Unlock Pro',
}: RequireProProps) {
  const router = useRouter()

  if (isPro) {
    return <>{children}</>
  }

  const defaultMessage = message || "This feature is available in Pro. Upgrade to unlock your full decision intelligence."

  const handleUpgrade = () => {
    console.log('upgrade_clicked', { reason })
    router.push('/upgrade')
  }

  return (
    <div className="relative">
      {blur && (
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
      )}
      <div className={blur ? 'absolute inset-0 flex items-center justify-center' : ''}>
        <Card className={blur ? 'max-w-md mx-4 p-6' : 'p-6'}>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                Unlock Pro Features
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {defaultMessage}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <PrimaryButton onClick={handleUpgrade} className="flex-1">
                {cta}
              </PrimaryButton>
              <SecondaryButton
                onClick={() => router.back()}
                className="flex-1"
              >
                Go back
              </SecondaryButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


