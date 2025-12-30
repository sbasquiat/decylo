'use client'

import { useRouter } from 'next/navigation'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  reason?: string
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = "Unlock Pro Features",
  message = "You're starting to build a Decision Health profile. Unlock Pro to see it.",
  reason = 'outcome_3',
}: UpgradeModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleUpgrade = () => {
    console.log('upgrade_clicked', { reason })
    router.push('/upgrade')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] mb-2">
              {title}
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {message}
            </p>
          </div>

          <div className="space-y-3">
            <PrimaryButton onClick={handleUpgrade} className="w-full">
              Upgrade to Pro
            </PrimaryButton>
            <SecondaryButton onClick={onClose} className="w-full">
              Maybe later
            </SecondaryButton>
          </div>

          <p className="text-xs text-center text-[var(--text-muted-2)]">
            Pro is for people who take their decisions seriously.
          </p>
        </div>
      </Card>
    </div>
  )
}


