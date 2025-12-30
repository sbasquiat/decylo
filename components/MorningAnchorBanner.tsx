'use client'

import Link from 'next/link'
import { Card } from './ui/Card'
import { PrimaryButton } from './ui/Button'

interface MorningAnchorBannerProps {
  onDismiss: () => void
}

export default function MorningAnchorBanner({ onDismiss }: MorningAnchorBannerProps) {
  return (
    <Card className="p-4 border-[rgba(79,124,255,0.25)] bg-[rgba(79,124,255,0.12)] mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1">What decision are you facing today?</h3>
          <p className="text-xs text-[var(--text-muted)]">
            One small decision is enough to move forward.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/new">
            <PrimaryButton className="text-xs h-9 px-4">Add today's decision</PrimaryButton>
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
  )
}


