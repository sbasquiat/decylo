'use client'

import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { useRouter } from 'next/navigation'

interface WeeklyReflectionModalProps {
  isOpen: boolean
  onClose: () => void
  decisionCount: number
}

export default function WeeklyReflectionModal({
  isOpen,
  onClose,
  decisionCount,
}: WeeklyReflectionModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleViewInsights = () => {
    router.push('/app/insights')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your week in decisions</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              You made {decisionCount} decision{decisionCount !== 1 ? 's' : ''} this week. Want to
              see how your judgment is evolving?
            </p>
          </div>

          <div className="space-y-3">
            <PrimaryButton onClick={handleViewInsights} className="w-full">
              View Insights
            </PrimaryButton>
            <SecondaryButton onClick={onClose} className="w-full">
              Not now
            </SecondaryButton>
          </div>
        </div>
      </Card>
    </div>
  )
}


