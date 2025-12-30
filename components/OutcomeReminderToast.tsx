'use client'

import Link from 'next/link'
import { Card } from './ui/Card'
import { PrimaryButton } from './ui/Button'

interface OutcomeReminderToastProps {
  decisionId: string
  decisionTitle: string
  onDismiss: () => void
}

export default function OutcomeReminderToast({
  decisionId,
  decisionTitle,
  onDismiss,
}: OutcomeReminderToastProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 border-[rgba(255,176,32,0.25)] bg-[rgba(255,176,32,0.12)] shadow-lg">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Close yesterday's decision loop</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Log the outcome — this is where the learning happens.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)] font-medium line-clamp-1">
              {decisionTitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/app/decision/${decisionId}?logOutcome=true`} className="flex-1">
              <PrimaryButton className="w-full text-xs h-9">Log outcome</PrimaryButton>
            </Link>
            <button
              onClick={onDismiss}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-2"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}


