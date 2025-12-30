'use client'

import { useRouter } from 'next/navigation'
import { Card } from './ui/Card'
import { PrimaryButton } from './ui/Button'

interface UpgradePromptProps {
  reason?: string
  message?: string
}

export default function UpgradePrompt({
  reason = 'timeline',
  message = "You've reached the 7-day limit. Upgrade to Pro to unlock your full decision history.",
}: UpgradePromptProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    console.log('upgrade_clicked', { reason })
    router.push('/upgrade')
  }

  return (
    <Card className="border-[rgba(79,124,255,0.25)] bg-[rgba(79,124,255,0.05)]">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
            Unlock your full decision history
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {message}
          </p>
        </div>
        <PrimaryButton onClick={handleUpgrade} className="w-full sm:w-auto">
          Upgrade to Pro
        </PrimaryButton>
      </div>
    </Card>
  )
}


